import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Vehicle } from "@shared/schema";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function toApiUrl(url: string) {
  if (!API_BASE_URL) return url;
  if (!url.startsWith("/api")) return url;
  return `${API_BASE_URL}${url}`;
}

function mapVehicleFromDb(row: any): Vehicle {
  return {
    id: row.id,
    name: row.name,
    licensePlate: row.license_plate,
    model: row.model || undefined,
    status: row.status,
    ignition: row.ignition,
    currentSpeed: row.current_speed,
    speedLimit: row.speed_limit,
    heading: row.heading,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    lastUpdate: row.last_update,
    batteryLevel: row.battery_level || undefined,
  };
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function supabaseQuery(url: string) {
  if (!supabase) return undefined;

  if (url === "/api/vehicles") {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(mapVehicleFromDb);
  }

  return undefined;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(toApiUrl(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: (options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<any> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = toApiUrl(queryKey.join("/") as string);

    const supabaseResult = await supabaseQuery(url);
    if (supabaseResult !== undefined) {
      return supabaseResult as any;
    }
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
