-- Row Level Security (RLS) Policies untuk Aplikasi Kardus Bekas

-- Aktifkan RLS pada semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardboard_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardboard_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk tabel profiles
-- Pengguna hanya dapat melihat profil mereka sendiri dan profil pengepul (untuk pelanggan)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers can view collector profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'customer'
    ) AND user_type = 'collector'
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Kebijakan untuk tabel cardboard_prices
-- Semua pengguna dapat melihat harga
CREATE POLICY "All users can view prices"
  ON cardboard_prices FOR SELECT
  TO authenticated
  USING (true);

-- Hanya pengepul yang dapat menambah/mengubah/menghapus harga mereka
CREATE POLICY "Collectors can insert their own prices"
  ON cardboard_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

CREATE POLICY "Collectors can update their own prices"
  ON cardboard_prices FOR UPDATE
  TO authenticated
  USING (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

CREATE POLICY "Collectors can delete their own prices"
  ON cardboard_prices FOR DELETE
  TO authenticated
  USING (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

-- Kebijakan untuk tabel price_history
-- Semua pengguna dapat melihat riwayat harga
CREATE POLICY "All users can view price history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

-- Kebijakan untuk tabel cardboard_submissions
-- Pelanggan hanya dapat melihat pengajuan mereka sendiri
CREATE POLICY "Customers can view their own submissions"
  ON cardboard_submissions FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

-- Pelanggan hanya dapat menambah pengajuan untuk diri mereka sendiri
CREATE POLICY "Customers can insert their own submissions"
  ON cardboard_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'customer'
    )
  );

-- Pelanggan hanya dapat mengubah pengajuan mereka sendiri
CREATE POLICY "Customers can update their own submissions"
  ON cardboard_submissions FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    scheduled_collector_id = auth.uid()
  );

-- Pengepul dapat melihat semua pengajuan
CREATE POLICY "Collectors can view all submissions"
  ON cardboard_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

-- Kebijakan untuk tabel submission_locations
-- Mengikuti kebijakan dari cardboard_submissions
CREATE POLICY "Users can view submission locations based on submission access"
  ON submission_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cardboard_submissions
      WHERE id = submission_id AND (
        customer_id = auth.uid() OR
        scheduled_collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND user_type = 'collector'
        )
      )
    )
  );

-- Kebijakan untuk tabel submission_photos
-- Mengikuti kebijakan dari cardboard_submissions
CREATE POLICY "Users can view submission photos based on submission access"
  ON submission_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cardboard_submissions
      WHERE id = submission_id AND (
        customer_id = auth.uid() OR
        scheduled_collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND user_type = 'collector'
        )
      )
    )
  );

-- Kebijakan untuk tabel transactions
-- Pelanggan hanya dapat melihat transaksi mereka sendiri
CREATE POLICY "Customers can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    collector_id = auth.uid()
  );

-- Pengepul dapat menambah transaksi
CREATE POLICY "Collectors can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

-- Kebijakan untuk tabel notifications
-- Pengguna hanya dapat melihat notifikasi mereka sendiri
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Kebijakan untuk tabel user_settings
-- Pengguna hanya dapat melihat dan mengubah pengaturan mereka sendiri
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Kebijakan untuk tabel collection_routes
-- Pengepul hanya dapat melihat dan mengubah rute mereka sendiri
CREATE POLICY "Collectors can view their own routes"
  ON collection_routes FOR SELECT
  TO authenticated
  USING (collector_id = auth.uid());

CREATE POLICY "Collectors can insert their own routes"
  ON collection_routes FOR INSERT
  TO authenticated
  WITH CHECK (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

CREATE POLICY "Collectors can update their own routes"
  ON collection_routes FOR UPDATE
  TO authenticated
  USING (collector_id = auth.uid());

-- Kebijakan untuk tabel route_stops
-- Mengikuti kebijakan dari collection_routes
CREATE POLICY "Collectors can view route stops based on route access"
  ON route_stops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collection_routes
      WHERE id = route_id AND collector_id = auth.uid()
    )
  );

-- Kebijakan untuk tabel inventory
-- Pengepul hanya dapat melihat dan mengubah inventori mereka sendiri
CREATE POLICY "Collectors can view their own inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (collector_id = auth.uid());

CREATE POLICY "Collectors can insert into their own inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

CREATE POLICY "Collectors can update their own inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (collector_id = auth.uid());
