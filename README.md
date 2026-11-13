# PharmaTrack 2.0 (Next.js + Supabase + PostgreSQL)

A modern, full-stack **Local Pharmacy Medicine Stock Search, GPS Proximity Locator, Point of Sale (POS) Billing & Medication Reminder System** built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and backed by **PostgreSQL** and **Supabase**.

---

## 🚀 Key Features

### 1. 🔍 Public Medicine Stock Search & GPS Proximity
- **Real-Time Stock Query**: Search any medicine or generic compound across all approved local pharmacies.
- **Haversine Distance Sorting**: Automatically computes distance in kilometers/meters between the customer's coordinates and pharmacies, displaying nearest pharmacies first.
- **Graceful Fallback**: Pharmacies without GPS coordinates still display gracefully.
- **Nearby Alternatives Recommendation**: If a customer checks a pharmacy where a medicine is out of stock, PharmaTrack instantly highlights the nearest neighboring pharmacies that have it ready on their shelves.

### 2. 🏪 Verified Pharmacy Storefronts (`/store/[id]`)
- Profile information: Verified badge, address, locality, phone (with direct call button), and Google Maps routing.
- Live store shelf catalog with category filter pills (Antibiotic, Painkiller, Antacid, Vitamins, etc.).
- Interactive **"Check Availability at this store"** search box with 1-click alternative pharmacy finder if out of stock.

### 3. 💳 Point of Sale (POS) Cashier & Medical Billing (`/pharmacy/pos`)
- Rapid medicine auto-suggest from store shelf.
- Dynamic cart management with stock quantity boundary checking.
- Patient/customer details, prescribing doctor info, custom discount %, and GST / Tax %.
- Payment methods: Cash, UPI / QR, Card.
- **Atomic Stock Deduction**: Automatically deducts billed medicine quantities from the live inventory.
- **Thermal & A4 Print-Ready Receipts** (`/pharmacy/invoices/[id]`): Clean, professional bill layout with itemized breakdown, tax, and medical disclaimer.

### 4. ⏰ Customer Medication Reminders (`/reminders`)
- Daily schedule organized by time of day: Morning, Afternoon, Evening, Night.
- Frequency options: Daily, Twice a day, Thrice a day, Weekly.
- **1-Click Local Refill Check**: Direct shortcut from each reminder card to search nearby chemist stock before running out of pills.

### 5. 🛡️ Super Admin Control Center (`/admin`)
- Master system KPIs: Total Pharmacies, Pending Approvals, Customer Count, Total Searches Logged.
- **Top Searched Medicines Demand Trends**: Bar charts showing popular community medicine demand to guide procurement.
- **Pharmacy Verification Workflow**: Review, approve, reject, or deactivate pharmacy registrations.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL & Supabase |
| **Geospatial Logic** | Haversine Formula (PostgreSQL RPC + TS Client/Server) |
| **Authentication** | Secure HTTP-only JWT sessions with Bcrypt hashing & Supabase Auth compatibility |
| **Icons** | Lucide React |

---

## 📋 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(By default, PharmaTrack includes a pre-seeded high-fidelity in-memory runtime store so you can explore all features immediately even before setting up Supabase!)*

### 3. Connect to Supabase PostgreSQL (Optional but Recommended)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard:
   - Run `supabase/schema.sql` to create all PostgreSQL tables, indexes, and the `search_medicines_nearby` RPC function.
   - Run `supabase/seed.sql` to load demo pharmacies (Abu Road coordinates), inventory, and sample users.
3. In your Supabase Project Settings > **API**, copy your **URL** and **Anon Key**, and add them to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SESSION_SECRET=a-secure-random-string-at-least-32-chars
   ```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Logins

All demo accounts can be tested using the **1-Click Demo Buttons** on the `/login` page:

| Role | Mobile / Identifier | Password | Access & Features |
|---|---|---|---|
| **Super Admin** | `9999999999` | `Admin@123` | Pharmacy verification, system analytics, demand chart |
| **City Medicos** | `9811111111` | `Pharma@123` | Pharmacy dashboard, POS checkout, shelf inventory |
| **WellCare Pharmacy** | `9822222222` | `Pharma@123` | Pharmacy dashboard, POS checkout, shelf inventory |
| **Lifeline Medical** | `9833333333` | `Pharma@123` | Pharmacy dashboard, POS checkout, shelf inventory |
| **Sanjeevani Store** | `9844444444` | `Pharma@123` | Status: *Pending* (approved via Super Admin dashboard) |
| **Customer** | `9800000000` | `User@123` | Customer view, personal medication reminders |

---

## 🧪 Testing the Core Features

1. **Nearby Stock Search**:
   - Go to `/` and search for `"Azithromycin"`.
   - WellCare Pharmacy and Lifeline Medical Store appear in stock. City Medicos has 0 quantity and is excluded.
2. **Alternative Store Recommendation**:
   - Visit `/store/1` (City Medicos).
   - In the "Check Availability" box, search `"Azithromycin"`.
   - See the out-of-stock warning with the button: **"Find nearby stores that have it →"**. Click it to view WellCare and Lifeline as alternatives.
3. **POS Checkout & Bill Generation**:
   - Sign in as City Medicos (`9811111111` / `Pharma@123`).
   - Go to `/pharmacy/pos`, search for `Paracetamol`, set quantity, apply discount, select payment method, and click **Checkout**.
   - Review the generated printable receipt with automatic stock decrement!
4. **Super Admin Approval**:
   - Sign in as Super Admin (`9999999999` / `Admin@123`).
   - Navigate to `/admin` to approve **Sanjeevani Store**. Once approved, its stock appears in public searches.

---

## 📁 Repository Structure

```
pharmatrack/
├── app/
│   ├── layout.tsx                # Global HTML shell & navigation
│   ├── page.tsx                  # Public medicine search & GPS locator
│   ├── store/[id]/page.tsx       # Pharmacy profile & availability check
│   ├── login/page.tsx            # Login with 1-click demo accounts
│   ├── register/page.tsx         # Customer & Pharmacy registration
│   ├── reminders/page.tsx        # Customer dosage reminders
│   ├── pharmacy/
│   │   ├── page.tsx              # Pharmacy dashboard & analytics
│   │   ├── stock/page.tsx        # Medicine inventory shelf
│   │   ├── stock/new/page.tsx    # Add medicine
│   │   ├── stock/[id]/page.tsx   # Edit medicine
│   │   ├── pos/page.tsx          # POS cashier system
│   │   ├── invoices/page.tsx     # Past bills history
│   │   ├── invoices/[id]/page.tsx# Printable medical receipt
│   │   └── profile/page.tsx      # GPS coordinates & store settings
│   ├── admin/page.tsx            # Super admin control center
│   └── api/                      # REST endpoints for auth, pos, & stock
├── components/                   # Reusable UI components
├── lib/
│   ├── auth/session.ts           # JWT session cookie authentication
│   ├── db/                       # Supabase client + fallback data layer
│   └── distance.ts               # Haversine distance calculations
├── supabase/
│   ├── schema.sql                # Complete PostgreSQL tables, indexes & RPC
│   ├── seed.sql                  # Initial demo data & pharmacies
│   └── README.md                 # Supabase setup guide
└── legacy_php/                   # Preserved original PHP BCA project code
```
