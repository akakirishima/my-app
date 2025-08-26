import { useEffect, useMemo, useState } from "react";

type Coords = { lat: number; lon: number };
const FALLBACK: Coords = { lat: 31.91, lon: 131.42 };

// 天気分類
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

type Item = { key: string; label: string; img?: string; emoji?: string };

export default function PackingListWidget(): JSX.Element {
  const [coords, setCoords] = useState<Coords>(FALLBACK);
  const [code, setCode] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
    );
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=Asia%2FTokyo`;
    (async () => {
      try {
        const r = await fetch(url, { signal: ac.signal });
        if (!r.ok) throw new Error("weather fetch failed");
        const j = await r.json();
        setCode(typeof j?.current_weather?.weathercode === "number" ? j.current_weather.weathercode : null);
      } catch {}
    })();
    return () => ac.abort();
  }, [coords.lat, coords.lon]);

  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  const kind = classify(code);

  const { required, recommended } = useMemo(() => {
    const req: Item[] = [];
    const rec: Item[] = [];

    // 必須
    if (isDay) req.push({ key: "sunblock", label: "日焼け止め", img: "/packing/hiyakedome.png" });
    if (kind === "rain" || kind === "thunder") {
      req.push({ key: "umbrella", label: "傘", img: "/packing/kasa.png" });
    }

    // おすすめ
    rec.push({ key: "drink", label: "飲み物", img: "/packing/bottle.png" });
    if (isDay) {
      rec.push({ key: "hat", label: "帽子", img: "/packing/hat.png" });
      // 日差し強そうな時は日傘も
      if (kind === "clear" || kind === "cloudy") {
        rec.push({ key: "parasol", label: "日傘", img: "/packing/sunkasa.png" });
      }
      // サングラス画像が無いので絵文字で
      rec.push({ key: "sunglasses", label: "サングラス", emoji: "🕶️" });
    }

    return { required: req, recommended: rec };
  }, [isDay, kind]);

  const Row = ({ item }: { item: Item }) => (
    <div className="grid grid-cols-[auto_1fr] items-center gap-4">
      {item.img ? (
        <img
          src={item.img}
          alt={item.label}
          className="w-12 h-12 object-contain rounded-md bg-white/60 ring-1 ring-black/5"
          draggable={false}
        />
      ) : (
        <span className="text-3xl select-none">{item.emoji}</span>
      )}
      <div className="text-lg text-slate-700">{item.label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 必須（1件以上あるときだけ表示） */}
      {required.length > 0 && (
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
              必須
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            {required.map((i) => (
              <Row key={i.key} item={i} />
            ))}
          </div>
        </div>
      )}

      {/* おすすめ */}
      <div>
        <div className="text-slate-500 text-sm mb-3">おすすめ</div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          {recommended.map((i) => (
            <Row key={i.key} item={i} />
          ))}
        </div>
      </div>
    </div>
  );
}