'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Pill,
  UserPlus,
  Building2,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  AlertCircle,
  Compass,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'user' | 'pharmacy_admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Pharmacy specific fields
  const [pharmacyName, setPharmacyName] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Abu Road');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

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
    setLoading(true);

    try {
      const payload: any = {
        name,
        mobile,
        email: email || undefined,
        password,
        role,
      };

      if (role === 'pharmacy_admin') {
        payload.pharmacy_name = pharmacyName;
        payload.address = address;
        payload.locality = locality;
        payload.city = city;
        payload.phone = pharmacyPhone || mobile;
        payload.latitude = latitude ? parseFloat(latitude) : null;
        payload.longitude = longitude ? parseFloat(longitude) : null;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (role === 'pharmacy_admin') {
        alert(
          'Registration submitted successfully! Your pharmacy profile has been created and will appear in public search once approved by the Super Admin.'
        );
        router.push('/pharmacy');
      } else {
        router.push('/reminders');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Pill className="w-6 h-6 -rotate-45" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create your PharmaTrack Account
        </h1>
        <p className="text-sm text-slate-500">
          Join the community medicine locator and prescription network
        </p>

        {/* Role toggle tabs */}
        <div className="pt-4 flex justify-center">
          <div className="bg-slate-100 p-1 rounded-2xl flex max-w-md w-full border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'user'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" /> Customer Account
            </button>
            <button
              type="button"
              onClick={() => setRole('pharmacy_admin')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'pharmacy_admin'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Pharmacy Owner
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {role === 'pharmacy_admin' ? 'Owner Credentials' : 'Personal Details'}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          {/* Pharmacy Profile Specific Fields */}
          {role === 'pharmacy_admin' && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pharmacy Store Information
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pharmacy Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="e.g. City Medicos & Pharmacy"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop #4, Station Road, Near Bus Stand"
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
                    placeholder="e.g. Station Road"
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
                    placeholder="Abu Road"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Phone</label>
                <input
                  type="tel"
                  required
                  value={pharmacyPhone}
                  onChange={(e) => setPharmacyPhone(e.target.value)}
                  placeholder="Store contact number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>

              {/* Coordinates with GPS auto-detection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    GPS Coordinates (For Distance Routing)
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={gpsLoading}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    {gpsLoading ? 'Detecting...' : 'Detect GPS from device'}
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
                <p className="text-[11px] text-slate-500 mt-1">
                  Tip: Right-click your store location in Google Maps to copy exact latitude/longitude.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading
                ? 'Creating Account...'
                : role === 'pharmacy_admin'
                ? 'Register Pharmacy Store'
                : 'Create Customer Account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-teal-600 hover:text-teal-700">
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
