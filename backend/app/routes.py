from flask import Blueprint, jsonify, request
import os
import random
import math
import requests

bp = Blueprint("api", __name__)

ORS_API_KEY = os.getenv("ORS_API_KEY")

# ---------- ORS round-trip (walking) ----------

def _ors_roundtrip(lon: float, lat: float, length_km: float, seed: int | None = None):
    """
    OpenRouteService round-trip route (walking).
    Returns list of [lat, lon] coords.
    """
    if ORS_API_KEY is None:
        raise RuntimeError("ORS_API_KEY is not set")

    url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"
    rnd = random.Random(seed or 0)
    params = {"api_key": ORS_API_KEY}
    body = {
        "coordinates": [[lon, lat]],
        "options": {
            "round_trip": {
                "length": int(length_km * 1000),
                "seed": rnd.randrange(1, 1_000_000),
            }
        },
    }
    r = requests.post(url, params=params, json=body, timeout=25)
    r.raise_for_status()
    gj = r.json()
    coords = gj["features"][0]["geometry"]["coordinates"]  # [lon, lat]
    return [[c[1], c[0]] for c in coords]

# ---------- Fallback loop (no external API) ----------

def _fallback_loop(lat: float, lon: float, length_km: float, seed: int | None = None):
    """
    Create a simple closed loop around (lat, lon) with approx. length_km.
    Circle perimeter = 2πr -> r = length / (2π).
    Convert km radius to degrees in lat/lon and draw a wobbly ellipse.
    """
    r_km = max(0.25, length_km / (2 * math.pi))  # keep minimum radius
    # km->deg  (緯度1度 ≒110.574km / 経度は緯度により変化)
    deg_lat = r_km / 110.574
    cos_lat = math.cos(math.radians(lat))
    deg_lon = r_km / (111.320 * (cos_lat if abs(cos_lat) > 1e-6 else 1e-6))

    rnd = random.Random(seed or 0)
    n = 180  # points
    phase = rnd.random() * 2 * math.pi
    wobble = 0.12 + rnd.random() * 0.08  # 0.12..0.20

    coords = []
    for i in range(n + 1):
        t = 2 * math.pi * (i / n) + phase
        # 少し楕円 + 半径の微小ゆらぎ
        radius_scale = 1.0 + wobble * math.sin(3 * t + phase * 0.7)
        y = math.sin(t) * deg_lat * radius_scale
        x = math.cos(t) * deg_lon * (0.85 + 0.3 * math.sin(t + phase * 0.3)) * radius_scale
        coords.append([lat + y, lon + x])
    return coords

# ---------- Overpass (POI) ----------

_OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",           # 本家
    "https://overpass.kumi.systems/api/interpreter",     # ミラー
    "https://overpass.openstreetmap.ru/api/interpreter", # 予備
]

def _overpass_pois(lat: float, lon: float, radius: int = 1500,
                   kinds: list[str] | None = None, limit: int = 50):
    """
    Query Overpass (OpenStreetMap) for POIs around given point.
    kinds supports: 'cafe', 'sight'
    Returns list of dicts: {lat, lon, name, category}
    """
    if kinds is None:
        kinds = ["cafe", "sight"]

    blocks = []
    if "cafe" in kinds:
        blocks += [
            f'node["amenity"="cafe"](around:{radius},{lat},{lon});',
            f'way["amenity"="cafe"](around:{radius},{lat},{lon});',
        ]
    if "sight" in kinds:
        sight_node = 'node["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"]'
        sight_way  = 'way["tourism"~"^(attraction|museum|gallery|zoo|aquarium|theme_park|viewpoint)$"]'
        hist_node  = 'node["historic"]'
        hist_way   = 'way["historic"]'
        blocks += [
            f"{sight_node}(around:{radius},{lat},{lon});",
            f"{sight_way}(around:{radius},{lat},{lon});",
            f"{hist_node}(around:{radius},{lat},{lon});",
            f"{hist_way}(around:{radius},{lat},{lon});",
        ]

    ql = f"""
[out:json][timeout:25];
(
  {'  '.join(blocks)}
);
out center;
"""
    data = None
    last_err = None
    for ep in _OVERPASS_ENDPOINTS:
        try:
            r = requests.post(ep, data={"data": ql}, timeout=30)
            r.raise_for_status()
            data = r.json()
            break
        except requests.RequestException as e:
            last_err = e
            continue
    if data is None:
        raise last_err or RuntimeError("Overpass unavailable")

    pois = []
    for el in data.get("elements", []):
        tags = el.get("tags") or {}
        name = tags.get("name") or tags.get("name:ja") or tags.get("name:en") or "(名称未設定)"
        lat2 = el.get("lat")
        lon2 = el.get("lon")
        if lat2 is None or lon2 is None:
            center = el.get("center")
            if center:
                lat2 = center.get("lat")
                lon2 = center.get("lon")
        if lat2 is None or lon2 is None:
            continue

        category = "other"
        if tags.get("amenity") == "cafe":
            category = "cafe"
        elif tags.get("tourism") in {
            "attraction", "viewpoint", "museum", "gallery", "zoo", "aquarium", "theme_park"
        } or "historic" in tags:
            category = "sight"

        pois.append({"lat": lat2, "lon": lon2, "name": name, "category": category})

    pois.sort(key=lambda p: (p["lat"] - lat) ** 2 + (p["lon"] - lon) ** 2)
    return pois[:limit]

# ---------- routes ----------

@bp.get("/api/walk_routes")
def walk_routes():
    lat = float(request.args.get("lat", "31.915"))
    lon = float(request.args.get("lon", "131.423"))
    triples = [
        (3.0, "#facc15"),  # yellow
        (5.0, "#22c55e"),  # green
        (7.0, "#ef4444"),  # red
    ]
    routes = []
    for i, (km, color) in enumerate(triples, start=1):
        try:
            coords = _ors_roundtrip(lon, lat, km, seed=100 + i)
        except requests.HTTPError as e:
            # ORSのレート制限/障害時はフォールバック
            status = getattr(e.response, "status_code", None)
            print(f"ORS error ({status}), use fallback loop for {km}km", flush=True)
            coords = _fallback_loop(lat, lon, km, seed=100 + i)
        except Exception as e:
            print("ORS unknown error, use fallback:", e, flush=True)
            coords = _fallback_loop(lat, lon, km, seed=100 + i)
        routes.append({"km": km, "color": color, "coords": coords})
    return jsonify({"routes": routes})

@bp.get("/api/pois")
def pois():
    """
    Optional query:
      radius (m, default 1500)
      kinds  (comma: cafe,sight)
      limit  (default 50)
    """
    try:
        lat = float(request.args.get("lat", "31.915"))
        lon = float(request.args.get("lon", "131.423"))
        radius = int(request.args.get("radius", "1500"))
        kinds_str = request.args.get("kinds", "cafe,sight")
        kinds = [k.strip() for k in kinds_str.split(",") if k.strip()]
        limit = int(request.args.get("limit", "50"))
    except ValueError:
        return jsonify({"pois": []}), 400

    try:
        data = _overpass_pois(lat, lon, radius=radius, kinds=kinds, limit=limit)
        return jsonify({"pois": data})
    except requests.RequestException as e:
        print("Overpass error:", e, flush=True)
        return jsonify({"pois": [], "error": "overpass_unavailable"}), 200
    except Exception as e:
        print("POI server error:", e, flush=True)
        return jsonify({"pois": []}), 200