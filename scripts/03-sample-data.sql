-- Data sampel untuk aplikasi Kardus Bekas

-- Contoh data harga kardus (akan diisi oleh pengepul setelah registrasi)
INSERT INTO cardboard_prices (type, condition, price_per_kg, collector_id, is_active)
VALUES
  ('Kardus Tebal', 'excellent', 2500, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tebal', 'good', 2250, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tebal', 'fair', 2000, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tebal', 'poor', 1750, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tipis', 'excellent', 2000, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tipis', 'good', 1800, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tipis', 'fair', 1600, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Tipis', 'poor', 1400, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Bekas', 'excellent', 1800, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Bekas', 'good', 1620, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Bekas', 'fair', 1440, '00000000-0000-0000-0000-000000000000', true),
  ('Kardus Bekas', 'poor', 1260, '00000000-0000-0000-0000-000000000000', true);

-- Catatan: Ganti '00000000-0000-0000-0000-000000000000' dengan ID pengepul yang sebenarnya
-- setelah registrasi pengguna pertama kali.

-- Contoh data pengaturan default untuk pengguna baru
-- Akan diisi secara otomatis oleh trigger setelah registrasi
