import MapWidget from "../features/map/MapWidget";
import WeatherWidget from "../features/weather/WeatherWidget";
import PackingListWidget from "../features/packing/PackingListWidget";
import useWeatherTheme from "../features/weather/hooks/useWeatherTheme";

export default function Home() {
  const { className, angleStyle, overlays } = useWeatherTheme();

  return (
    <div className={`sky ${className}`} style={angleStyle as any}>
      {/* オーバーレイ */}
      {overlays.stars && <div className="sky-stars" />}
      {overlays.rain  && <div className="sky-rain" />}
      {overlays.snow  && <div className="sky-snow" />}
      {overlays.flash && <div className="sky-flash" />}

      <div className="sky-content page">
        <MapWidget />

        <div className="two-col">
          {/* ← カードは親だけ */}
          <div className="card card--glass hover-lift">
            <WeatherWidget />
          </div>
          <div className="card card--glass hover-lift">
            <PackingListWidget />
          </div>
        </div>
      </div>
    </div>
  );
}