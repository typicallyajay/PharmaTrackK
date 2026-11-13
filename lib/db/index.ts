import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { initialData, DataStore } from './mock-data';
import {
  User,
  Pharmacy,
  StockEntry,
  Reminder,
  Invoice,
  InvoiceItem,
  PharmacyStatus,
} from '@/types';
import { calculateHaversineDistance } from '@/lib/distance';

// In-memory runtime store for offline/demo mode (persists across hot-reloads)
declare global {
  var __pharmatrack_store: DataStore | undefined;
}

function getStore(): DataStore {
  if (!global.__pharmatrack_store) {
    global.__pharmatrack_store = JSON.parse(JSON.stringify(initialData));
  }
  return global.__pharmatrack_store!;
}

// ------------------------------------------------------------
// 1. Search Medicines & Nearby Alternatives
// ------------------------------------------------------------
export async function searchMedicines(
  query: string,
  userLat?: number | null,
  userLng?: number | null,
  limit: number = 50
): Promise<StockEntry[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      // First try Supabase RPC search_medicines_nearby
      const { data, error } = await supabase.rpc('search_medicines_nearby', {
        search_query: cleanQ,
        user_lat: userLat ?? null,
        user_lng: userLng ?? null,
        limit_count: limit,
      });

      if (!error && data && Array.isArray(data)) {
        return data.map((row: any) => ({
          stock_id: row.stock_id,
          pharmacy_id: row.pharmacy_id,
          medicine_name: row.medicine_name,
          generic_name: row.generic_name,
          category: row.category,
          price: Number(row.price),
          quantity: Number(row.quantity),
          expiry_date: row.expiry_date,
          distance_km: row.distance_km != null ? Number(row.distance_km) : null,
          pharmacy: {
            pharmacy_id: row.pharmacy_id,
            owner_user_id: 0,
            pharmacy_name: row.pharmacy_name,
            address: row.address,
            locality: row.locality,
            city: row.city,
            phone: row.phone,
            latitude: row.latitude != null ? Number(row.latitude) : null,
            longitude: row.longitude != null ? Number(row.longitude) : null,
            status: 'approved',
          },
        }));
      }

      // Fallback to direct supabase query
      const { data: stockData, error: stockErr } = await supabase
        .from('stock_entries')
        .select('*, pharmacy:pharmacies(*)')
        .gt('quantity', 0)
        .ilike('medicine_name', `%${cleanQ}%`)
        .limit(limit);

      if (!stockErr && stockData) {
        return stockData
          .filter((s: any) => s.pharmacy?.status === 'approved')
          .map((s: any) => {
            let distance_km: number | null = null;
            if (
              userLat != null &&
              userLng != null &&
              s.pharmacy?.latitude != null &&
              s.pharmacy?.longitude != null
            ) {
              distance_km = calculateHaversineDistance(
                userLat,
                userLng,
                s.pharmacy.latitude,
                s.pharmacy.longitude
              );
            }
            return {
              ...s,
              distance_km,
            };
          })
          .sort((a: any, b: any) => {
            if (a.distance_km != null && b.distance_km != null) {
              return a.distance_km - b.distance_km;
            }
            if (a.distance_km != null) return -1;
            if (b.distance_km != null) return 1;
            return b.quantity - a.quantity;
          });
      }
    } catch (e) {
      console.warn('Supabase search fallback to mock store:', e);
    }
  }

  // Fallback to local store
  const store = getStore();
  const approvedPharmacies = new Map(
    store.pharmacies
      .filter((p) => p.status === 'approved')
      .map((p) => [p.pharmacy_id, p])
  );

  const matched = store.stock
    .filter((s) => {
      const p = approvedPharmacies.get(s.pharmacy_id);
      if (!p || s.quantity <= 0) return false;
      const mName = s.medicine_name.toLowerCase();
      const gName = (s.generic_name || '').toLowerCase();
      return mName.includes(cleanQ) || gName.includes(cleanQ);
    })
    .map((s) => {
      const p = approvedPharmacies.get(s.pharmacy_id)!;
      let distance_km: number | null = null;
      if (
        userLat != null &&
        userLng != null &&
        p.latitude != null &&
        p.longitude != null
      ) {
        distance_km = calculateHaversineDistance(
          userLat,
          userLng,
          p.latitude,
          p.longitude
        );
      }
      return {
        ...s,
        pharmacy: p,
        distance_km,
      };
    });

  matched.sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null) {
      return a.distance_km - b.distance_km;
    }
    if (a.distance_km != null) return -1;
    if (b.distance_km != null) return 1;
    return b.quantity - a.quantity;
  });

  return matched.slice(0, limit);
}

export async function findNearbyAlternatives(
  medicineName: string,
  excludePharmacyId?: number | null,
  userLat?: number | null,
  userLng?: number | null,
  limit: number = 10
): Promise<StockEntry[]> {
  const results = await searchMedicines(medicineName, userLat, userLng, limit + 2);
  const filtered = excludePharmacyId
    ? results.filter((r) => r.pharmacy_id !== excludePharmacyId)
    : results;
  return filtered.slice(0, limit);
}

export async function logSearch(medicineName: string): Promise<void> {
  const clean = medicineName.trim();
  if (!clean) return;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('search_logs').insert([{ medicine_name: clean }]);
      return;
    } catch (e) {
      // Fallback
    }
  }

  const store = getStore();
  store.searchLogs.push({
    log_id: store.searchLogs.length + 1,
    medicine_name: clean,
    searched_at: new Date().toISOString(),
  });
}

export async function getPopularSearches(limit: number = 5): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('search_logs')
        .select('medicine_name')
        .order('searched_at', { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        const counts = new Map<string, number>();
        data.forEach((row: any) => {
          const name = row.medicine_name;
          counts.set(name, (counts.get(name) || 0) + 1);
        });
        const sorted = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map((entry) => entry[0]);
        return sorted.slice(0, limit);
      }
    } catch (e) {
      // Fallback
    }
  }

  const store = getStore();
  const counts = new Map<string, number>();
  store.searchLogs.forEach((row) => {
    counts.set(row.medicine_name, (counts.get(row.medicine_name) || 0) + 1);
  });
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);

  return sorted.length > 0
    ? sorted.slice(0, limit)
    : ['Paracetamol', 'Azithromycin', 'Metformin', 'Amoxicillin'];
}

// ------------------------------------------------------------
// 2. Pharmacy Operations
// ------------------------------------------------------------
export async function getPharmacy(pharmacyId: number): Promise<Pharmacy | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('pharmacies')
        .select('*, owner:users(name, mobile, email)')
        .eq('pharmacy_id', pharmacyId)
        .single();
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  const p = store.pharmacies.find((item) => item.pharmacy_id === pharmacyId);
  if (!p) return null;
  const owner = store.users.find((u) => u.user_id === p.owner_user_id);
  return {
    ...p,
    owner: owner ? { name: owner.name, mobile: owner.mobile, email: owner.email } : undefined,
  };
}

export async function getPharmacyByOwnerId(userId: number): Promise<Pharmacy | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('owner_user_id', userId)
        .single();
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  return store.pharmacies.find((p) => p.owner_user_id === userId) || null;
}

export async function getAllPharmacies(statusFilter?: PharmacyStatus): Promise<Pharmacy[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let q = supabase
        .from('pharmacies')
        .select('*, owner:users(name, mobile, email)')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        q = q.eq('status', statusFilter);
      }
      const { data } = await q;
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  let list = store.pharmacies.map((p) => {
    const owner = store.users.find((u) => u.user_id === p.owner_user_id);
    return {
      ...p,
      owner: owner ? { name: owner.name, mobile: owner.mobile, email: owner.email } : undefined,
    };
  });

  if (statusFilter) {
    list = list.filter((p) => p.status === statusFilter);
  }

  // Sort pending first
  list.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.pharmacy_id - a.pharmacy_id;
  });

  return list;
}

export async function updatePharmacyStatus(
  pharmacyId: number,
  status: PharmacyStatus
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({ status })
        .eq('pharmacy_id', pharmacyId);
      if (!error) return true;
    } catch (e) {}
  }

  const store = getStore();
  const p = store.pharmacies.find((item) => item.pharmacy_id === pharmacyId);
  if (!p) return false;
  p.status = status;
  return true;
}

export async function updatePharmacyProfile(
  pharmacyId: number,
  data: Partial<Pharmacy>
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update(data)
        .eq('pharmacy_id', pharmacyId);
      if (!error) return true;
    } catch (e) {}
  }

  const store = getStore();
  const p = store.pharmacies.find((item) => item.pharmacy_id === pharmacyId);
  if (!p) return false;
  Object.assign(p, data);
  return true;
}

// ------------------------------------------------------------
// 3. Stock Inventory Operations
// ------------------------------------------------------------
export async function getStockForPharmacy(pharmacyId: number): Promise<StockEntry[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('stock_entries')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('medicine_name', { ascending: true });
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  return store.stock
    .filter((s) => s.pharmacy_id === pharmacyId)
    .sort((a, b) => a.medicine_name.localeCompare(b.medicine_name));
}

export async function getStockItem(stockId: number): Promise<StockEntry | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('stock_entries')
        .select('*')
        .eq('stock_id', stockId)
        .single();
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  return store.stock.find((s) => s.stock_id === stockId) || null;
}

export async function saveStockItem(
  item: Partial<StockEntry> & { pharmacy_id: number; medicine_name: string; price: number; quantity: number }
): Promise<StockEntry> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      if (item.stock_id) {
        const { data, error } = await supabase
          .from('stock_entries')
          .update({
            medicine_name: item.medicine_name,
            generic_name: item.generic_name || null,
            category: item.category || null,
            price: item.price,
            quantity: item.quantity,
            expiry_date: item.expiry_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('stock_id', item.stock_id)
          .select()
          .single();
        if (!error && data) return data;
      } else {
        const { data, error } = await supabase
          .from('stock_entries')
          .insert([
            {
              pharmacy_id: item.pharmacy_id,
              medicine_name: item.medicine_name,
              generic_name: item.generic_name || null,
              category: item.category || null,
              price: item.price,
              quantity: item.quantity,
              expiry_date: item.expiry_date || null,
            },
          ])
          .select()
          .single();
        if (!error && data) return data;
      }
    } catch (e) {}
  }

  const store = getStore();
  if (item.stock_id) {
    const existing = store.stock.find((s) => s.stock_id === item.stock_id);
    if (!existing) throw new Error('Stock entry not found');
    Object.assign(existing, {
      ...item,
      updated_at: new Date().toISOString(),
    });
    return existing;
  } else {
    const nextId =
      store.stock.reduce((max, s) => Math.max(max, s.stock_id), 0) + 1;
    const newEntry: StockEntry = {
      stock_id: nextId,
      pharmacy_id: item.pharmacy_id,
      medicine_name: item.medicine_name,
      generic_name: item.generic_name || null,
      category: item.category || null,
      price: item.price,
      quantity: item.quantity,
      expiry_date: item.expiry_date || null,
      updated_at: new Date().toISOString(),
    };
    store.stock.unshift(newEntry);
    return newEntry;
  }
}

export async function deleteStockItem(stockId: number, pharmacyId: number): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('stock_entries')
        .delete()
        .eq('stock_id', stockId)
        .eq('pharmacy_id', pharmacyId);
      if (!error) return true;
    } catch (e) {}
  }

  const store = getStore();
  const index = store.stock.findIndex(
    (s) => s.stock_id === stockId && s.pharmacy_id === pharmacyId
  );
  if (index !== -1) {
    store.stock.splice(index, 1);
    return true;
  }
  return false;
}

// ------------------------------------------------------------
// 4. POS Billing & Invoices
// ------------------------------------------------------------
export async function createSaleInvoice(
  pharmacyId: number,
  customer: {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    doctor_name?: string;
  },
  items: Array<{
    stock_id: number;
    quantity: number;
  }>,
  billing: {
    payment_method: 'cash' | 'upi' | 'card';
    discount_percent?: number;
    tax_percent?: number;
    notes?: string;
  }
): Promise<Invoice> {
  if (!items || items.length === 0) {
    throw new Error('Cannot process an empty bill.');
  }

  const store = getStore();
  const validatedItems: InvoiceItem[] = [];
  let subtotal = 0;

  // Validate items and verify quantities
  for (const itm of items) {
    const stock = store.stock.find(
      (s) => s.stock_id === itm.stock_id && s.pharmacy_id === pharmacyId
    );
    if (!stock) {
      throw new Error(`Stock item #${itm.stock_id} not found in this pharmacy.`);
    }
    if (stock.quantity < itm.quantity) {
      throw new Error(
        `Insufficient stock for "${stock.medicine_name}". Available: ${stock.quantity}, Requested: ${itm.quantity}`
      );
    }
    const itemTotal = stock.price * itm.quantity;
    subtotal += itemTotal;
    validatedItems.push({
      item_id: 0,
      invoice_id: 0,
      stock_id: stock.stock_id,
      medicine_name: stock.medicine_name,
      generic_name: stock.generic_name,
      unit_price: stock.price,
      quantity: itm.quantity,
      total_price: itemTotal,
    });
  }

  const discountPercent = Math.max(0, billing.discount_percent || 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;

  const taxPercent = Math.max(0, billing.tax_percent || 0);
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const grandTotal = Math.round((afterDiscount + taxAmount) * 100) / 100;

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = (store.invoices.length + 1).toString().padStart(4, '0');
  const invoiceNumber = `INV-P${pharmacyId}-${dateStr}-${seq}`;

  const nextInvoiceId =
    store.invoices.reduce((max, inv) => Math.max(max, inv.invoice_id), 0) + 1;

  const newInvoice: Invoice = {
    invoice_id: nextInvoiceId,
    invoice_number: invoiceNumber,
    pharmacy_id: pharmacyId,
    customer_name: (customer.customer_name || '').trim() || 'Walk-in Customer',
    customer_phone: customer.customer_phone || null,
    customer_email: customer.customer_email || null,
    doctor_name: customer.doctor_name || null,
    subtotal,
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    tax_percent: taxPercent,
    tax_amount: taxAmount,
    total_amount: grandTotal,
    payment_method: billing.payment_method,
    payment_status: 'paid',
    notes: billing.notes || null,
    created_at: new Date().toISOString(),
    items_count: validatedItems.length,
    items: validatedItems.map((item, idx) => ({
      ...item,
      item_id: idx + 1,
      invoice_id: nextInvoiceId,
    })),
  };

  // Deduct inventory quantities
  for (const itm of items) {
    const stock = store.stock.find((s) => s.stock_id === itm.stock_id);
    if (stock) {
      stock.quantity -= itm.quantity;
      stock.updated_at = new Date().toISOString();
    }
  }

  store.invoices.unshift(newInvoice);

  // Try sync with Supabase
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: invData } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: newInvoice.invoice_number,
            pharmacy_id: newInvoice.pharmacy_id,
            customer_name: newInvoice.customer_name,
            customer_phone: newInvoice.customer_phone,
            customer_email: newInvoice.customer_email,
            doctor_name: newInvoice.doctor_name,
            subtotal: newInvoice.subtotal,
            discount_percent: newInvoice.discount_percent,
            discount_amount: newInvoice.discount_amount,
            tax_percent: newInvoice.tax_percent,
            tax_amount: newInvoice.tax_amount,
            total_amount: newInvoice.total_amount,
            payment_method: newInvoice.payment_method,
            payment_status: newInvoice.payment_status,
            notes: newInvoice.notes,
          },
        ])
        .select()
        .single();

      if (invData) {
        const itemsToInsert = newInvoice.items!.map((it) => ({
          invoice_id: invData.invoice_id,
          stock_id: it.stock_id,
          medicine_name: it.medicine_name,
          generic_name: it.generic_name,
          unit_price: it.unit_price,
          quantity: it.quantity,
          total_price: it.total_price,
        }));
        await supabase.from('invoice_items').insert(itemsToInsert);

        for (const itm of items) {
          const s = store.stock.find((st) => st.stock_id === itm.stock_id);
          if (s) {
            await supabase
              .from('stock_entries')
              .update({ quantity: s.quantity })
              .eq('stock_id', s.stock_id);
          }
        }
      }
    } catch (e) {
      console.warn('Supabase invoice sync notice:', e);
    }
  }

  return newInvoice;
}

export async function getPharmacyInvoices(
  pharmacyId: number,
  limit: number = 50
): Promise<Invoice[]> {
  const store = getStore();
  const list = store.invoices
    .filter((inv) => inv.pharmacy_id === pharmacyId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return list.slice(0, limit);
}

export async function getInvoiceById(invoiceId: number): Promise<Invoice | null> {
  const store = getStore();
  const inv = store.invoices.find((i) => i.invoice_id === invoiceId);
  if (!inv) return null;

  const pharmacy = await getPharmacy(inv.pharmacy_id);
  return {
    ...inv,
    pharmacy: pharmacy || undefined,
  };
}

// ------------------------------------------------------------
// 5. Customer Reminders
// ------------------------------------------------------------
export async function getReminders(userId: number): Promise<Reminder[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('reminder_time', { ascending: true });
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  return store.reminders
    .filter((r) => r.user_id === userId)
    .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
}

export async function addReminder(
  userId: number,
  reminder: {
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    reminder_time: string;
  }
): Promise<Reminder> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([
          {
            user_id: userId,
            medicine_name: reminder.medicine_name,
            dosage: reminder.dosage || null,
            frequency: reminder.frequency || 'Daily',
            reminder_time: reminder.reminder_time,
          },
        ])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }

  const store = getStore();
  const nextId =
    store.reminders.reduce((max, r) => Math.max(max, r.reminder_id), 0) + 1;
  const newR: Reminder = {
    reminder_id: nextId,
    user_id: userId,
    medicine_name: reminder.medicine_name,
    dosage: reminder.dosage || null,
    frequency: reminder.frequency || 'Daily',
    reminder_time: reminder.reminder_time,
    created_at: new Date().toISOString(),
  };
  store.reminders.push(newR);
  return newR;
}

export async function deleteReminder(reminderId: number, userId: number): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('reminder_id', reminderId)
        .eq('user_id', userId);
      if (!error) return true;
    } catch (e) {}
  }

  const store = getStore();
  const idx = store.reminders.findIndex(
    (r) => r.reminder_id === reminderId && r.user_id === userId
  );
  if (idx !== -1) {
    store.reminders.splice(idx, 1);
    return true;
  }
  return false;
}

// ------------------------------------------------------------
// 6. Users & Authentication
// ------------------------------------------------------------
export async function getUserByMobileOrEmail(identifier: string): Promise<User | null> {
  const clean = identifier.trim().toLowerCase();
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .or(`mobile.eq.${clean},email.ilike.${clean}`)
        .single();
      if (data) return data;
    } catch (e) {}
  }

  const store = getStore();
  return (
    store.users.find(
      (u) =>
        u.mobile === clean || (u.email && u.email.toLowerCase() === clean)
    ) || null
  );
}

export async function createUser(userData: {
  name: string;
  mobile: string;
  email?: string;
  password_hash: string;
  role: 'user' | 'pharmacy_admin' | 'super_admin';
}): Promise<User> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }

  const store = getStore();
  const nextId =
    store.users.reduce((max, u) => Math.max(max, u.user_id), 0) + 1;
  const newUser: User = {
    user_id: nextId,
    name: userData.name,
    mobile: userData.mobile,
    email: userData.email || null,
    password_hash: userData.password_hash,
    role: userData.role,
    created_at: new Date().toISOString(),
  };
  store.users.push(newUser);
  return newUser;
}

export async function createPharmacy(pharmacyData: {
  owner_user_id: number;
  pharmacy_name: string;
  address: string;
  locality: string;
  city: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  status: PharmacyStatus;
}): Promise<Pharmacy> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .insert([pharmacyData])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }

  const store = getStore();
  const nextId =
    store.pharmacies.reduce((max, p) => Math.max(max, p.pharmacy_id), 0) + 1;
  const newP: Pharmacy = {
    pharmacy_id: nextId,
    owner_user_id: pharmacyData.owner_user_id,
    pharmacy_name: pharmacyData.pharmacy_name,
    address: pharmacyData.address,
    locality: pharmacyData.locality,
    city: pharmacyData.city,
    phone: pharmacyData.phone,
    latitude: pharmacyData.latitude || null,
    longitude: pharmacyData.longitude || null,
    status: pharmacyData.status,
    created_at: new Date().toISOString(),
  };
  store.pharmacies.push(newP);
  return newP;
}

// ------------------------------------------------------------
// 7. Analytics & Stats
// ------------------------------------------------------------
export async function getSuperAdminStats() {
  const store = getStore();
  const totalPharmacies = store.pharmacies.length;
  const pendingApprovals = store.pharmacies.filter((p) => p.status === 'pending').length;
  const totalUsers = store.users.filter((u) => u.role === 'user').length;
  const totalSearches = store.searchLogs.length;

  const searchCounts = new Map<string, number>();
  store.searchLogs.forEach((l) => {
    searchCounts.set(l.medicine_name, (searchCounts.get(l.medicine_name) || 0) + 1);
  });
  const topSearches = Array.from(searchCounts.entries())
    .map(([medicine_name, count]) => ({ medicine_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalPharmacies,
    pendingApprovals,
    totalUsers,
    totalSearches,
    topSearches,
  };
}

export async function getPharmacySalesStats(pharmacyId: number) {
  const store = getStore();
  const pharmacyInvoices = store.invoices.filter((i) => i.pharmacy_id === pharmacyId);

  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonthStr = todayStr.slice(0, 7);

  let todaySales = 0;
  let monthSales = 0;
  let totalRevenue = 0;
  let totalItemsSold = 0;

  pharmacyInvoices.forEach((inv) => {
    const invDate = inv.created_at.slice(0, 10);
    const invMonth = inv.created_at.slice(0, 7);

    totalRevenue += inv.total_amount;
    if (invDate === todayStr) todaySales += inv.total_amount;
    if (invMonth === thisMonthStr) monthSales += inv.total_amount;

    if (inv.items) {
      inv.items.forEach((it) => {
        totalItemsSold += it.quantity;
      });
    }
  });

  return {
    todaySales,
    monthSales,
    totalRevenue,
    totalInvoices: pharmacyInvoices.length,
    totalItemsSold,
  };
}
