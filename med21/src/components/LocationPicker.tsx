import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  onLocationChange: (loc: SelectedLocation) => void;
  initialLat?: number;
  initialLng?: number;
}

const DUBAI_CENTER: [number, number] = [25.2048, 55.2708];

export default function LocationPicker({ onLocationChange, initialLat, initialLng }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [status, setStatus] = useState('Locating your position…');
  const [selected, setSelected] = useState<SelectedLocation | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'MedZiva/1.0' },
      });
      const data = await res.json();
      return (data.display_name as string) || '';
    } catch {
      return '';
    }
  }, []);

  const placePin = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const latlng: [number, number] = [lat, lng];
    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
    } else {
      markerRef.current.setLatLng(latlng);
    }
    map.setView(latlng);
  }, []);

  const handlePick = useCallback(
    async (lat: number, lng: number) => {
      placePin(lat, lng);
      setStatus('Fetching address…');
      const address = await reverseGeocode(lat, lng);
      const sel: SelectedLocation = { lat, lng, address };
      setSelected(sel);
      setStatus(address || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (address unavailable)`);
      onLocationChange(sel);
    },
    [onLocationChange, placePin, reverseGeocode],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const start: [number, number] =
      initialLat != null && initialLng != null ? [initialLat, initialLng] : DUBAI_CENTER;

    const map = L.map(mapContainerRef.current).setView(start, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      void handlePick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    if (initialLat != null && initialLng != null) {
      void handlePick(initialLat, initialLng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void handlePick(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setStatus('Location permission denied — showing Dubai. Tap the map to drop a pin.');
          placePin(DUBAI_CENTER[0], DUBAI_CENTER[1]);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setStatus('Geolocation unavailable — tap the map to drop a pin.');
      placePin(DUBAI_CENTER[0], DUBAI_CENTER[1]);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [handlePick, initialLat, initialLng, placePin]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-600">Pin Your Exact Location</label>
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <div ref={mapContainerRef} style={{ height: 300, width: '100%' }} />
      </div>
      <p className="text-[10px] text-slate-500">{status}</p>
      <p className="text-[10px] font-semibold text-slate-600">
        {selected
          ? `Selected: ${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`
          : 'No location selected yet — tap the map to set a pin.'}
      </p>
    </div>
  );
}
