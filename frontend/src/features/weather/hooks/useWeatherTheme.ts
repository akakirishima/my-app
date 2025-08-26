// frontend/src/features/weather/hooks/useWeatherTheme.ts
import { useMemo } from "react";
import { useGeolocation } from "./useGeolocation";
import { useOpenMeteoCurrent } from "./useOpenMeteo";

// 宮崎をフォールバック
const FALLBACK = { lat: 31.91, lon: 131.42, name: "宮崎" } as const;

type Kind  = "clear" | "cloudy" | "rain" | "snow" | "thunder";
type Phase = "night" | "dawn" | "day" | "dusk";

export type SkyTheme =
  | `${Phase}-clear`
  | `${Phase}-cloudy`
  | `${Phase}-rain`
  | `${Phase}-snow`
  | `${Phase}-thunder`;

// Open-Meteo weathercode → Kind
function classify(code: number | null): Kind {
  if (code == null) return "cloudy";
  if ([0].includes(code)) return "clear";
  if ([1, 2].includes(code)) return "clear";
  if ([3, 45, 48].includes(code)) return "cloudy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "cloudy";
}

// 角度用: 0..1 を a..b へ線形補間
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// 時間の 0..24h を 0..1 に
const dayFrac = (h: number, m: number) => ((h + m / 60) % 24) / 24;

type AngleStyle = React.CSSProperties & { ["--bg-angle"]?: string };

export default function useWeatherTheme() {
  const coords = useGeolocation(FALLBACK);
  const { weathercode } = useOpenMeteoCurrent(coords);

  const theme = useMemo(() => {
    // 1) Phase の決定（時刻ベース）
    const now   = new Date();
    const hour  = now.getHours();
    const mins  = now.getMinutes();
    const frac  = dayFrac(hour, mins);

    // ザックリ：5–7時 = dawn、7–17時 = day、17–19時 = dusk、その他 = night
    let phase: Phase;
    if (hour >= 5 && hour < 7) phase = "dawn";
    else if (hour >= 7 && hour < 17) phase = "day";
    else if (hour >= 17 && hour < 19) phase = "dusk";
    else phase = "night";

    // 2) Kind の決定（Open-Meteo の weathercode）
    const kind = classify(weathercode ?? null);

    // 3) 角度を少し揺らす（iPhone天気っぽく）
    // 一日を通して 160deg↔200deg を往復するイメージ
    const angleDeg = lerp(160, 200, (Math.sin(frac * Math.PI * 2) + 1) / 2);
    const angleStyle: AngleStyle = { ["--bg-angle"]: `${Math.round(angleDeg)}deg` };

    // 4) オーバーレイ（星・雨・雪・稲光）
    const overlays = {
      stars: phase === "night",
      rain: kind === "rain" || kind === "thunder",
      snow: kind === "snow",
      flash: kind === "thunder",
    };

    return {
      className: `${phase}-${kind}` as SkyTheme,
      angleStyle,
      overlays,
    };
  }, [weathercode]);

  return theme;
}