import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getInvoiceById } from '@/lib/db';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Receipt,
  Mail,
  Building2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import PrintButton from '@/components/PrintButton';

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const invoiceId = parseInt(params.id, 10);
  if (isNaN(invoiceId)) notFound();

  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) notFound();

  const pharmacy = invoice.pharmacy;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Action buttons (hidden on print) */}
      <div className="no-print flex items-center justify-between gap-4">
        <Link
          href="/pharmacy/invoices"
          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/pharmacy/pos"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            New Sale POS
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Printable Receipt Card */}
      <div className="print-area bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg space-y-8">
        {/* Pharmacy Top Header */}
        <div className="border-b border-slate-200 pb-6 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Pharmacy POS Receipt
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {pharmacy?.pharmacy_name || 'Medical Store'}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {pharmacy?.address}, {pharmacy?.locality}, {pharmacy?.city}
            {pharmacy?.phone && <span> &bull; Phone: {pharmacy.phone}</span>}
          </p>
        </div>

        {/* Invoice Metadata & Customer Info */}
        <div className="grid grid-cols-2 gap-6 text-xs pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
              Billed To
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {invoice.customer_name}
            </div>
            {invoice.customer_phone && (
              <div className="text-slate-500">Phone: {invoice.customer_phone}</div>
            )}
            {invoice.customer_email && (
              <div className="text-slate-500">Email: {invoice.customer_email}</div>
            )}
            {invoice.doctor_name && (
              <div className="text-teal-700 font-medium pt-1">
                Prescribed by: {invoice.doctor_name}
              </div>
            )}
          </div>

          <div className="space-y-1 text-right">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
              Receipt Details
            </span>
            <div className="font-mono font-bold text-teal-800 text-sm">
              {invoice.invoice_number}
            </div>
            <div className="text-slate-500">
              Date: {new Date(invoice.created_at).toLocaleDateString()}
            </div>
            <div className="text-slate-500">
              Time: {new Date(invoice.created_at).toLocaleTimeString()}
            </div>
            <div className="text-slate-700 font-semibold uppercase">
              Paid via: {invoice.payment_method}
            </div>
          </div>
        </div>

        {/* Itemized Medicine List */}
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-teal-600 text-teal-900 font-bold uppercase">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Medicine / Item</th>
                <th className="py-2.5 text-right">Rate</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5">
                    <div className="font-bold text-slate-900">{item.medicine_name}</div>
                    {item.generic_name && (
                      <div className="text-[11px] text-slate-400">{item.generic_name}</div>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    ₹{item.unit_price.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                  <td className="py-2.5 text-right font-bold font-mono text-slate-900">
                    ₹{item.total_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="pt-4 border-t border-slate-200">
          <div className="max-w-xs ml-auto space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold font-mono text-slate-800">
                ₹{invoice.subtotal.toFixed(2)}
              </span>
            </div>

            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({invoice.discount_percent}%):</span>
                <span className="font-mono">-₹{invoice.discount_amount.toFixed(2)}</span>
              </div>
            )}

            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>GST Tax ({invoice.tax_percent}%):</span>
                <span className="font-mono">+₹{invoice.tax_amount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t-2 border-slate-800 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-xl text-teal-800 font-mono">
                ₹{invoice.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-slate-100 pt-6 text-center space-y-1 text-slate-400 text-[11px]">
          <div className="font-bold text-teal-800">
            Thank you for choosing {pharmacy?.pharmacy_name}!
          </div>
          <div>Wishing you good health and a speedy recovery.</div>
          <div className="text-[10px] text-slate-300 pt-2">
            Powered by PharmaTrack &bull; Electronic Healthcare POS Billing
          </div>
        </div>
      </div>
    </div>
  );
}
