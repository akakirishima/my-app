// frontend/src/features/map/hooks.ts
import { useEffect, useState } from 'react';

export interface LatLng {
  lat: number;
  lng: number;
}

export function useCurrentLocation() {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation はサポートされていません');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPos({ lat: coords.latitude, lng: coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  return { pos, error };
}