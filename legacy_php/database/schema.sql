-- ============================================================
-- PharmaTrack Database Schema
-- Local Pharmacy Medicine Stock Search & Reminder System
-- Point of Sale (POS) & Medical Billing System
-- ============================================================

CREATE DATABASE IF NOT EXISTS pharmatrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmatrack;

-- ------------------------------------------------------------
-- users : public users + pharmacy admins + super admin
--   role: 'user' | 'pharmacy_admin' | 'super_admin'
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'pharmacy_admin', 'super_admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- pharmacies : one row per pharmacy, linked to a pharmacy_admin user
--   status: 'pending' | 'approved' | 'rejected' | 'deactivated'
--   latitude/longitude are optional -- used for "nearby" sorting when present
-- ------------------------------------------------------------
CREATE TABLE pharmacies (
    pharmacy_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id INT NOT NULL,
    pharmacy_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Abu Road',
    phone VARCHAR(15) NOT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    status ENUM('pending', 'approved', 'rejected', 'deactivated') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- stock_entries : medicines stocked by a pharmacy
-- ------------------------------------------------------------
CREATE TABLE stock_entries (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NULL,
    category VARCHAR(80) NULL,
    price DECIMAL(8,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    expiry_date DATE NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    INDEX idx_medicine_name (medicine_name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- reminders : personal medicine reminders for a user
-- ------------------------------------------------------------
CREATE TABLE reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NULL,
    frequency VARCHAR(50) NULL,
    reminder_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- search_logs : used for admin stats (most-searched medicines) and
-- to power the "notify me when back in stock" style features later
-- ------------------------------------------------------------
CREATE TABLE search_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(150) NOT NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- invoices : POS sales receipts & billing invoices
-- ------------------------------------------------------------
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    pharmacy_id INT NOT NULL,
    customer_name VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(15) NULL,
    customer_email VARCHAR(150) NULL,
    doctor_name VARCHAR(150) NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('cash', 'upi', 'card') NOT NULL DEFAULT 'cash',
    payment_status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'paid',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    INDEX idx_pharmacy_created (pharmacy_id, created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- invoice_items : individual line items in a sale invoice
-- ------------------------------------------------------------
CREATE TABLE invoice_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    stock_id INT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stock_entries(stock_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed: one super admin (password = Admin@123 -- CHANGE after first login)
-- Password hash below corresponds to 'Admin@123' via PHP password_hash()
-- ------------------------------------------------------------
INSERT INTO users (name, mobile, email, password_hash, role)
VALUES ('Super Admin', '9999999999', 'admin@pharmatrack.local',
'$2y$10$qLMWk5tIp8luRVi2VIJeT.zKdazZNTjMtxOfQ3XTmOmCdxjKZwY5S', 'super_admin');
