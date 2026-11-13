-- ============================================================
-- PharmaTrack 2.0 - Supabase / PostgreSQL Schema
-- Local Pharmacy Medicine Stock Search & Reminder System
-- Point of Sale (POS) & Medical Billing System
-- ============================================================

-- Enable required extensions (for UUID generation if needed and trigram search)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------
-- 1. users: Customers, Pharmacy Admins, and Super Admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'pharmacy_admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. pharmacies: Verified local pharmacy storefronts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacies (
    pharmacy_id SERIAL PRIMARY KEY,
    owner_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    pharmacy_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Abu Road',
    phone VARCHAR(15) NOT NULL,
    latitude NUMERIC(10, 7) NULL,
    longitude NUMERIC(10, 7) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deactivated')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. stock_entries: Medicine inventory per pharmacy
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_entries (
    stock_id SERIAL PRIMARY KEY,
    pharmacy_id INT NOT NULL REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NULL,
    category VARCHAR(80) NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 0,
    expiry_date DATE NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. reminders: Personal customer dosage alerts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NULL,
    frequency VARCHAR(50) NULL,
    reminder_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. search_logs: Query analytics & trending demand metrics
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
    log_id SERIAL PRIMARY KEY,
    medicine_name VARCHAR(150) NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. invoices: POS Sales receipts & billing invoices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    pharmacy_id INT NOT NULL REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(15) NULL,
    customer_email VARCHAR(150) NULL,
    doctor_name VARCHAR(150) NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid')),
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. invoice_items: Line items for POS billing
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    item_id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    stock_id INT NULL REFERENCES stock_entries(stock_id) ON DELETE SET NULL,
    medicine_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL
);

-- ------------------------------------------------------------
-- Performance Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies(status);
CREATE INDEX IF NOT EXISTS idx_stock_medicine ON stock_entries(medicine_name);
CREATE INDEX IF NOT EXISTS idx_stock_pharmacy ON stock_entries(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_invoices_pharmacy ON invoices(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_time ON search_logs(searched_at DESC);

-- ------------------------------------------------------------
-- Haversine Distance Search Stored Procedure (Supabase RPC)
-- Calculates distance in km between user location and pharmacies
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_medicines_nearby(
    search_query TEXT,
    user_lat DOUBLE PRECISION DEFAULT NULL,
    user_lng DOUBLE PRECISION DEFAULT NULL,
    limit_count INT DEFAULT 50
)
RETURNS TABLE (
    stock_id INT,
    pharmacy_id INT,
    pharmacy_name VARCHAR,
    address VARCHAR,
    locality VARCHAR,
    city VARCHAR,
    phone VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    medicine_name VARCHAR,
    generic_name VARCHAR,
    category VARCHAR,
    price NUMERIC,
    quantity INT,
    expiry_date DATE,
    distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        se.stock_id,
        p.pharmacy_id,
        p.pharmacy_name,
        p.address,
        p.locality,
        p.city,
        p.phone,
        p.latitude,
        p.longitude,
        se.medicine_name,
        se.generic_name,
        se.category,
        se.price,
        se.quantity,
        se.expiry_date,
        CASE
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
            THEN (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(user_lat)) * cos(radians(p.latitude::double precision)) *
                    cos(radians(p.longitude::double precision) - radians(user_lng)) +
                    sin(radians(user_lat)) * sin(radians(p.latitude::double precision))
                ))
            ))
            ELSE NULL
        END AS distance_km
    FROM stock_entries se
    JOIN pharmacies p ON p.pharmacy_id = se.pharmacy_id
    WHERE p.status = 'approved'
      AND se.quantity > 0
      AND (
          se.medicine_name ILIKE '%' || search_query || '%'
          OR (se.generic_name IS NOT NULL AND se.generic_name ILIKE '%' || search_query || '%')
      )
    ORDER BY
        (user_lat IS NOT NULL AND p.latitude IS NULL) ASC,
        distance_km ASC NULLS LAST,
        se.quantity DESC,
        se.price ASC
    LIMIT limit_count;
END;
$$;
