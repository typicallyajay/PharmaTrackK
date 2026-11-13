export type UserRole = 'user' | 'pharmacy_admin' | 'super_admin';

export interface User {
  user_id: number;
  name: string;
  mobile: string;
  email?: string | null;
  password_hash: string;
  role: UserRole;
  created_at?: string;
}

export type PharmacyStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface Pharmacy {
  pharmacy_id: number;
  owner_user_id: number;
  pharmacy_name: string;
  address: string;
  locality: string;
  city: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  status: PharmacyStatus;
  created_at?: string;
  owner?: {
    name: string;
    mobile: string;
    email?: string | null;
  };
}

export interface StockEntry {
  stock_id: number;
  pharmacy_id: number;
  medicine_name: string;
  generic_name?: string | null;
  category?: string | null;
  price: number;
  quantity: number;
  expiry_date?: string | null;
  updated_at?: string;
  pharmacy?: Pharmacy;
  distance_km?: number | null;
}

export interface Reminder {
  reminder_id: number;
  user_id: number;
  medicine_name: string;
  dosage?: string | null;
  frequency?: string | null;
  reminder_time: string; // HH:MM or HH:MM:SS
  created_at?: string;
}

export interface SearchLog {
  log_id: number;
  medicine_name: string;
  searched_at: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card';
export type PaymentStatus = 'paid' | 'unpaid';

export interface Invoice {
  invoice_id: number;
  invoice_number: string;
  pharmacy_id: number;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  doctor_name?: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at: string;
  items_count?: number;
  items?: InvoiceItem[];
  pharmacy?: Pharmacy;
}

export interface InvoiceItem {
  item_id: number;
  invoice_id: number;
  stock_id?: number | null;
  medicine_name: string;
  generic_name?: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface SessionUser {
  user_id: number;
  name: string;
  mobile: string;
  email?: string | null;
  role: UserRole;
  pharmacy_id?: number | null;
}
