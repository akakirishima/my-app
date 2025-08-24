// frontend/src/features/weather/hooks/useGeolocation.ts
import { useCallback, useEffect, useRef, useState } from "react";

export type Coords = { lat: number; lon: number };

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 600000,
};

export function useGeolocation(
  fallback: Coords & { name?: string },
  options: PositionOptions = DEFAULT_OPTIONS
) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [label, setLabel] = useState("現在地");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // options は毎 render 新しい参照になり得るので useRef で固定
  const optionsRef = useRef<PositionOptions>(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const request = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setCoords({ lat: fallback.lat, lon: fallback.lon });
      setLabel(fallback.name ?? "フォールバック");
      setError("このブラウザでは位置情報が使えません。");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLabel("現在地");
        setLoading(false);
      },
      (err) => {
        setCoords({ lat: fallback.lat, lon: fallback.lon });
        setLabel(fallback.name ?? "フォールバック");
        setError(err?.message || "位置情報が取得できませんでした");
        setLoading(false);
      },
      optionsRef.current
    );
  }, [fallback.lat, fallback.lon, fallback.name]);

  // 初回のみ要求（StrictMode 下では dev で2回呼ばれることがあります）
  useEffect(() => { request(); }, [request]);

  return { coords, label, loading, error, request };
}
