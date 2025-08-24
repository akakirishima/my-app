import { useOpenMeteoCurrent } from "./hooks/useOpenMeteo";
import { useGeolocation } from "./hooks/useGeolocation";

const FALLBACK = { lat: 31.91, lon: 131.42, name: "宮崎" } as const;

const codeToEmoji: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌦️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️",
  80: "🌧️", 81: "🌧️", 82: "🌧️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

export default function WeatherWidget() {
  const { coords, label, loading: geoLoading, error: geoError } = useGeolocation(FALLBACK);
  const { temperature, weathercode, windspeed, loading, error } = useOpenMeteoCurrent(coords);

  return (
    <div className="card card--glass hover-lift">
      <h2 className="card__title">天気（{label}）</h2>

      {geoLoading && <p className="small">現在地を取得中…</p>}
      {!geoLoading && geoError && (
        <p className="small" style={{ color: "#9a6b00" }}>位置情報が使えないため「{FALLBACK.name}」で表示中</p>
      )}

      {loading && <p className="small">天気を読み込み中…</p>}
      {error && <p className="small" style={{ color: "#dc2626" }}>取得エラー：{error}</p>}

      {!loading && !error && (
        <div>
          <div className="large" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{weathercode !== null ? (codeToEmoji[weathercode] ?? "☁️") : "—"}</span>
            <span>{temperature !== null ? Math.round(temperature) + "°C" : "— °C"}</span>
          </div>
          <div className="small" style={{ marginTop: 4 }}>風 {windspeed !== null ? Math.round(windspeed) + " m/s" : "— m/s"}</div>
        </div>
      )}
    </div>
  );
}