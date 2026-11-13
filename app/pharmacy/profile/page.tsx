'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Phone,
  Compass,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Pharmacy } from '@/types';

export default function PharmacyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pharmacyName, setPharmacyName] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then(async (data) => {
        if (!data?.user || data.user.role !== 'pharmacy_admin') {
          router.push('/login');
          return;
        }
        // Fetch current pharmacy
        const resP = await fetch('/api/pharmacy/stock');
        // Let's also fetch profile
        if (data.user.pharmacy_id) {
          const storeRes = await fetch(`/api/pharmacy/profile`);
          const storeData = await storeRes.json();
          if (storeData.pharmacy) {
            const p: Pharmacy = storeData.pharmacy;
            setPharmacyName(p.pharmacy_name);
            setAddress(p.address);
            setLocality(p.locality);
            setCity(p.city);
            setPhone(p.phone);
            setLatitude(p.latitude ? p.latitude.toString() : '');
            setLongitude(p.longitude ? p.longitude.toString() : '');
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDetectGPS = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(7));
          setLongitude(pos.coords.longitude.toFixed(7));
          setGpsLoading(false);
        },
        (err) => {
          alert('GPS detection failed: ' + err.message);
          setGpsLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/pharmacy/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacy_name: pharmacyName,
          address,
          locality,
          city,
          phone,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setSuccess('Pharmacy profile and GPS coordinates updated successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/pharmacy"
        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl shadow-slate-200/50 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Pharmacy Store Profile
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit store name, contact info, and latitude/longitude coordinates
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pharmacy Name
            </label>
            <input
              type="text"
              required
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Locality</label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
            />
          </div>

          {/* GPS Coordinates Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                GPS Latitude & Longitude
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5 text-teal-600" />
                {gpsLoading ? 'Detecting...' : 'Detect GPS location'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Latitude (e.g. 24.4881)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs font-mono"
              />
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Longitude (e.g. 72.7833)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Used to calculate proximity distance for customers searching for medicine.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
