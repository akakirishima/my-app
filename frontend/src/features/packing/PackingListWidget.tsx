import React, { useMemo } from "react";
import { useGeolocation } from "../weather/hooks/useGeolocation";
import { useOpenMeteoCurrent } from "../weather/hooks/useOpenMeteo";

// 位置情報がNGのときのフォールバック（宮崎）
const FALLBACK = { lat: 31.91, lon: 131.42, name: "宮崎" } as const;

// Open‑Meteo weathercode の簡易カテゴリ分け
function isSunny(code: number | null): boolean {
  if (code == null) return false;
  return code === 0 || code === 1; // 快晴/晴れ
}
function isCloudyOrLightRain(code: number | null): boolean {
  if (code == null) return false;
  // 曇り系・霧・弱い雨・にわか雨
  const cloudy = [2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 80, 81, 82];
  return cloudy.includes(code);
}

function recommendItems(tempC: number | null, windMps: number | null, code: number | null): string[] {
  const items = new Set<string>();

  if (tempC != null && tempC >= 25) {
    ["水筒／ペットボトル", "タオル", "日焼け止め", "帽子 or 日傘", "サングラス"].forEach((i) => items.add(i));
  }
  if (windMps != null && windMps >= 5) {
    ["飛ばされにくい帽子（紐付きが◎）", "体温調整できる上着", "リップクリーム"].forEach((i) => items.add(i));
  }
  if (isSunny(code)) {
    ["日焼け止め", "サングラス", "UVカットの薄手上着"].forEach((i) => items.add(i));
  }
  if (isCloudyOrLightRain(code)) {
    ["折りたたみ傘", "レインコート"].forEach((i) => items.add(i));
  }

  return Array.from(items);
}

export default function PackingListWidget() {
  // 天気情報（現在地ベース）を取得
  const { coords } = useGeolocation(FALLBACK);
  const { temperature, windspeed, weathercode, loading } = useOpenMeteoCurrent(coords);

  const recommended = useMemo(
    () => recommendItems(temperature, windspeed, weathercode),
    [temperature, windspeed, weathercode]
  );

  return (
    <div className="card card--glass hover-lift">
      <h2 className="card__title">持ち物（おすすめ）</h2>

      {loading ? (
        <p className="small" style={{ margin: 0 }}>おすすめ計算中…</p>
      ) : recommended.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {recommended.map((it) => (
            <li key={it} style={{ marginBottom: 6 }}>{it}</li>
          ))}
        </ul>
      ) : (
        <p className="small" style={{ margin: 0 }}>いまの天気では追加のおすすめはありません</p>
      )}
    </div>
  );
}