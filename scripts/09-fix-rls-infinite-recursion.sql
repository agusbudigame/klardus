-- Hapus semua policy yang ada untuk profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Customers can view collector profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Buat policy baru yang tidak menyebabkan infinite recursion
-- Policy untuk melihat profil sendiri
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy untuk melihat profil pengepul (tanpa mengakses tabel profiles lagi)
-- Kita akan menggunakan auth.jwt() untuk mendapatkan user_type dari JWT token
CREATE POLICY "Authenticated users can view collector profiles"
  ON profiles FOR SELECT
  USING (user_type = 'collector');

-- Policy untuk update profil sendiri
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy untuk insert profil (diperlukan saat registrasi)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Perbaiki policy untuk user_settings juga
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Perbaiki policy untuk cardboard_submissions
DROP POLICY IF EXISTS "Customers can view their own submissions" ON cardboard_submissions;
DROP POLICY IF EXISTS "Collectors can view all submissions" ON cardboard_submissions;

-- Policy yang lebih sederhana untuk submissions
CREATE POLICY "Users can view relevant submissions"
  ON cardboard_submissions FOR SELECT
  USING (
    customer_id = auth.uid() OR 
    scheduled_collector_id = auth.uid()
  );

-- Policy untuk insert submissions (hanya customer)
CREATE POLICY "Customers can insert submissions"
  ON cardboard_submissions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Policy untuk update submissions
CREATE POLICY "Users can update relevant submissions"
  ON cardboard_submissions FOR UPDATE
  USING (
    customer_id = auth.uid() OR 
    scheduled_collector_id = auth.uid()
  );
