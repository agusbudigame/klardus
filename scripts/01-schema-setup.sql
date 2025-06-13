-- Skema Database untuk Aplikasi Kardus Bekas

-- Tabel Profiles untuk menyimpan data pengguna (pelanggan dan pengepul)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  bio TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'collector')),
  
  -- Kolom khusus untuk pelanggan
  company_name TEXT,
  
  -- Kolom khusus untuk pengepul
  operational_area TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  max_capacity NUMERIC(10, 2)
);

-- Tabel untuk menyimpan harga kardus berdasarkan jenis dan kondisi
CREATE TABLE IF NOT EXISTS cardboard_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  price_per_kg NUMERIC(10, 2) NOT NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Memastikan kombinasi jenis, kondisi, dan pengepul unik
  UNIQUE(type, condition, collector_id)
);

-- Tabel untuk menyimpan riwayat perubahan harga
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cardboard_price_id UUID REFERENCES cardboard_prices(id) ON DELETE CASCADE,
  old_price NUMERIC(10, 2),
  new_price NUMERIC(10, 2),
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Tabel untuk menyimpan pengajuan penjualan kardus dari pelanggan
CREATE TABLE IF NOT EXISTS cardboard_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  weight NUMERIC(10, 2) NOT NULL CHECK (weight >= 10), -- Minimum 10kg
  condition TEXT NOT NULL CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  estimated_price NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  scheduled_collector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_pickup_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'))
);

-- Tabel untuk menyimpan lokasi pengajuan kardus
CREATE TABLE IF NOT EXISTS submission_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES cardboard_submissions(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  pickup_instructions TEXT
);

-- Tabel untuk menyimpan foto kardus
CREATE TABLE IF NOT EXISTS submission_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES cardboard_submissions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan transaksi pembelian kardus
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_id UUID REFERENCES cardboard_submissions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  weight NUMERIC(10, 2) NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  receipt_number TEXT UNIQUE
);

-- Tabel untuk menyimpan notifikasi
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('price_update', 'submission', 'pickup', 'transaction', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- Bisa merujuk ke submission_id, transaction_id, dll
  action_url TEXT
);

-- Tabel untuk menyimpan pengaturan pengguna
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'id',
  notification_price_updates BOOLEAN DEFAULT TRUE,
  notification_pickups BOOLEAN DEFAULT TRUE,
  notification_transactions BOOLEAN DEFAULT TRUE,
  notification_promotions BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  location_tracking BOOLEAN DEFAULT FALSE,
  
  -- Pengaturan khusus untuk pengepul
  route_optimization BOOLEAN DEFAULT TRUE,
  auto_refresh_map BOOLEAN DEFAULT TRUE,
  fuel_consumption NUMERIC(10, 2) -- km/liter
);

-- Tabel untuk menyimpan rute pengepul
CREATE TABLE IF NOT EXISTS collection_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  route_date DATE NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  total_distance NUMERIC(10, 2),
  estimated_time INTEGER, -- dalam menit
  estimated_fuel_cost NUMERIC(10, 2),
  actual_fuel_cost NUMERIC(10, 2),
  notes TEXT
);

-- Tabel untuk menyimpan titik-titik dalam rute
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES collection_routes(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES cardboard_submissions(id) ON DELETE SET NULL,
  stop_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  arrival_time TIMESTAMP WITH TIME ZONE,
  departure_time TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Tabel untuk menyimpan inventori kardus pengepul
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  weight NUMERIC(10, 2) NOT NULL,
  acquired_date DATE NOT NULL,
  source TEXT, -- 'purchase', 'donation', etc.
  notes TEXT,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'processed'))
);

-- Fungsi untuk memperbarui timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk memperbarui timestamp pada tabel profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger untuk memperbarui timestamp pada tabel cardboard_prices
CREATE TRIGGER update_cardboard_prices_updated_at
BEFORE UPDATE ON cardboard_prices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger untuk memperbarui timestamp pada tabel cardboard_submissions
CREATE TRIGGER update_cardboard_submissions_updated_at
BEFORE UPDATE ON cardboard_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
