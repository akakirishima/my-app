import { useEffect, useState } from "react";

type Coords = { lat: number; lon: number; label?: string };

// デフォルトは宮崎
const FALLBACK: Coords = { lat: 31.91, lon: 131.42, label: "現在地" };

// Open-Meteo の weathercode をざっくり分類
type Kind = "clear" | "cloudy" | "rain" | "snow" | "thunder";
function classify(code: number | null): Kind {
  if (code == null) return "cloudy";
  if ([0, 1, 2].includes(code)) return "clear";
  if ([3, 45, 48].includes(code)) return "cloudy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "cloudy";
}

function iconSrc(kind: Kind, isNight: boolean): string {
  if (isNight && kind === "clear") return "/weather/moon.png";
  if (kind === "clear") return "/weather/sun.png";
  if (kind === "rain" || kind === "thunder") return "/weather/rain.png";
  // snow 用の画像がなければ雲で代用
  if (kind === "snow") return "/weather/cloud.png";
  return "/weather/cloud.png";
}

export default function WeatherWidget(): JSX.Element {
  const [coords, setCoords] = useState<Coords>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number | null>(null);
  const [wind, setWind] = useState<number | null>(null);

  // 位置情報（取れたら使う）
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "現在地",
        });
      },
      () => {
        // 失敗しても FALLBACK のまま
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
    );
  }, []);

  // 逆ジオコーディングで「宮崎市」などの地名ラベルを取得
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // BigDataCloud: APIキー不要・CORS可。日本語で取得
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=ja`;
        const res = await fetch(url);
        if (!res.ok) return;
        const j = await res.json();
        const name: string | undefined =
          j.city || j.locality || j.town || j.village || j.suburb || j.principalSubdivision;
        if (!cancelled && name) {
          // 既に同じラベルなら何もしない
          setCoords((c) => (c.label === name ? c : { ...c, label: name }));
        }
      } catch {
        // 失敗時は何もしない（"現在地" のまま）
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon]);

  // 逆ジオコーディングで「宮崎市」などの地名ラベルを取得
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // BigDataCloud: APIキー不要・CORS可。日本語で取得
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=ja`;
        const res = await fetch(url);
        if (!res.ok) return;
        const j = await res.json();
        const name: string | undefined =
          j.city || j.locality || j.town || j.village || j.suburb || j.principalSubdivision;
        if (!cancelled && name) {
          // 既に同じラベルなら何もしない
          setCoords((c) => (c.label === name ? c : { ...c, label: name }));
        }
      } catch {
        // 失敗時は何もしない（"現在地" のまま）
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon]);

  // 天気取得
  useEffect(() => {
    const ac = new AbortController();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=Asia%2FTokyo`;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        const cw = json?.current_weather;
        setTemp(typeof cw?.temperature === "number" ? cw.temperature : null);
        setCode(typeof cw?.weathercode === "number" ? cw.weathercode : null);
        setWind(typeof cw?.windspeed === "number" ? cw.windspeed : null);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "unknown error");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [coords.lat, coords.lon]);

  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 18;
  const kind = classify(code);
  const img = iconSrc(kind, isNight);

  return (
    <div className="h-full">
      {/* keep a reasonable minimum height so the icon can grow and the block can center nicely */}
      <div className="min-h-[150px] sm:min-h-[180px] flex h-full items-center justify-center gap-6">
        <img
          src={img}
          alt={kind}
          /* make the image fill the available (inner) card height */
          className="h-full max-h-[180px] w-auto object-contain select-none"
          draggable={false}
        />
        <div className="text-center">
          <h3 className="text-base font-semibold mb-1">{coords.label ?? "現在地"}</h3>
          {loading && <p className="text-sm text-slate-500">読み込み中…</p>}
          {error && <p className="text-sm text-red-600">取得エラー：{error}</p>}
          {!loading && !error && (
            <>
              <div className="text-4xl font-semibold">
                {temp != null ? `${Math.round(temp)}°C` : "— °C"}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                風 {wind != null ? `${Math.round(wind)} m/s` : "— m/s"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}