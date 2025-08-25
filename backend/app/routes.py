# backend/app/routes.py
import os
import requests
from flask import Blueprint, jsonify, request

bp = Blueprint("api", __name__)

ORS_KEY = os.environ.get("ORS_API_KEY")
ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

def _ors_roundtrip(lon: float, lat: float, length_m: int, seed: int = 1):
    """ORS の round-trip で周回ルートを取得し、Leaflet 用 [lat,lon] 配列に変換して返す"""
    if not ORS_KEY:
        raise RuntimeError("ORS_API_KEY is not set")
    payload = {
        "coordinates": [[lon, lat]],           # round_trip は一点渡し
        "options": {"round_trip": {"length": length_m, "seed": seed}},
        "instructions": False,
    }
    headers = {"Authorization": ORS_KEY, "Content-Type": "application/json"}
    r = requests.post(ORS_URL, json=payload, headers=headers, timeout=25)
    r.raise_for_status()
    gj = r.json()
    coords = gj["features"][0]["geometry"]["coordinates"]  # [lon,lat]
    return [[lat_, lon_] for lon_, lat_ in coords]         # Leaflet 用に [lat,lon] へ

@bp.get("/api/walk_routes")
def walk_routes():
    """
    ?lat=..&lon=.. を受け取り、3/5/7km の周回ルートをまとめて返す
    返り値: { routes: [{km, color, coords:[[lat,lon],...]} ...] }
    """
    try:
        lat = float(request.args["lat"])
        lon = float(request.args["lon"])
    except Exception:
        return jsonify({"error": "lat/lon are required"}), 400

    plans = [
        (3000, "#facc15", 11),  # 3km: 黄色
        (5000, "#22c55e", 22),  # 5km: 緑
        (7000, "#ef4444", 33),  # 7km: 赤
    ]

    routes = []
    for length, color, seed in plans:
        coords = _ors_roundtrip(lon, lat, length, seed)
        routes.append({"km": length / 1000, "color": color, "coords": coords})

    return jsonify({"routes": routes})