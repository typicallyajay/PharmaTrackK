import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getPharmacyByOwnerId, getPharmacyInvoices } from '@/lib/db';
import { Receipt, ArrowLeft, Printer, Plus, Search } from 'lucide-react';

export default async function PharmacyInvoicesListPage() {
  const session = await getSession();
  if (!session || session.role !== 'pharmacy_admin') {
    redirect('/login');
  }

  const pharmacy = await getPharmacyByOwnerId(session.user_id);
  if (!pharmacy) redirect('/pharmacy');

  const invoices = await getPharmacyInvoices(pharmacy.pharmacy_id, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/pharmacy"
          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Link
          href="/pharmacy/pos"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Open POS Cashier
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              POS Invoices & Sales Receipts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record of all processed sales transactions and digital medical receipts
            </p>
          </div>
          <div className="text-xs font-bold text-slate-400">
            Total {invoices.length} Bills
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            No invoices have been recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {inv.customer_name}
                      {inv.customer_phone && (
                        <span className="text-xs text-slate-400 block font-mono">
                          {inv.customer_phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {inv.doctor_name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                        {inv.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">
                      ₹{inv.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-emerald-700">
                      {inv.discount_amount > 0 ? `-₹${inv.discount_amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      ₹{inv.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500">
                      {new Date(inv.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/pharmacy/invoices/${inv.invoice_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Bill
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
