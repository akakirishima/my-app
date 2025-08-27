import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// 初期位置（宮崎駅付近）
const FALLBACK: LatLngExpression = [31.915, 131.423];
const INITIAL_ZOOM = 15;

// ====== types ======
type Route = { km: number; color: string; coords: [number, number][] };
type Poi = { lat: number; lon: number; name: string; category: "cafe" | "sight" | "other" };

// ====== helpers ======
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

function useLiveLocation() {
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setPos({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return pos;
}

function FollowMap({ pos }: { pos: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng]);
  }, [pos, map]);
  return null;
}

function FitToRoute({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!coords?.length) return;
    const b = L.latLngBounds(coords as any);
    map.fitBounds(b, { padding: [20, 20] });
  }, [coords, map]);
  return null;
}

// user marker (blue)
const userIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
  className: "hue-rotate-180",
});

// POI icons (emojiベースの軽量DivIcon)
const cafeIcon = L.divIcon({
  className: "poi-emoji",
  html: "☕️",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
const sightIcon = L.divIcon({
  className: "poi-emoji",
  html: "📍",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Pegman（手動スタート）アイコン
const pegmanIcon = L.icon({
  iconUrl: "/S.png",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
  className: "pegman-img",
});

function PegmanPicker({ onDrop }: { onDrop: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [dragging, setDragging] = useState(false);
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const [, force] = useState(0);

  const startDrag = (clientX: number, clientY: number) => {
    posRef.current = { x: clientX, y: clientY };
    setDragging(true);
    force((n) => n + 1);
  };

  useEffect(() => {
    if (!dragging) return;

    // === Disable map interactions while dragging pegman ===
    const handlers = [
      (map as any).dragging,
      (map as any).touchZoom,
      (map as any).scrollWheelZoom,
      (map as any).doubleClickZoom,
      (map as any).boxZoom,
      (map as any).keyboard,
    ];
    handlers.forEach((h) => h && h.disable());
    const prevTouchAction = map.getContainer().style.touchAction;
    map.getContainer().style.touchAction = "none"; // prevent browser touch panning

    const onMove = (e: MouseEvent | TouchEvent) => {
      let cx: number, cy: number;
      if ("touches" in e) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }
      posRef.current = { x: cx, y: cy };
      force((n) => n + 1);
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      let cx: number, cy: number;
      if ("changedTouches" in e) {
        cx = e.changedTouches[0].clientX;
        cy = e.changedTouches[0].clientY;
      } else {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }

      const rect = map.getContainer().getBoundingClientRect();
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
        const pt = L.point(cx - rect.left, cy - rect.top);
        const ll = map.containerPointToLatLng(pt);
        onDrop(ll.lat, ll.lng);
      }

      setDragging(false);
      posRef.current = null;

      // === Re-enable map interactions ===
      handlers.forEach((h) => h && h.enable());
      map.getContainer().style.touchAction = prevTouchAction;

      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp as any);
      window.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp as any);
    };

    window.addEventListener("mousemove", onMove as any);
    window.addEventListener("mouseup", onUp as any);
    window.addEventListener("touchmove", onMove as any, { passive: false } as any);
    window.addEventListener("touchend", onUp as any);

    // ヒント: ドロップ可能状態の見た目
    map.getContainer().classList.add("pegman-target");

    return () => {
      map.getContainer().classList.remove("pegman-target");
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp as any);
      window.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp as any);
    };
  }, [dragging, map, onDrop]);

  const pos = posRef.current;

  return (
    <>
      {/* 右下のペグマン（ドラッグ開始トリガー） */}
      <div className="absolute bottom-3 right-3 z-[1000]">
        <button
          className="px-2 py-1 rounded-xl bg-white/60 border border-white/50 shadow backdrop-blur-md"
          onMouseDown={(e) => {
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
          }}
          title="ドラッグしてスタート地点を設定"
          aria-label="ドラッグしてスタート地点を設定"
        >
          <img src="/S.png" alt="" className="w-7 h-7 pointer-events-none" />
        </button>
      </div>

      {/* ついてくるゴースト */}
      {dragging && pos && (
        <div
          className="pegman-drag"
          style={{ left: pos.x - 18, top: pos.y - 34 }}
        >
          <img src="/S.png" alt="" />
        </div>
      )}
    </>
  );
}

export default function MapWidget(): JSX.Element {
  const pos = useLiveLocation();

  // ▼ データは「固定」扱い（取得成功後は更新しない）
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);
  const [selectedKm, setSelectedKm] = useState<number | null>(null);
  const lineRefs = useRef<Record<number, L.Polyline>>({});

  const [walkMode, setWalkMode] = useState(false);
  // POI visibility toggle (single)
  const [showPoi, setShowPoi] = useState(true);
  const selectedRoute = useMemo(
    () => routes.find((r) => r.km === selectedKm) ?? null,
    [routes, selectedKm]
  );

  const fetchedOnceRef = useRef(false);

  // リトライ制御
  const [attempt, setAttempt] = useState(0);
  const MAX_ATTEMPTS = 3;
  const RETRY_MS = 5000;

  // データ取得のアンカー（初回は現在地、なければFALLBACK）
  const [anchor, setAnchor] = useState<[number, number] | null>(null);

  // 現在地追従（手動スタートにするとfalseに）
  const [followUser, setFollowUser] = useState(true);

  // 初回、現在地が来たらアンカーにセット
  useEffect(() => {
    if (!anchor && pos) setAnchor([pos.lat, pos.lng]);
  }, [pos, anchor]);

  const fetchCenter: [number, number] = (anchor ?? FALLBACK) as [number, number];

  // 地図の中心は「現在地追従」か「アンカー」のどちらか
  const center = useMemo<[number, number]>(() => {
    if (followUser && pos) return [pos.lat, pos.lng];
    return (anchor ?? FALLBACK) as [number, number];
  }, [followUser, pos, anchor]);

  // ルート/POI取得（成功したら固定）
  useEffect(() => {
    if (fetchedOnceRef.current) return;

    const abort = new AbortController();
    let timer: number | undefined;

    (async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/api/walk_routes?lat=${fetchCenter[0]}&lon=${fetchCenter[1]}`, {
            signal: abort.signal,
          }),
          fetch(
            `${API_BASE}/api/pois?lat=${fetchCenter[0]}&lon=${fetchCenter[1]}&radius=1500&kinds=cafe,sight&limit=80`,
            { signal: abort.signal }
          ),
        ]);

        let nextRoutes: Route[] = [];
        let nextPois: Poi[] = [];

        if (rRes.ok) {
          const rJson = await rRes.json().catch(() => null);
          if (Array.isArray(rJson?.routes)) nextRoutes = rJson.routes as Route[];
        }
        if (pRes.ok) {
          const pJson = await pRes.json().catch(() => null);
          if (Array.isArray(pJson?.pois)) nextPois = pJson.pois as Poi[];
        }

        if (nextRoutes.length || nextPois.length) {
          if (nextRoutes.length) setRoutes(nextRoutes);
          if (nextPois.length) setPois(nextPois);
          fetchedOnceRef.current = true;
          return;
        }

        if (!abort.signal.aborted && attempt < MAX_ATTEMPTS) {
          timer = window.setTimeout(() => setAttempt((a) => a + 1), RETRY_MS);
        }
      } catch {
        if (!abort.signal.aborted && attempt < MAX_ATTEMPTS) {
          timer = window.setTimeout(() => setAttempt((a) => a + 1), RETRY_MS);
        }
      }
    })();

    return () => {
      abort.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [fetchCenter, attempt]);

  // 軽量CSS（POI/pegman表示）
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .poi-emoji {
        font-size: 22px;
        line-height: 28px;
        text-align: center;
        border-radius: 14px;
        background: rgba(255,255,255,0.85);
        box-shadow: 0 2px 8px rgba(0,0,0,.2);
      }
      .pegman-drag {
        position: fixed;
        pointer-events: none;
        z-index: 5000;
      }
      .pegman-drag img {
        width: 36px;
        height: 36px;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,.35));
      }
      .leaflet-container.pegman-target {
        cursor: crosshair;
      }

      /* --- Zoom control: translucent / glassy --- */
      .leaflet-control-zoom {
        border-radius: 12px;
        background: rgba(255,255,255,.35);
        border: 1px solid rgba(255,255,255,.55);
        box-shadow: 0 6px 14px rgba(0,0,0,.15);
        overflow: hidden;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .leaflet-control-zoom a {
        background: transparent;
        color: #111;
        border-bottom: 1px solid rgba(255,255,255,.35);
      }
      .leaflet-control-zoom a:last-child {
        border-bottom: none;
      }
      .leaflet-control-zoom a:hover {
        background: rgba(255,255,255,.22);
      }
      /* --- POI toggle (iOS-like switch) --- */
      .poi-toggle {
        width: 56px;
        height: 30px;
        border-radius: 9999px;
        background: rgba(255,255,255,.35);
        border: 1px solid rgba(255,255,255,.55);
        box-shadow: 0 6px 14px rgba(0,0,0,.15);
        position: relative;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: background .2s ease;
      }
      .poi-toggle .knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 24px;
        height: 24px;
        border-radius: 9999px;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,.25);
        transition: left .2s ease;
      }
      .poi-toggle.on {
        background: linear-gradient(135deg, rgba(16,185,129,.75), rgba(59,130,246,.75));
        border-color: rgba(255,255,255,.65);
      }
      .poi-toggle.on .knob {
        left: 29px;
      }

      /* --- Route line transition & glow easing --- */
      .route-line {
        transition: filter .2s ease, stroke-width .2s ease, opacity .2s ease;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // 選択ルートの強調
  useEffect(() => {
    const entries = Object.entries(lineRefs.current);
    for (const [k, layer] of entries) {
      const km = Number(k);
      if (!layer) continue;
      const el = (layer as any).getElement?.() as SVGPathElement | null;
      const color = (layer.options as any)?.color || '#ffffff';

      if (selectedKm === null) {
        layer.setStyle({ opacity: 0.95, weight: 6 });
        if (el) el.style.filter = '';
      } else if (km === selectedKm) {
        layer.setStyle({ opacity: 1, weight: 10 });
        if (el) el.style.filter = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 10px ${color})`;
        layer.bringToFront();
      } else {
        layer.setStyle({ opacity: 0.25, weight: 4 });
        if (el) el.style.filter = '';
      }
    }
  }, [selectedKm, routes, walkMode]);

  // アンカー変更時にデータ取り直し
  const resetAndRefetch = (lat: number, lng: number) => {
    setAnchor([lat, lng]);
    setRoutes([]);
    setPois([]);
    setSelectedKm(null);
    setWalkMode(false);
    fetchedOnceRef.current = false;
    setAttempt(0);
  };

  return (
    <div className="relative">

      {/* ルート選択→確定前 */}
      {selectedKm !== null && !walkMode && (
        <div className="absolute top-14 left-16 md:left-20 z-[1000] flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg bg-white/70 text-gray-900 border border-white/60 shadow backdrop-blur-md hover:bg-white/85"
            onClick={() => setWalkMode(true)}
          >
            このルートで散歩する
          </button>
          <button
            className="px-3 py-1.5 rounded-lg bg-black/30 text-white border border-white/30 backdrop-blur-md hover:bg-black/40"
            onClick={() => setSelectedKm(null)}
          >
            キャンセル
          </button>
        </div>
      )}

      {/* 散歩モード中（単独表示） */}
      {walkMode && (
        <div className="absolute top-14 left-16 md:left-20 z-[1000]">
          <button
            className="px-3 py-1.5 rounded-lg bg-white/70 text-gray-900 border border-white/60 shadow backdrop-blur-md hover:bg-white/85"
            onClick={() => {
              setWalkMode(false);
              setSelectedKm(null);
            }}
          >
            全ルート表示に戻る
          </button>
        </div>
      )}

      {/* POI show/hide control (single toggle under the zoom control) */}
      <div className="absolute left-3 top-24 z-[1000]">
        <button
          className={`poi-toggle ${showPoi ? "on" : ""}`}
          onClick={() => setShowPoi((v) => !v)}
          aria-pressed={showPoi}
          title={showPoi ? "POIを隠す" : "POIを表示"}
        >
          <span className="sr-only">POI</span>
          <span className="knob" />
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={INITIAL_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "60vh", width: "100%" }}
        className="rounded-xl shadow"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <PegmanPicker
          onDrop={(lat, lng) => {
            setFollowUser(false);
            resetAndRefetch(lat, lng);
          }}
        />

        {/* 手動スタートのpegman（ドラッグで微調整可） */}
        {anchor && (
          <Marker
            position={anchor}
            icon={pegmanIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const mk = e.target as L.Marker;
                const ll = mk.getLatLng();
                resetAndRefetch(ll.lat, ll.lng);
              },
            }}
          />
        )}

        {/* 散歩モード中は選択ルートにフィット */}
        {walkMode && selectedRoute && <FitToRoute coords={selectedRoute.coords} />}

        {/* ルート描画 */}
        {(walkMode && selectedRoute ? [selectedRoute] : routes).map((r) => (
          <Polyline
            key={r.km}
            positions={r.coords as LatLngExpression[]}
            pathOptions={{ className: 'route-line', color: r.color, weight: 6, opacity: 0.95 }}
            whenCreated={(layer) => {
              lineRefs.current[r.km] = layer;
            }}
            eventHandlers={{
              click: () => setSelectedKm((prev) => (prev === r.km ? null : r.km)),
              mouseover: (e) => {
                const w = selectedKm === r.km ? 11 : 8;
                e.target.setStyle({ weight: w });
              },
              mouseout: (e) => {
                const isSel = selectedKm === r.km;
                e.target.setStyle({ weight: isSel ? 10 : 6 });
              },
            }}
          />
        ))}

        {/* 観光・カフェ */}
        {showPoi && (
          <>
            {pois
              .filter((p) => p.category === "sight")
              .map((p, i) => (
                <Marker key={`s${i}`} position={[p.lat, p.lon]} icon={sightIcon}>
                  <Popup>{p.name}</Popup>
                </Marker>
              ))}
            {pois
              .filter((p) => p.category === "cafe")
              .map((p, i) => (
                <Marker key={`c${i}`} position={[p.lat, p.lon]} icon={cafeIcon}>
                  <Popup>{p.name}</Popup>
                </Marker>
              ))}
          </>
        )}

        {/* 現在地（追従は followUser=true のときだけ） */}
        {pos && (
          <>
            <Marker position={[pos.lat, pos.lng]} icon={userIcon} />
            <Circle
              center={[pos.lat, pos.lng]}
              radius={Math.max(pos.accuracy, 25)}
              pathOptions={{ color: "#3b82f6", fillOpacity: 0.2 }}
            />
            {followUser && <FollowMap pos={pos} />}
          </>
        )}
      </MapContainer>
    </div>
  );
}