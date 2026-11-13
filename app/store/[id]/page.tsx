import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPharmacy, getStockForPharmacy } from '@/lib/db';
import {
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface StorePageProps {
  params: {
    id: string;
  };
  searchParams: {
    check?: string;
    cat?: string;
  };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const pharmacyId = parseInt(params.id);
  if (isNaN(pharmacyId)) notFound();

  const pharmacy = await getPharmacy(pharmacyId);
  if (!pharmacy || pharmacy.status !== 'approved') {
    notFound();
  }

  const stock = await getStockForPharmacy(pharmacyId);
  const checkQuery = (searchParams.check || '').trim().toLowerCase();
  const selectedCat = (searchParams.cat || '').trim();

  // Categories
  const categories = Array.from(
    new Set(stock.map((s) => s.category).filter(Boolean) as string[])
  );

  // In-store check logic
  let checkResult: {
    found: boolean;
    medicine?: (typeof stock)[0];
  } | null = null;

  if (checkQuery) {
    const matched = stock.find(
      (s) =>
        s.medicine_name.toLowerCase().includes(checkQuery) ||
        (s.generic_name && s.generic_name.toLowerCase().includes(checkQuery))
    );
    if (matched && matched.quantity > 0) {
      checkResult = { found: true, medicine: matched };
    } else {
      checkResult = { found: false, medicine: matched };
    }
  }

  // Filtered stock list
  let displayStock = stock;
  if (selectedCat) {
    displayStock = displayStock.filter((s) => s.category === selectedCat);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Pharmacy Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-sm">
            {pharmacy.pharmacy_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {pharmacy.pharmacy_name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Pharmacy
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              {pharmacy.address}, {pharmacy.locality}, {pharmacy.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {pharmacy.phone && (
            <a
              href={`tel:${pharmacy.phone}`}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-teal-600" />
              Call Pharmacy
            </a>
          )}
          {pharmacy.latitude && pharmacy.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.latitude},${pharmacy.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Directions
            </a>
          )}
        </div>
      </div>

      {/* Quick "Is it Available Here?" Checker Box */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-3xl p-6 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-teal-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            Check Availability at {pharmacy.pharmacy_name}
          </h2>
          <p className="text-xs text-teal-700 mt-1">
            Need a specific medicine right now? Type the medicine or generic name to check stock availability in this specific shop.
          </p>

          <form method="GET" className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              name="check"
              defaultValue={searchParams.check || ''}
              placeholder="e.g. Azithromycin, Paracetamol..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition"
            >
              Check Availability
            </button>
          </form>

          {/* Availability Result Alert */}
          {checkResult && (
            <div className="mt-4">
              {checkResult.found && checkResult.medicine ? (
                <div className="p-4 bg-emerald-100/80 border border-emerald-300 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-900 text-sm">
                        In Stock at {pharmacy.pharmacy_name}!
                      </div>
                      <div className="text-xs text-emerald-800">
                        {checkResult.medicine.medicine_name} is available for ₹
                        {Number(checkResult.medicine.price).toFixed(2)} ({checkResult.medicine.quantity} units available)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <div className="font-bold text-rose-900 text-sm">
                        Not in stock at {pharmacy.pharmacy_name}
                      </div>
                      <div className="text-xs text-rose-700">
                        This store either doesn&apos;t carry &ldquo;{searchParams.check}&rdquo; or is currently out of units.
                      </div>
                    </div>
                  </div>

                  {/* KEY FEATURE: "Find nearby stores that have it" */}
                  <Link
                    href={`/?q=${encodeURIComponent(searchParams.check || '')}&from_pharmacy=${pharmacyId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
                  >
                    Find nearby stores that have it
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pharmacy Stock Catalog */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Store Shelf Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {displayStock.length} medicines listed in this pharmacy
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/store/${pharmacyId}`}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  !selectedCat
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({stock.length})
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/store/${pharmacyId}?cat=${encodeURIComponent(c)}`}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCat === c
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stock Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Generic Composition</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No medicines match the selected filter.
                  </td>
                </tr>
              ) : (
                displayStock.map((item) => {
                  const outOfStock = item.quantity <= 0;
                  return (
                    <tr key={item.stock_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.medicine_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.generic_name || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.category ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {item.category}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-teal-800">
                        ₹{Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {outOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock ({item.quantity})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">
                        {item.expiry_date
                          ? new Date(item.expiry_date).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
