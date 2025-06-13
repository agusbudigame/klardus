-- Script untuk memperbaiki infinite recursion dalam RLS policies
-- Versi 3: Menangani policy yang sudah ada di SEMUA tabel

-- Fungsi untuk menghapus semua policy pada tabel tertentu
CREATE OR REPLACE FUNCTION drop_all_policies_for_table(table_name text) RETURNS void AS $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = table_name AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
        RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Hapus semua policy untuk tabel-tabel yang kita gunakan
SELECT drop_all_policies_for_table('profiles');
SELECT drop_all_policies_for_table('user_settings');
SELECT drop_all_policies_for_table('cardboard_submissions');
SELECT drop_all_policies_for_table('cardboard_prices');
SELECT drop_all_policies_for_table('transactions');
SELECT drop_all_policies_for_table('notifications');

-- Hapus fungsi helper setelah digunakan
DROP FUNCTION IF EXISTS drop_all_policies_for_table;

-- POLICIES UNTUK PROFILES TABLE
-- Policy untuk melihat profil sendiri
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy untuk melihat profil pengepul (semua user yang terautentikasi bisa melihat profil collector)
CREATE POLICY "Authenticated users can view collector profiles"
  ON profiles FOR SELECT
  USING (user_type = 'collector' AND auth.role() = 'authenticated');

-- Policy untuk update profil sendiri
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy untuk insert profil (diperlukan saat registrasi)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- POLICIES UNTUK USER_SETTINGS TABLE
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- POLICIES UNTUK CARDBOARD_SUBMISSIONS TABLE
-- Policy untuk melihat submissions yang relevan
CREATE POLICY "Users can view relevant submissions"
  ON cardboard_submissions FOR SELECT
  USING (
    customer_id = auth.uid() OR 
    scheduled_collector_id = auth.uid()
  );

-- Policy untuk insert submissions (hanya customer yang bisa membuat submission)
CREATE POLICY "Customers can insert submissions"
  ON cardboard_submissions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Policy untuk update submissions
CREATE POLICY "Users can update relevant submissions"
  ON cardboard_submissions FOR UPDATE
  USING (
    customer_id = auth.uid() OR 
    scheduled_collector_id = auth.uid()
  )
  WITH CHECK (
    customer_id = auth.uid() OR 
    scheduled_collector_id = auth.uid()
  );

-- POLICIES UNTUK CARDBOARD_PRICES TABLE
-- Semua user bisa melihat harga
CREATE POLICY "Everyone can view prices"
  ON cardboard_prices FOR SELECT
  USING (true);

-- Hanya collector yang bisa update harga
CREATE POLICY "Collectors can update prices"
  ON cardboard_prices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

-- POLICIES UNTUK TRANSACTIONS TABLE
-- User bisa melihat transaksi mereka sendiri
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    customer_id = auth.uid() OR 
    collector_id = auth.uid()
  );

-- Collector bisa insert transaksi
CREATE POLICY "Collectors can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    collector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'collector'
    )
  );

-- User bisa update transaksi yang relevan
CREATE POLICY "Users can update relevant transactions"
  ON transactions FOR UPDATE
  USING (
    customer_id = auth.uid() OR 
    collector_id = auth.uid()
  );

-- POLICIES UNTUK NOTIFICATIONS TABLE
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Tampilkan semua policy yang berhasil dibuat
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
ORDER BY tablename, policyname;
