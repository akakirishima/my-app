import MapWidget from "../features/map/MapWidget";
import WeatherWidget from "../features/weather/WeatherWidget";
import PackingListWidget from "../features/packing/PackingListWidget";
import useWeatherTheme from "../features/weather/hooks/useWeatherTheme";
import Clouds from "../conponents/Clouds"; // ← 追加

export default function Home() {
  const { className, angleStyle, overlays } = useWeatherTheme();

  return (
    <div className={`sky ${className}`} style={angleStyle as any}>
      {/* オーバーレイ */}
      {overlays.stars && <div className="sky-stars" />}
      {overlays.rain  && <div className="sky-rain"  />}
      {overlays.snow  && <div className="sky-snow"  />}
      {overlays.flash && <div className="sky-flash" />}

      <div className="sky-content page">
        <MapWidget />

        <div className="two-col">
          {/* 天気カード */}
          <div className="card card--glass card--with-clouds hover-lift">
           
            <WeatherWidget />
          </div>

          {/* 持ち物カード */}
          <div className="card card--glass card--with-clouds hover-lift">
           
            <PackingListWidget />
          </div>
        </div>
      </div>
    </div>
  );
}