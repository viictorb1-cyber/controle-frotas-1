import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertVehicleSchema, insertGeofenceSchema, insertAlertSchema, trackingDataSchema, insertUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import express from "express";

const clients = new Set<WebSocket>();

function broadcastVehicles(vehicles: unknown[]) {
  const message = JSON.stringify({ type: "vehicles", data: vehicles });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // onVehicleUpdate só existe no MemStorage (para simulação local)
  // SupabaseStorage usa Realtime para atualizações
  if ('onVehicleUpdate' in storage && typeof (storage as any).onVehicleUpdate === 'function') {
    (storage as any).onVehicleUpdate(broadcastVehicles);
  }

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("WebSocket client connected");

    storage.getVehicles().then(vehicles => {
      ws.send(JSON.stringify({ type: "vehicles", data: vehicles }));
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const parsed = insertVehicleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: parsed.error.errors });
      }
      const vehicle = await storage.createVehicle(parsed.data);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const parsed = insertVehicleSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: parsed.error.errors });
      }
      const vehicle = await storage.updateVehicle(req.params.id, parsed.data);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const success = await storage.deleteVehicle(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // Endpoint de rastreamento GPS - recebe dados de posição de veículos
  app.post("/api/tracking", async (req, res) => {
    try {
      const parsed = trackingDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Dados de rastreamento inválidos", 
          details: parsed.error.errors 
        });
      }

      const { licensePlate, latitude, longitude, currentSpeed } = parsed.data;
      
      // Determina o status baseado na velocidade
      const status = currentSpeed > 5 ? "moving" : currentSpeed > 0 ? "idle" : "stopped";
      const ignition = currentSpeed > 0 ? "on" : "off";
      const lastUpdate = new Date().toISOString();

      // Busca o veículo pela placa
      let vehicle = await storage.getVehicleByLicensePlate(licensePlate);
      let action: "created" | "updated" = "updated";

      if (vehicle) {
        // Atualiza o veículo existente
        vehicle = await storage.updateVehicle(vehicle.id, {
          latitude,
          longitude,
          currentSpeed,
          status,
          ignition,
          lastUpdate,
        });
      } else {
        // Cria um novo veículo com dados básicos
        vehicle = await storage.createVehicle({
          name: `Veículo ${licensePlate}`,
          licensePlate,
          status,
          ignition,
          currentSpeed,
          speedLimit: 80,
          heading: 0,
          latitude,
          longitude,
          accuracy: 5,
          lastUpdate,
        });
        action = "created";
      }

      // Salvar no histórico de rastreamento
      let trackingId: string | null = null;
      if (vehicle) {
        try {
          const trackingResult = await storage.saveTrackingPoint({
            vehicleId: vehicle.id,
            licensePlate,
            latitude,
            longitude,
            speed: currentSpeed,
            heading: 0,
            accuracy: 5,
            status,
            ignition,
            source: "mobile_app",
          });
          trackingId = trackingResult.id;
        } catch (trackingError) {
          // Log do erro mas não falha a requisição
          console.error("Erro ao salvar histórico de rastreamento:", trackingError);
        }
      }

      return res.status(action === "created" ? 201 : 200).json({
        success: true,
        action,
        vehicle,
        trackingId,
      });
    } catch (error) {
      console.error("Erro no endpoint de rastreamento:", error);
      res.status(500).json({ error: "Falha ao processar dados de rastreamento" });
    }
  });

  app.get("/api/geofences", async (req, res) => {
    try {
      const geofences = await storage.getGeofences();
      res.json(geofences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch geofences" });
    }
  });

  app.get("/api/geofences/:id", async (req, res) => {
    try {
      const geofence = await storage.getGeofence(req.params.id);
      if (!geofence) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.json(geofence);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch geofence" });
    }
  });

  app.post("/api/geofences", async (req, res) => {
    try {
      console.log("Criando geofence:", JSON.stringify(req.body, null, 2));
      const geofence = await storage.createGeofence(req.body);
      res.status(201).json(geofence);
    } catch (error) {
      console.error("Erro ao criar geofence:", error);
      res.status(500).json({ error: "Failed to create geofence" });
    }
  });

  app.patch("/api/geofences/:id", async (req, res) => {
    try {
      const geofence = await storage.updateGeofence(req.params.id, req.body);
      if (!geofence) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.json(geofence);
    } catch (error) {
      res.status(500).json({ error: "Failed to update geofence" });
    }
  });

  app.delete("/api/geofences/:id", async (req, res) => {
    try {
      const success = await storage.deleteGeofence(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete geofence" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alert = await storage.createAlert(req.body);
      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  app.post("/api/alerts/mark-all-read", async (req, res) => {
    try {
      await storage.markAllAlertsRead();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alerts as read" });
    }
  });

  app.delete("/api/alerts/clear-read", async (req, res) => {
    try {
      await storage.clearReadAlerts();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear read alerts" });
    }
  });

  // Endpoint para consultar histórico de rastreamento
  app.get("/api/tracking/history", async (req, res) => {
    try {
      const { vehicleId, startDate, endDate, limit } = req.query;
      
      if (!vehicleId || typeof vehicleId !== "string") {
        return res.status(400).json({ error: "Vehicle ID is required" });
      }
      
      const start = startDate ? String(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      const limitNum = limit ? parseInt(String(limit), 10) : 1000;
      
      const history = await storage.getTrackingHistory(vehicleId, start, end, limitNum);
      
      res.json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      console.error("Erro ao buscar histórico de rastreamento:", error);
      res.status(500).json({ error: "Failed to fetch tracking history" });
    }
  });

  app.get("/api/trips", async (req, res) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/73b858fe-22a8-4099-b86a-2ffc8204c385',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes.ts:GET /api/trips',message:'Request recebido em /api/trips',data:{query:req.query,url:req.url,params:req.params},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    try {
      const { vehicleId, startDate, endDate } = req.query;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/73b858fe-22a8-4099-b86a-2ffc8204c385',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes.ts:GET /api/trips:params',message:'Query params extraídos',data:{vehicleId,startDate,endDate,hasVehicleId:!!vehicleId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (!vehicleId || typeof vehicleId !== "string") {
        return res.status(400).json({ error: "Vehicle ID is required" });
      }
      
      const start = startDate ? String(startDate) : new Date().toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      
      const trips = await storage.getTrips(vehicleId, start, end);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/73b858fe-22a8-4099-b86a-2ffc8204c385',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes.ts:GET /api/trips:result',message:'Resultado do getTrips',data:{tripsCount:trips.length,vehicleId,start,end},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      res.json(trips);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/73b858fe-22a8-4099-b86a-2ffc8204c385',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes.ts:GET /api/trips:catch',message:'Erro no endpoint trips',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.get("/api/reports/violations", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      
      const violations = await storage.getSpeedViolations(start, end);
      res.json(violations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });

  app.get("/api/reports/speed-stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      
      const stats = await storage.getSpeedStats(start, end);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch speed stats" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
      }

      const user = await storage.getUser(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // In a real app, you would set up a session or JWT here
      // For simplicity, we'll just return the user
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    // In a real app, you would clear the session or invalidate JWT
    res.json({ message: "Logout successful" });
  });

  app.get("/api/auth/me", async (req, res) => {
    // In a real app, you would get user from session or JWT
    // For simplicity, we'll return null (not authenticated)
    res.status(401).json({ error: "Not authenticated" });
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid user data", details: parsed.error.errors });
      }

      // Check if username already exists
      const existingUser = await storage.getUser(parsed.data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const user = await storage.createUser(parsed.data);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  return httpServer;
}
