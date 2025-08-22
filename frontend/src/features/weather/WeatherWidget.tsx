export default function WeatherWidget() {
  return (
    <div className="aspect-square rounded-xl bg-yellow-400/70 flex flex-col items-center justify-center">
      <span className="text-6xl">☀️</span>
      <span className="text-3xl font-semibold">-- °C</span>
    </div>
  );
}