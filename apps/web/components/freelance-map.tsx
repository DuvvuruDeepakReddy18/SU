'use client';

// Leaflet must be imported in the browser only (uses `window`).
// We dynamically import this component from the page with ssr: false.

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Link from 'next/link';

type Point = {
  id: string;
  title: string;
  category: string;
  location: string | null;
  lat: number;
  lng: number;
  priceFrom: number | null;
  priceUnit: string | null;
  providerName: string;
};

export default function FreelanceMap({ points }: { points: Point[] }) {
  // Leaflet's default marker icon URLs are broken under bundlers — restore them.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Default center: India centroid if no points; otherwise the first point.
  const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [22.5, 79];
  const zoom = points.length > 0 ? 5 : 4;

  return (
    <div className="h-[60vh] w-full rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <div className="text-xs uppercase tracking-wider text-zinc-500 capitalize">
                  {p.category.replace('_', ' ')}
                </div>
                <div className="font-semibold text-sm leading-snug">{p.title}</div>
                <div className="text-xs text-zinc-600">
                  by {p.providerName}
                  {p.location ? ` · ${p.location}` : ''}
                </div>
                {p.priceFrom != null && (
                  <div className="text-xs">
                    From ₹{p.priceFrom} / {p.priceUnit ?? 'project'}
                  </div>
                )}
                <Link
                  href={`/dashboard/freelance/${p.id}`}
                  className="text-xs text-indigo-600 hover:underline inline-block mt-1"
                >
                  View service →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
