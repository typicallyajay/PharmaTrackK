import Link from 'next/link';
import { Pill, MapPin, Receipt, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Pill className="w-4 h-4 -rotate-45" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Pharma<span className="text-teal-600">Track</span>
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Real-time local pharmacy stock locator, GPS distance routing, POS medical billing, and dosage reminder system.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-teal-600 transition">
                  Search Medicines
                </Link>
              </li>
              <li>
                <Link href="/reminders" className="hover:text-teal-600 transition">
                  Medication Reminders
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-teal-600 transition">
                  Register Your Pharmacy
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-600 transition">
                  Member Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology Highlights */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Architecture
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Next.js 14 App Router
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                PostgreSQL & Supabase
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Haversine Distance Routing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Thermal POS Billing Engine
              </li>
            </ul>
          </div>

          {/* Security & Verification */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Security
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Verified Pharmacies Only
              </div>
              <p className="text-xs text-slate-500">
                All listed stores undergo administrator credential verification prior to public search appearance.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} PharmaTrack. Built with Next.js, Supabase & PostgreSQL.</p>
          <p className="flex items-center gap-1">
            Empowering community pharmacies & healthcare <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
