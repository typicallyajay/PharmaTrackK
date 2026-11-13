'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StockEntry } from '@/types';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function PharmacyStockPage() {
  const router = useRouter();
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/pharmacy/stock');
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setStock(data.stock || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleDelete = async (stockId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from your shelf?`)) return;
    try {
      const res = await fetch(`/api/pharmacy/stock?id=${stockId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStock(stock.filter((s) => s.stock_id !== stockId));
      } else {
        alert('Could not delete medicine entry.');
      }
    } catch (err) {
      alert('Error during delete.');
    }
  };

  const filteredStock = stock.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.medicine_name.toLowerCase().includes(q) ||
      (s.generic_name && s.generic_name.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/pharmacy"
          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Link
          href="/pharmacy/stock/new"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Medicine
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Medicine Inventory Shelf
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stock levels, pricing, generic formulas, and expiration tracking
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter inventory..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading inventory...</div>
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm">No medicine items found.</p>
            <Link
              href="/pharmacy/stock/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add your first medicine
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Generic Formula</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-right">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.map((item) => {
                  const isOut = item.quantity <= 0;
                  const isLow = item.quantity > 0 && item.quantity <= 10;

                  return (
                    <tr key={item.stock_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.medicine_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                        {item.generic_name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {item.category ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {item.category}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-800">
                        ₹{Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Out of Stock (0)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Low ({item.quantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> In Stock ({item.quantity})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-500 font-mono">
                        {item.expiry_date
                          ? new Date(item.expiry_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/pharmacy/stock/${item.stock_id}`}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title="Edit Medicine"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.stock_id, item.medicine_name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Medicine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
