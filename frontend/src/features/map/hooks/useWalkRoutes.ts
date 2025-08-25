import { useEffect, useState } from "react";

export type WalkRoute = { km: number; color: string; coords: [number, number][] };
const BASE = import.meta.env.VITE_BACKEND_URL || "";

export function useWalkRoutes(coords: { lat: number; lon: number } | null) {
  const [routes, setRoutes] = useState<WalkRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true); setError(null);
        const q = new URLSearchParams({ lat: String(coords.lat), lon: String(coords.lon) });
        const res = await fetch(`${BASE}/api/walk_routes?${q}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        setRoutes(data.routes ?? []);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "fetch failed");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [coords?.lat, coords?.lon]);

  return { routes, loading, error };
}