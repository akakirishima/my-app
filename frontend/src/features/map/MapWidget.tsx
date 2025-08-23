// frontend/src/features/map/MapWidget.tsx
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const FALLBACK_CENTER: LatLngExpression = [31.910, 131.423];
const INITIAL_ZOOM = 15;           // やや寄り気味
const LOCATION_RADIUS = 25;        // 可視円 (m)

// ▶︎ 現在地フック（リアルタイム）
interface LatLng { lat: number; lng: number; accuracy: number; }
function useLiveLocation() {
  const [pos, setPos] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setPos({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      console.error,
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return pos;
}

// ▶︎ map を追従移動させる小コンポーネント
function FollowMap({ pos }: { pos: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng]);
  }, [pos, map]);
  return null;
}

// ▶︎ 現在地マーカー用アイコン
const blueMarker = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  className: 'hue-rotate-180',       // CSS で青っぽく
});

export default function MapWidget(): JSX.Element {
  const pos = useLiveLocation();

  return (
    <MapContainer
      center={pos ? [pos.lat, pos.lng] : FALLBACK_CENTER}
      zoom={INITIAL_ZOOM}
      scrollWheelZoom={false}
      style={{ height: '40vh', width: '100%' }}
      className="rounded-xl shadow"
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 位置が取れたらマーカー + 円 + map 追従 */}
      {pos && (
        <>
          <Marker position={[pos.lat, pos.lng]} icon={blueMarker} />
          <Circle
            center={[pos.lat, pos.lng]}
            radius={Math.max(pos.accuracy, LOCATION_RADIUS)}
            pathOptions={{ color: '#3b82f6', fillOpacity: 0.2 }}
          />
          <FollowMap pos={pos} />
        </>
      )}
    </MapContainer>
  );
}