import Link from 'next/link';
import { StockEntry } from '@/types';
import { formatDistance } from '@/lib/distance';
import { MapPin, Phone, Building2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface MedicineCardProps {
  item: StockEntry;
  userLat?: number | null;
  userLng?: number | null;
}

export default function MedicineCard({ item, userLat, userLng }: MedicineCardProps) {
  const pharmacy = item.pharmacy;
  const isOutOfStock = item.quantity <= 0;
  const isLowStock = item.quantity > 0 && item.quantity <= 10;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition flex flex-col justify-between">
      <div>
        {/* Header: Medicine Name & Stock Badge */}
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {item.medicine_name}
            </h3>
            {item.generic_name && (
              <p className="text-xs text-slate-500 font-medium">
                Generic: <span className="text-slate-700">{item.generic_name}</span>
              </p>
            )}
          </div>

          <div>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3" /> Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Only {item.quantity} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> In Stock ({item.quantity})
              </span>
            )}
          </div>
        </div>

        {/* Category Pill & Price */}
        <div className="flex items-center justify-between mt-3 pb-3 border-b border-slate-100">
          {item.category ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {item.category}
            </span>
          ) : (
            <span />
          )}

          <div className="text-right">
            <span className="text-xl font-extrabold text-teal-800">
              ₹{Number(item.price).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 block">per unit / strip</span>
          </div>
        </div>

        {/* Pharmacy Details */}
        {pharmacy && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Link
                href={`/store/${pharmacy.pharmacy_id}`}
                className="font-semibold text-sm text-slate-900 hover:text-teal-600 flex items-center gap-1.5 transition"
              >
                <Building2 className="w-4 h-4 text-teal-600" />
                {pharmacy.pharmacy_name}
              </Link>

              {item.distance_km != null && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {formatDistance(item.distance_km)}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {pharmacy.address}, {pharmacy.locality}, {pharmacy.city}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
        {pharmacy?.phone && (
          <a
            href={`tel:${pharmacy.phone}`}
            className="flex-1 text-center py-2 px-3 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            {pharmacy.phone}
          </a>
        )}

        {pharmacy && (
          <Link
            href={`/store/${pharmacy.pharmacy_id}`}
            className="flex-1 text-center py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1"
          >
            Store Shelf
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
