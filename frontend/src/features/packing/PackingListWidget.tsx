import React, { useMemo } from "react";
import { useGeolocation } from "../weather/hooks/useGeolocation";
import { useOpenMeteoCurrent } from "../weather/hooks/useOpenMeteo";

// 位置情報がNGのときのフォールバック（宮崎）
const FALLBACK = { lat: 31.91, lon: 131.42, name: "宮崎" } as const;

// ラベル→アイコン画像（/public 配下）
// 画像が無いものは null（絵文字でフォールバック）
export type ItemLabel =
  | "飲み物"
  | "日焼け止め"
  | "帽子"
  | "日傘"
  | "サングラス";

const ICON_BY_LABEL: Record<ItemLabel, string | null> = {
  "飲み物": "/packing/bottle.png",
  "日焼け止め": "/packing/hiyakedome.png",
  "帽子": "/packing/hat.png",
  "日傘": "/packing/sunkasa.png",
  "サングラス": null, // 画像が無いので絵文字で代用
};

// 雨系をざっくり判定（Open‑Meteo の weathercode で使用）
const RAINY_CODES = [61, 63, 65, 80, 81, 82];
function isRainy(code: number | null): boolean {
  if (code == null) return false;
  return RAINY_CODES.includes(code);
}

// 必須 / 推奨 を分けて返す
type PackingBuckets = { required: ItemLabel[]; recommended: ItemLabel[] };

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

function computePacking(
  tempC: number | null,
  windMps: number | null,
  code: number | null
): PackingBuckets {
  const required = new Set<ItemLabel>();
  const recommended = new Set<ItemLabel>();

  // 気温: 28℃以上は飲み物を必須、25〜27.9℃は推奨
  if (tempC != null) {
    if (tempC >= 28) required.add("飲み物");
    else if (tempC >= 25) recommended.add("飲み物");
  }

  // 晴れ: 日焼け止めは必須、サングラス/帽子は推奨
  if (isSunny(code)) {
    required.add("日焼け止め");
    recommended.add("サングラス");
    recommended.add("帽子");
  }

  // 雨: 日傘（雨具）を必須 / 曇りや弱い雨は推奨
  if (isRainy(code)) {
    required.add("日傘");
  } else if (isCloudyOrLightRain(code)) {
    recommended.add("日傘");
  }

  // 風が強い: 帽子を推奨（8m/s 以上の目安）
  if (windMps != null && windMps >= 8) {
    recommended.add("帽子");
  }

  // 推奨側から必須に入っているものを除外
  const req = Array.from(required);
  const rec = Array.from(recommended).filter((i) => !required.has(i));
  return { required: req, recommended: rec };
}

export default function PackingListWidget() {
  // 天気情報（現在地ベース）を取得
  const { coords } = useGeolocation(FALLBACK);
  const { temperature, windspeed, weathercode, loading } = useOpenMeteoCurrent(coords);

  const { required, recommended } = useMemo(
    () => computePacking(temperature, windspeed, weathercode),
    [temperature, windspeed, weathercode]
  );

  return (
    <div className="card card--glass hover-lift">
      <h2 className="card__title">おすすめの持ち物</h2>

      {loading ? (
        <p className="small m-0">おすすめ計算中…</p>
      ) : (
        <>
          {required.length > 0 && (
            <section className="mt-1">
              <h3 className="text-sm font-semibold text-rose-600 mb-2 flex items-center gap-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">必須</span>
                <span className="sr-only">必須アイテム</span>
              </h3>
              <ul className="m-0 p-0 list-none grid grid-cols-2 gap-x-8 gap-y-4">
                {required.map((it) => {
                  const icon = ICON_BY_LABEL[it];
                  return (
                    <li key={`req-${it}`} className="flex items-center gap-4">
                      {icon ? (
                        <img src={icon} alt={it} className="w-12 h-12 object-contain select-none rounded-md" />
                      ) : (
                        <span className="text-4xl leading-none" aria-hidden>🕶️</span>
                      )}
                      <span className="text-sm text-slate-700 font-medium">{it}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {recommended.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-slate-500 mb-2">おすすめ</h3>
              <ul className="m-0 p-0 list-none grid grid-cols-2 gap-x-8 gap-y-4">
                {recommended.map((it) => {
                  const icon = ICON_BY_LABEL[it];
                  return (
                    <li key={`rec-${it}`} className="flex items-center gap-4">
                      {icon ? (
                        <img src={icon} alt={it} className="w-12 h-12 object-contain select-none rounded-md" />
                      ) : (
                        <span className="text-4xl leading-none" aria-hidden>🕶️</span>
                      )}
                      <span className="text-sm text-slate-600">{it}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {required.length === 0 && recommended.length === 0 && (
            <p className="small m-0">いまの天気では追加のおすすめはありません</p>
          )}
        </>
      )}
    </div>
  );
}