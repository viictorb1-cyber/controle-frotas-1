import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

let cachedApp: express.Express | null = null;
let cachedInit: Promise<void> | null = null;

async function getApp() {
  if (cachedApp) return cachedApp;

  const app = express();
  const httpServer = createServer(app);

  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  cachedInit =
    cachedInit ??
    registerRoutes(httpServer, app, { enableWebSocket: false }).then(() => undefined);
  await cachedInit;

  cachedApp = app;
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
