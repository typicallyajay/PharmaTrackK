'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StockEntry } from '@/types';
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  Mail,
  Stethoscope,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

interface CartItem {
  stock_id: number;
  medicine_name: string;
  generic_name?: string | null;
  price: number;
  max_quantity: number;
  quantity: number;
}

export default function PosBillingPage() {
  const router = useRouter();
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockEntry[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout form
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pharmacy/stock')
      .then((res) => res.json())
      .then((data) => {
        setStock(data.stock || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // Filter available stock for cashier search
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const matched = stock.filter(
      (s) =>
        s.quantity > 0 &&
        (s.medicine_name.toLowerCase().includes(q) ||
          (s.generic_name && s.generic_name.toLowerCase().includes(q)))
    );
    setSearchResults(matched.slice(0, 8));
  }, [searchQuery, stock]);

  const addToCart = (item: StockEntry) => {
    const existingIndex = cart.findIndex((c) => c.stock_id === item.stock_id);
    if (existingIndex !== -1) {
      const current = cart[existingIndex];
      if (current.quantity < item.quantity) {
        const updated = [...cart];
        updated[existingIndex].quantity += 1;
        setCart(updated);
      } else {
        alert(`Cannot add more than available shelf stock (${item.quantity}).`);
      }
    } else {
      setCart([
        ...cart,
        {
          stock_id: item.stock_id,
          medicine_name: item.medicine_name,
          generic_name: item.generic_name,
          price: item.price,
          max_quantity: item.quantity,
          quantity: 1,
        },
      ]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (stockId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.stock_id === stockId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.max_quantity) {
              alert(`Maximum available stock is ${item.max_quantity}`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (stockId: number) => {
    setCart(cart.filter((c) => c.stock_id !== stockId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * (discountPercent || 0)) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * (taxPercent || 0)) / 100;
  const grandTotal = Math.round((afterDiscount + taxAmount) * 100) / 100;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Please add at least one medicine to the checkout bill.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            doctor_name: doctorName,
          },
          items: cart.map((c) => ({
            stock_id: c.stock_id,
            quantity: c.quantity,
          })),
          billing: {
            payment_method: paymentMethod,
            discount_percent: discountPercent,
            tax_percent: taxPercent,
            notes,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      // Success: redirect to invoice print view
      router.push(`/pharmacy/invoices/${data.invoice.invoice_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/pharmacy"
          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Link
          href="/pharmacy/invoices"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <Receipt className="w-4 h-4" /> Past Invoices History
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Point of Sale (POS) Cashier
          </h1>
          <p className="text-xs text-slate-500">
            Rapid medicine search, automatic stock deduction, thermal bill receipts
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* POS Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Medicine Catalog Search & Cart Items */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Search Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Search Pharmacy Stock to Bill
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type medicine name or generic (e.g. Paracetamol, Azithromycin)..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute left-5 right-5 top-[85px] z-20 bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.stock_id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="w-full text-left p-3.5 hover:bg-teal-50/80 flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-teal-700">
                        {item.medicine_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.generic_name} &bull; Stock: {item.quantity} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-800 text-sm">
                        ₹{item.price.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-teal-600 font-semibold">
                        + Add to bill
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
                Current Bill Items ({cart.length})
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                <div>The current bill is empty.</div>
                <div className="text-xs">
                  Search above to add medicines to this patient&apos;s invoice.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <div
                    key={item.stock_id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {idx + 1}. {item.medicine_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        ₹{item.price.toFixed(2)} each &bull; Max {item.max_quantity} in stock
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.stock_id, -1)}
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.stock_id, 1)}
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-24 text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.stock_id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details, Discounts, Payment & Checkout */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-lg text-slate-900 pb-3 border-b border-slate-100">
            Customer & Billing Details
          </h2>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer / Patient Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (Receipt SMS)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9898..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email (Digital Bill)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="bill@..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prescribing Doctor Name
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. R. K. Sharma"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            {/* Discounts and Tax */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GST / Tax (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="1"
                  value={taxPercent || ''}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'cash'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'upi'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Card
                </button>
              </div>
            </div>

            {/* Total Summary Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>GST Tax ({taxPercent}%):</span>
                  <span>+₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base font-black text-teal-900">
                <span>Grand Total:</span>
                <span className="text-xl text-emerald-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              {loading ? 'Processing Sale...' : `Checkout & Generate Bill (₹${grandTotal.toFixed(2)})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
