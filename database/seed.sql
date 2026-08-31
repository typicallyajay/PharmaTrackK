-- ============================================================
-- PharmaTrack Seed Data
-- Sample pharmacy admins, pharmacies (with coordinates), and stock
-- so the "search nearby" feature can be demoed immediately.
-- All demo pharmacy admin passwords = Pharma@123
-- ============================================================
USE pharmatrack;

-- Demo pharmacy admin users
-- password hash below = 'Pharma@123'
INSERT INTO users (name, mobile, email, password_hash, role) VALUES
('Ramesh Sharma', '9811111111', 'ramesh@citymedicos.local', '$2y$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
('Suresh Verma', '9822222222', 'suresh@wellcarepharma.local', '$2y$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
('Anita Joshi', '9833333333', 'anita@lifelinemedical.local', '$2y$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin'),
('Deepak Rathore', '9844444444', 'deepak@sanjeevanistore.local', '$2y$10$rj4KPLv0Gx7I93gEiATwcuN2mISN/M5DJ/ZJmnp9M3wruWOn07Gvi', 'pharmacy_admin');

-- Demo pharmacies (Abu Road, Rajasthan area coordinates, spread out for distance demo)
INSERT INTO pharmacies (owner_user_id, pharmacy_name, address, locality, city, phone, latitude, longitude, status) VALUES
((SELECT user_id FROM users WHERE mobile='9811111111'), 'City Medicos', 'Station Road, Near Bus Stand', 'Station Road', 'Abu Road', '9811111111', 24.4881, 72.7833, 'approved'),
((SELECT user_id FROM users WHERE mobile='9822222222'), 'WellCare Pharmacy', 'Gandhi Chowk Market', 'Gandhi Chowk', 'Abu Road', '9822222222', 24.4935, 72.7791, 'approved'),
((SELECT user_id FROM users WHERE mobile='9833333333'), 'Lifeline Medical Store', 'Hospital Road', 'Hospital Road', 'Abu Road', '9833333333', 24.4820, 72.7902, 'approved'),
((SELECT user_id FROM users WHERE mobile='9844444444'), 'Sanjeevani Store', 'Shastri Nagar Main Market', 'Shastri Nagar', 'Abu Road', '9844444444', 24.5012, 72.7688, 'pending');

-- Stock entries -- deliberately staggered so the same medicine is
-- available at some pharmacies and NOT at others (to demo the
-- "not available here -> nearby alternatives" feature)
INSERT INTO stock_entries (pharmacy_id, medicine_name, generic_name, category, price, quantity, expiry_date) VALUES
-- City Medicos
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='City Medicos'), 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 18.00, 120, '2027-06-30'),
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='City Medicos'), 'Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 85.00, 0, '2027-01-15'),
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='City Medicos'), 'Cetirizine 10mg', 'Cetirizine', 'Antiallergic', 12.00, 60, '2027-09-10'),

-- WellCare Pharmacy
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='WellCare Pharmacy'), 'Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 90.00, 40, '2027-03-20'),
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='WellCare Pharmacy'), 'Metformin 500mg', 'Metformin', 'Diabetes', 32.00, 75, '2027-11-05'),
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='WellCare Pharmacy'), 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 17.50, 0, '2027-04-12'),

-- Lifeline Medical Store
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='Lifeline Medical Store'), 'Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 88.00, 25, '2026-12-01'),
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='Lifeline Medical Store'), 'Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 45.00, 50, '2027-07-18'),
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='Lifeline Medical Store'), 'Atorvastatin 10mg', 'Atorvastatin', 'Cholesterol', 55.00, 30, '2027-08-22'),

-- Sanjeevani Store (still pending approval, should NOT appear in public search)
((SELECT pharmacy_id FROM pharmacies WHERE pharmacy_name='Sanjeevani Store'), 'Paracetamol 500mg', 'Paracetamol', 'Painkiller', 16.00, 100, '2027-05-01');
