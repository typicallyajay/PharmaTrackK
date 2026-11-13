'use client';

import { MapPin } from 'lucide-react';

export default function LocationPrompt({ query }: { query?: string }) {
  const handleGetLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const url = new URL(window.location.href);
          url.searchParams.set('user_lat', pos.coords.latitude.toFixed(6));
          url.searchParams.set('user_lng', pos.coords.longitude.toFixed(6));
          window.location.href = url.toString();
        },
        (err) => {
          alert('Could not retrieve your location: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <button
      onClick={handleGetLocation}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-teal-500 bg-white text-slate-700 hover:text-teal-700 text-xs font-semibold shadow-sm transition"
    >
      <MapPin className="w-4 h-4 text-teal-600" />
      Sort by My Current GPS Location
    </button>
  );
}
