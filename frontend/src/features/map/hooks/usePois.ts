import { useEffect, useState } from "react";

export type Poi = {
  id: string;
  name: string;
  type: "cafe" | "restaurant" | "convenience" | "park" | "attraction" | "other";
  lat: number;
  lon: number;
};

type Coords = { lat: number; lng: number };

export default function usePois(
  center: Coords | null,
  types: string[] = ["cafe", "attraction"],
  radius = 1000
) {
  const [data, setData] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!center) return;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({
          lat: String(center.lat),
          lon: String(center.lng),
          radius: String(radius),
          types: types.join(","),
        });
        const res = await fetch(`/api/pois?${q.toString()}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        setData(Array.isArray(json.features) ? json.features : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "unknown error");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [center?.lat, center?.lng, radius, types.join(",")]);

  return { data, loading, error };
}