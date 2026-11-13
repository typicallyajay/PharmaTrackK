'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pill, LogIn, Lock, Phone, AlertCircle, ShieldCheck, Building2, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user.role === 'super_admin') {
        router.push('/admin');
      } else if (data.user.role === 'pharmacy_admin') {
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

  const fillDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Pill className="w-6 h-6 -rotate-45" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to PharmaTrack
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Access your pharmacy inventory, medical POS, or personal dosage reminders
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9811111111 or admin@pharmatrack.local"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
              1-Click Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('9999999999', 'Admin@123')}
                className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition group"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-teal-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Super Admin
                </div>
                <div className="text-[11px] text-slate-400 font-mono">9999999999</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('9811111111', 'Pharma@123')}
                className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition group"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-teal-700">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" /> City Medicos
                </div>
                <div className="text-[11px] text-slate-400 font-mono">9811111111</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('9822222222', 'Pharma@123')}
                className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition group"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-teal-700">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" /> WellCare Pharma
                </div>
                <div className="text-[11px] text-slate-400 font-mono">9822222222</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('9800000000', 'User@123')}
                className="p-2.5 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition group"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-teal-700">
                  <User className="w-3.5 h-3.5 text-teal-600" /> Customer (Rahul)
                </div>
                <div className="text-[11px] text-slate-400 font-mono">9800000000</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-teal-600 hover:text-teal-700">
              Create an account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
