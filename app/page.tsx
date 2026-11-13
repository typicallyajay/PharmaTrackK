import { searchMedicines, logSearch, getPopularSearches, getPharmacy } from '@/lib/db';
import MedicineCard from '@/components/MedicineCard';
import LocationPrompt from '@/components/LocationPrompt';
import { Search, MapPin, Sparkles, AlertCircle, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: {
    q?: string;
    user_lat?: string;
    user_lng?: string;
    from_pharmacy?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const query = (searchParams.q || '').trim();
  const userLat = searchParams.user_lat ? parseFloat(searchParams.user_lat) : null;
  const userLng = searchParams.user_lng ? parseFloat(searchParams.user_lng) : null;
  const fromPharmacyId = searchParams.from_pharmacy ? parseInt(searchParams.from_pharmacy) : null;

  let results: any[] = [];
  let fromPharmacy: any = null;

  if (query) {
    results = await searchMedicines(query, userLat, userLng);
    await logSearch(query);

    if (fromPharmacyId) {
      fromPharmacy = await getPharmacy(fromPharmacyId);
      results = results.filter((r) => r.pharmacy_id !== fromPharmacyId);
    }
  }

  const popularSearches = await getPopularSearches(5);

  return (
    <div>
      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-teal-800 to-teal-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-700/60 border border-teal-500/30 text-teal-200 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Live Inventory & GPS Proximity Distance
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Find medicine in stock near you
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Instantly locate available prescriptions and live inventory at verified local pharmacies. If one store is out of stock, find the nearest ones that have it.
          </p>

          {/* Search Box Form */}
          <div className="max-w-2xl mx-auto pt-2">
            <form action="/" method="GET" className="relative flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="e.g. Azithromycin, Paracetamol, Cetirizine..."
                  autoFocus
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-400/30 text-base font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Pass coordinates if present */}
              {userLat && <input type="hidden" name="user_lat" value={userLat} />}
              {userLng && <input type="hidden" name="user_lng" value={userLng} />}

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-base shrink-0"
              >
                <Search className="w-5 h-5" />
                Search Stock
              </button>
            </form>

            {/* Popular Searches Tags */}
            <div className="flex items-center justify-center flex-wrap gap-2 mt-4 text-xs">
              <span className="text-teal-300 font-medium">Trending searches:</span>
              {popularSearches.map((term) => (
                <Link
                  key={term}
                  href={`/?q=${encodeURIComponent(term)}${
                    userLat && userLng ? `&user_lat=${userLat}&user_lng=${userLng}` : ''
                  }`}
                  className="px-2.5 py-1 rounded-lg bg-teal-700/50 hover:bg-teal-700 text-teal-100 hover:text-white border border-teal-600/40 transition"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Results / Features Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* If user came from a specific pharmacy where item was out of stock */}
        {fromPharmacy && query && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-base">
                &ldquo;{query}&rdquo; is not available at {fromPharmacy.pharmacy_name}
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                Showing nearest verified pharmacies in the area that currently have stock ready for pickup:
              </p>
            </div>
          </div>
        )}

        {/* Results Heading */}
        {query ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Search Results for &ldquo;{query}&rdquo;
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Found <span className="font-semibold text-teal-700">{results.length}</span> available stock matches
                  {userLat && userLng ? ' sorted by closest distance' : ''}
                </p>
              </div>

              {/* GPS Location helper toggle */}
              {!userLat && (
                <LocationPrompt query={query} />
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No pharmacies currently have &ldquo;{query}&rdquo; in stock
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                  Try searching by generic name (e.g. Paracetamol instead of Calpol), or check back later as pharmacy admins update inventory regularly.
                </p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition"
                  >
                    View Popular Medicines
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item) => (
                  <MedicineCard
                    key={`${item.pharmacy_id}-${item.stock_id}`}
                    item={item}
                    userLat={userLat}
                    userLng={userLng}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Landing Page Overview Features */
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900">How PharmaTrack Works</h2>
              <p className="text-sm text-slate-500 mt-1">
                Bridging local healthcare and community pharmacies with real-time stock and distance calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">1. Instant Medicine Search</h3>
                <p className="text-sm text-slate-600">
                  Search any prescription, tablet, or generic composition across all verified pharmacies in town.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">2. GPS Distance Routing</h3>
                <p className="text-sm text-slate-600">
                  Using high-precision Haversine mathematical calculation, results are ranked by actual distance from your coordinates.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">3. Nearby Alternatives</h3>
                <p className="text-sm text-slate-600">
                  If a medicine is out of stock at your local chemist, 1-click reveals which neighboring stores have it ready right now.
                </p>
              </div>
            </div>

            {/* Demo Pharmacies Preview */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-teal-900">Verified Local Pharmacies</h3>
                  <p className="text-sm text-teal-700">Browse verified pharmacies in Abu Road and inspect their live shelves</p>
                </div>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  Register a Pharmacy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/store/1"
                  className="bg-white p-5 rounded-2xl border border-teal-100 hover:border-teal-300 hover:shadow-md transition block group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-teal-700 transition">City Medicos</div>
                  <div className="text-xs text-slate-500 mt-1">Station Road, Near Bus Stand</div>
                  <div className="text-xs text-teal-600 font-semibold mt-3 flex items-center gap-1">
                    View Live Shelf &rarr;
                  </div>
                </Link>

                <Link
                  href="/store/2"
                  className="bg-white p-5 rounded-2xl border border-teal-100 hover:border-teal-300 hover:shadow-md transition block group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-teal-700 transition">WellCare Pharmacy</div>
                  <div className="text-xs text-slate-500 mt-1">Gandhi Chowk Market</div>
                  <div className="text-xs text-teal-600 font-semibold mt-3 flex items-center gap-1">
                    View Live Shelf &rarr;
                  </div>
                </Link>

                <Link
                  href="/store/3"
                  className="bg-white p-5 rounded-2xl border border-teal-100 hover:border-teal-300 hover:shadow-md transition block group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-teal-700 transition">Lifeline Medical Store</div>
                  <div className="text-xs text-slate-500 mt-1">Hospital Road, Opp. Civil Hospital</div>
                  <div className="text-xs text-teal-600 font-semibold mt-3 flex items-center gap-1">
                    View Live Shelf &rarr;
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
