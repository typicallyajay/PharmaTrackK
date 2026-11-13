-- ============================================================
-- PharmaTrack 2.0 - Supabase / PostgreSQL Seed Data
-- Demo Admins, Pharmacies with Abu Road GPS coordinates, and initial stock
-- ============================================================

-- 1. Demo Users
-- Passwords:
-- Super Admin: Admin@123 ($2a$10$f3wUfGkWXl2bXk8N59s47.9eM4hVjF8E8088m0Y78aQ.V1h1hYm9O)
-- Pharmacy Admins: Pharma@123 ($2a$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi)
-- Customer: User@123 ($2a$10$p0b3R.8705K2F7oG2I1Z8ex94wP64YV5q49O9qXkO.Q6uK3Uv2m82)

INSERT INTO users (user_id, name, mobile, email, password_hash, role) VALUES
(1, 'Super Admin', '9999999999', 'admin@pharmatrack.local', '$2a$10$f3wUfGkWXl2bXk8N59s47.9eM4hVjF8E8088m0Y78aQ.V1h1hYm9O', 'super_admin'),
(2, 'Ramesh Sharma', '9811111111', 'ramesh@citymedicos.local', '$2a$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
(3, 'Suresh Verma', '9822222222', 'suresh@wellcarepharma.local', '$2a$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
(4, 'Anita Joshi', '9833333333', 'anita@lifelinemedical.local', '$2a$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
(5, 'Deepak Rathore', '9844444444', 'deepak@sanjeevanistore.local', '$2a$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
(6, 'Rahul Patel', '9800000000', 'rahul@gmail.com', '$2a$10$p0b3R.8705K2F7oG2I1Z8ex94wP64YV5q49O9qXkO.Q6uK3Uv2m82', 'user')
ON CONFLICT (user_id) DO NOTHING;

-- Reset users sequence
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- 2. Demo Pharmacies (with real Abu Road, Rajasthan coordinates for distance testing)
INSERT INTO pharmacies (pharmacy_id, owner_user_id, pharmacy_name, address, locality, city, phone, latitude, longitude, status) VALUES
(1, 2, 'City Medicos', 'Station Road, Near Bus Stand', 'Station Road', 'Abu Road', '9811111111', 24.4881000, 72.7833000, 'approved'),
(2, 3, 'WellCare Pharmacy', 'Gandhi Chowk Market', 'Gandhi Chowk', 'Abu Road', '9822222222', 24.4935000, 72.7791000, 'approved'),
(3, 4, 'Lifeline Medical Store', 'Hospital Road, Opposite Civil Hospital', 'Hospital Road', 'Abu Road', '9833333333', 24.4820000, 72.7902000, 'approved'),
(4, 5, 'Sanjeevani Store', 'Shastri Nagar Main Market', 'Shastri Nagar', 'Abu Road', '9844444444', 24.5012000, 72.7688000, 'pending')
ON CONFLICT (pharmacy_id) DO NOTHING;

-- Reset pharmacies sequence
SELECT setval('pharmacies_pharmacy_id_seq', (SELECT MAX(pharmacy_id) FROM pharmacies));

-- 3. Demo Stock Entries
-- Staggered quantities to showcase the "nearby alternatives" feature:
-- Azithromycin is 0 in City Medicos, but in-stock in WellCare (40) and Lifeline (25).
INSERT INTO stock_entries (stock_id, pharmacy_id, medicine_name, generic_name, category, price, quantity, expiry_date) VALUES
-- City Medicos (ID 1)
(1, 1, 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 18.00, 120, '2027-06-30'),
(2, 1, 'Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 85.00, 0, '2027-01-15'),
(3, 1, 'Cetirizine 10mg', 'Cetirizine', 'Antiallergic', 12.00, 60, '2027-09-10'),
(4, 1, 'Omeprazole 20mg', 'Omeprazole', 'Antacid', 45.00, 85, '2027-10-15'),
(5, 1, 'Ibuprofen 400mg', 'Ibuprofen', 'Painkiller', 22.00, 110, '2027-08-01'),

-- WellCare Pharmacy (ID 2)
(6, 2, 'Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 90.00, 40, '2027-03-20'),
(7, 2, 'Metformin 500mg', 'Metformin', 'Diabetes', 32.00, 75, '2027-11-05'),
(8, 2, 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 17.50, 0, '2027-04-12'),
(9, 2, 'Pantoprazole 40mg', 'Pantoprazole', 'Antacid', 55.00, 45, '2027-05-18'),
(10, 2, 'Cough Syrup 100ml', 'Dextromethorphan', 'Cough & Cold', 65.00, 30, '2026-11-30'),

-- Lifeline Medical Store (ID 3)
(11, 3, 'Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 88.00, 25, '2026-12-01'),
(12, 3, 'Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 45.00, 50, '2027-07-18'),
(13, 3, 'Atorvastatin 10mg', 'Atorvastatin', 'Cholesterol', 55.00, 30, '2027-08-22'),
(14, 3, 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 18.50, 90, '2027-06-15'),
(15, 3, 'Vitamin C 500mg Chewable', 'Ascorbic Acid', 'Vitamins', 25.00, 150, '2028-01-01'),

-- Sanjeevani Store (ID 4 - pending approval)
(16, 4, 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 16.00, 100, '2027-05-01')
ON CONFLICT (stock_id) DO NOTHING;

-- Reset stock sequence
SELECT setval('stock_entries_stock_id_seq', (SELECT MAX(stock_id) FROM stock_entries));

-- 4. Demo Search Logs
INSERT INTO search_logs (medicine_name, searched_at) VALUES
('Paracetamol', NOW() - INTERVAL '1 day'),
('Azithromycin', NOW() - INTERVAL '2 days'),
('Paracetamol', NOW() - INTERVAL '3 days'),
('Metformin', NOW() - INTERVAL '4 days'),
('Azithromycin', NOW() - INTERVAL '5 days'),
('Amoxicillin', NOW() - INTERVAL '6 days'),
('Cetirizine', NOW() - INTERVAL '7 days');

-- 5. Demo Reminders for Customer
INSERT INTO reminders (reminder_id, user_id, medicine_name, dosage, frequency, reminder_time) VALUES
(1, 6, 'Paracetamol 500mg', '1 tablet after food', 'Twice a day', '08:30:00'),
(2, 6, 'Metformin 500mg', '1 tablet with dinner', 'Daily', '20:30:00'),
(3, 6, 'Vitamin C 500mg', '1 chewable tablet', 'Daily', '13:00:00')
ON CONFLICT (reminder_id) DO NOTHING;

-- Reset reminders sequence
SELECT setval('reminders_reminder_id_seq', (SELECT MAX(reminder_id) FROM reminders));
