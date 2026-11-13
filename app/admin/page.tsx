'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pharmacy, PharmacyStatus } from '@/types';
import {
  ShieldCheck,
  Building2,
  Users,
  Search,
  Hourglass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Phone,
} from 'lucide-react';

interface AdminStats {
  totalPharmacies: number;
  pendingApprovals: number;
  totalUsers: number;
  totalSearches: number;
  topSearches: Array<{ medicine_name: string; count: number }>;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setPharmacies(data.pharmacies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (pharmacyId: number, status: PharmacyStatus) => {
    try {
      const res = await fetch('/api/pharmacy/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacy_id: pharmacyId, status }),
      });
      if (res.ok) {
        setPharmacies((prev) =>
          prev.map((p) => (p.pharmacy_id === pharmacyId ? { ...p, status } : p))
        );
        fetchData();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      alert('Error updating status.');
    }
  };

  const filteredPharmacies = pharmacies.filter((p) => {
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'approved') return p.status === 'approved';
    return true;
  });

  const maxSearchCount = stats?.topSearches?.length
    ? Math.max(...stats.topSearches.map((s) => s.count), 1)
    : 1;

  if (loading) {
    return <div className="text-center py-24 text-slate-400">Loading admin panel...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Master Administrator Mode
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-500">
            System overview, medicine search metrics, and pharmacy verifications
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Full System Privileges
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Stores</span>
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {stats?.totalPharmacies || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Registered pharmacies</div>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-sm ${
            (stats?.pendingApprovals || 0) > 0
              ? 'bg-amber-50/60 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Pending Verification
            </span>
            <Hourglass className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">
            {stats?.pendingApprovals || 0}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {(stats?.pendingApprovals || 0) > 0
              ? 'Requires Action Below'
              : 'All stores verified'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active customer users</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Searches Logged</span>
            <Search className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {stats?.totalSearches || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Queries processed</div>
        </div>
      </div>

      {/* Top Searched Medicines Analytics Chart */}
      {stats?.topSearches && stats.topSearches.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Top Searched Medicines & Demand Trends
              </h2>
            </div>
            <span className="text-xs text-slate-400">Based on search_logs table</span>
          </div>

          <div className="space-y-3 pt-2">
            {stats.topSearches.map((item, idx) => {
              const pct = Math.round((item.count / maxSearchCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>
                      {idx + 1}. {item.medicine_name}
                    </span>
                    <span className="text-teal-700 font-mono">
                      {item.count} searches
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pharmacies Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Pharmacies & Credential Approvals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Approve pending stores to allow their stock to appear in public search
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({pharmacies.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({pharmacies.filter((p) => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                filter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Approved ({pharmacies.filter((p) => p.status === 'approved').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-200">
                <th className="py-3 px-4">Pharmacy Store</th>
                <th className="py-3 px-4">Owner Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPharmacies.map((p) => (
                <tr key={p.pharmacy_id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{p.pharmacy_name}</div>
                    <div className="text-xs text-slate-400">ID #{p.pharmacy_id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {p.owner?.name || 'Store Manager'}
                    {p.owner?.email && (
                      <span className="text-xs text-slate-400 block">{p.owner.email}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                    {p.phone}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    <div>{p.address}</div>
                    <div className="text-slate-400">
                      {p.locality}, {p.city}
                      {p.latitude && (
                        <span className="font-mono text-[10px] ml-1">
                          ({p.latitude.toFixed(3)}, {p.longitude?.toFixed(3)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                        p.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {p.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(p.pharmacy_id, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          title="Approve pharmacy to show in public search"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}

                      {p.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(p.pharmacy_id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}

                      {p.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(p.pharmacy_id, 'deactivated')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
