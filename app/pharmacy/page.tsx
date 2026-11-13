import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import {
  getPharmacyByOwnerId,
  getStockForPharmacy,
  getPharmacySalesStats,
  getPharmacyInvoices,
} from '@/lib/db';
import {
  Building2,
  Package,
  AlertTriangle,
  Clock,
  Receipt,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Printer,
  ShoppingBag,
} from 'lucide-react';

export default async function PharmacyDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'pharmacy_admin') {
    redirect('/login');
  }

  const pharmacy = await getPharmacyByOwnerId(session.user_id);
  if (!pharmacy) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">No Pharmacy Associated</h2>
        <p className="text-slate-500 mt-2">
          Your account is registered as a pharmacy admin, but no pharmacy storefront was found.
        </p>
      </div>
    );
  }

  const stock = await getStockForPharmacy(pharmacy.pharmacy_id);
  const totalStock = stock.length;
  const lowStock = stock.filter((s) => s.quantity > 0 && s.quantity <= 10);
  const outOfStock = stock.filter((s) => s.quantity <= 0);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringSoon = stock.filter((s) => {
    if (!s.expiry_date) return false;
    const exp = new Date(s.expiry_date);
    return exp <= thirtyDaysFromNow;
  });

  const salesStats = await getPharmacySalesStats(pharmacy.pharmacy_id);
  const recentInvoices = await getPharmacyInvoices(pharmacy.pharmacy_id, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Pharmacy Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {pharmacy.pharmacy_name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                pharmacy.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : pharmacy.status === 'pending'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              &bull; {pharmacy.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            {pharmacy.address}, {pharmacy.locality}, {pharmacy.city} &bull; Phone: {pharmacy.phone}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/pharmacy/pos"
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" /> Open POS Cashier
          </Link>
          <Link
            href="/pharmacy/stock/new"
            className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </Link>
        </div>
      </div>

      {/* POS Sales Analytics KPIs */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
          Point of Sale (POS) Performance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Sales
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              ₹{salesStats.todaySales.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Real-time revenue</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Revenue
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-800 mt-2">
              ₹{salesStats.monthSales.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Current calendar month</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoices
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              {salesStats.totalInvoices}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Completed sale bills</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Units Sold
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
              {salesStats.totalItemsSold}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total medicine units</div>
          </div>
        </div>
      </div>

      {/* Inventory Health KPIs */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
          Inventory Shelf Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/pharmacy/stock"
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-teal-500 transition group"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Catalog</span>
              <Package className="w-5 h-5 text-teal-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {totalStock}
            </div>
            <div className="text-[11px] text-teal-600 font-semibold mt-1">
              View all inventory &rarr;
            </div>
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Low Stock (&le;10)</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
              {lowStock.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Needs reordering</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
              {outOfStock.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Excludes from public search</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Expiring &le;30d</span>
              <Clock className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2">
              {expiringSoon.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Within next 30 days</div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/pharmacy/pos"
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-amber-800 transition">
              POS Billing Cashier
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Rapid search checkout, auto inventory deduction & receipts
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition shrink-0" />
        </Link>

        <Link
          href="/pharmacy/stock"
          className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-teal-800 transition">
              Medicine Inventory Shelf
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Add, update quantities, edit prices, and manage expiry dates
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition shrink-0" />
        </Link>

        <Link
          href="/pharmacy/profile"
          className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-slate-800 transition">
              GPS & Profile Settings
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Store address, phone, and GPS coordinates for distance search
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition shrink-0" />
        </Link>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent POS Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last sales receipts recorded at this store</p>
          </div>
          <Link
            href="/pharmacy/invoices"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            View All Bills &rarr;
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No sales processed yet. Open POS to generate your first invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.customer_name}
                      {inv.customer_phone && (
                        <span className="text-xs text-slate-400 block font-mono">
                          {inv.customer_phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                        {inv.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{inv.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500">
                      {new Date(inv.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/pharmacy/invoices/${inv.invoice_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
