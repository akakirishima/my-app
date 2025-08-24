import { useEffect, useState } from "react";
import type { Coords } from "./useGeolocation";

export type CurrentWeather = {
  temperature: number | null;
  weathercode: number | null;
  windspeed: number | null;
  loading: boolean;
  error: string | null;
};

export function useOpenMeteoCurrent(
  coords: Coords | null,
  { timezone = "Asia/Tokyo" }: { timezone?: string } = {}
): CurrentWeather {
  const [state, setState] = useState<CurrentWeather>({
    temperature: null, weathercode: null, windspeed: null, loading: true, error: null,
  });

  useEffect(() => {
    if (!coords) return;
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current_weather=true&timezone=${encodeURIComponent(timezone)}`;

    (async () => {
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const cw = res.ok ? (await res.json())?.current_weather ?? {} : {};
        setState({
          temperature: typeof cw.temperature === "number" ? cw.temperature : null,
          weathercode: typeof cw.weathercode === "number" ? cw.weathercode : null,
          windspeed: typeof cw.windspeed === "number" ? cw.windspeed : null,
          loading: false, error: null,
        });
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setState((s) => ({ ...s, loading: false, error: e?.message ?? "unknown error" }));
      }
    })();

    return () => ac.abort();
  }, [coords?.lat, coords?.lon, timezone]);

  return state;
}