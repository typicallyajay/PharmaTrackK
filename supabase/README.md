# Supabase & PostgreSQL Setup for PharmaTrack

Follow these steps to connect PharmaTrack to your Supabase PostgreSQL database:

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **"New Project"**.
3. Choose a name (e.g. `pharmatrack`), select a strong database password, and pick a region close to your users.
4. Wait for the project initialization to complete (~1-2 minutes).

---

## 2. Execute Database Schema & Seed Data

1. In your Supabase Dashboard, navigate to the **SQL Editor** tab (left sidebar).
2. Click **"New query"**.
3. Copy the entire contents of [`supabase/schema.sql`](./schema.sql) and paste it into the editor.
4. Click **"Run"** (or press Ctrl + Enter). This creates all 7 tables, indexes, constraints, and the Haversine distance search stored procedure (`search_medicines_nearby`).
5. Open another new query tab, copy the contents of [`supabase/seed.sql`](./seed.sql), paste it, and click **"Run"**. This populates:
   - Super Admin user (`9999999999` / `Admin@123`)
   - 4 Pharmacy admin accounts (`Pharma@123`)
   - 4 Verified/Pending Pharmacies with real Abu Road GPS coordinates
   - Sample medicines and inventory stock
   - Demo reminders and search logs

---

## 3. Configure Environment Variables

1. In Supabase Dashboard, go to **Project Settings** > **API**.
2. Copy the **Project URL** and the **`anon` `public` key** (and optionally the `service_role` key for administrative operations).
3. In your project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in the values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   SESSION_SECRET=super-secret-random-key-at-least-32-chars
   ```

---

## 4. Demo Login Credentials

| Role | Mobile / Identifier | Password | Access / Notes |
|---|---|---|---|
| **Super Admin** | `9999999999` | `Admin@123` | Master control panel, approve pharmacies, analytics |
| **City Medicos** | `9811111111` | `Pharma@123` | Pharmacy dashboard, POS checkout, stock inventory |
| **WellCare Pharmacy** | `9822222222` | `Pharma@123` | Pharmacy dashboard, POS checkout, stock inventory |
| **Lifeline Medical** | `9833333333` | `Pharma@123` | Pharmacy dashboard, POS checkout, stock inventory |
| **Sanjeevani Store** | `9844444444` | `Pharma@123` | Status: *Pending* (approved via Super Admin) |
| **Customer (User)** | `9800000000` | `User@123` | Customer view, personal medication reminders |
