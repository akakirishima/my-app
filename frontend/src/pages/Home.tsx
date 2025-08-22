// Home.tsx  （@ を使わない版）

// ─── import ───
// pages/Home.tsx から見て 1 つ上の階層にある features/〜 を相対パスで参照します
import MapWidget from '../features/map/MapWidget';
import WeatherWidget from '../features/weather/WeatherWidget';
import PackingListWidget from '../features/packing/PackingListWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col gap-6 p-6">
      {/* ─── 上段：MAP ─── */}
      <section className="flex-1">
        <MapWidget />
      </section>

      {/* ─── 下段：カード 2 枚 ─── */}
      <section className="grid gap-6 md:grid-cols-2">
        <WeatherWidget />
        <PackingListWidget />
      </section>
    </main>
  );
}