-- Script untuk memperbaiki infinite recursion dalam RLS policies
-- Versi 2: Menangani policy yang sudah ada

-- Hapus SEMUA policy yang ada untuk profiles (termasuk yang mungkin sudah ada)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop through all policies for profiles table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Hapus SEMUA policy yang ada untuk user_settings
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_settings' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_settings', policy_record.policyname);
    END LOOP;
END $$;

-- Hapus SEMUA policy yang ada untuk cardboard_submissions
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cardboard_submissions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON cardboard_submissions', policy_record.policyname);
    END LOOP;
END $$;

-- Sekarang buat policy baru yang tidak menyebabkan infinite recursion

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
  AND tablename IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions')
ORDER BY tablename, policyname;
