-- Fungsi dan trigger untuk aplikasi Kardus Bekas

-- Fungsi untuk membuat profil pengguna baru saat registrasi
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, user_type, name)
  VALUES (new.id, new.email, 'customer', new.raw_user_meta_data->>'name');
  
  -- Buat pengaturan default untuk pengguna baru
  INSERT INTO user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk membuat profil pengguna baru saat registrasi
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fungsi untuk mencatat perubahan harga
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_per_kg <> NEW.price_per_kg THEN
    INSERT INTO price_history (cardboard_price_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price_per_kg, NEW.price_per_kg, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk mencatat perubahan harga
CREATE TRIGGER on_price_update
  AFTER UPDATE OF price_per_kg ON cardboard_prices
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();

-- Fungsi untuk membuat notifikasi perubahan harga
CREATE OR REPLACE FUNCTION create_price_update_notification()
RETURNS TRIGGER AS $$
DECLARE
  customer_id UUID;
BEGIN
  -- Kirim notifikasi ke semua pelanggan
  FOR customer_id IN
    SELECT id FROM profiles WHERE user_type = 'customer'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      customer_id,
      'Perubahan Harga Kardus',
      'Harga ' || NEW.type || ' kondisi ' || NEW.condition || ' telah diperbarui menjadi Rp' || NEW.price_per_kg || '/kg',
      'price_update',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk membuat notifikasi perubahan harga
CREATE TRIGGER on_price_update_notification
  AFTER UPDATE OF price_per_kg ON cardboard_prices
  FOR EACH ROW
  EXECUTE FUNCTION create_price_update_notification();

-- Fungsi untuk membuat notifikasi pengajuan baru
CREATE OR REPLACE FUNCTION create_submission_notification()
RETURNS TRIGGER AS $$
DECLARE
  collector_id UUID;
BEGIN
  -- Kirim notifikasi ke semua pengepul
  FOR collector_id IN
    SELECT id FROM profiles WHERE user_type = 'collector'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      collector_id,
      'Pengajuan Kardus Baru',
      'Pengajuan kardus baru seberat ' || NEW.weight || 'kg telah dibuat',
      'submission',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk membuat notifikasi pengajuan baru
CREATE TRIGGER on_submission_created
  AFTER INSERT ON cardboard_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_submission_notification();

-- Fungsi untuk membuat notifikasi jadwal pickup
CREATE OR REPLACE FUNCTION create_pickup_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status <> 'scheduled') THEN
    -- Kirim notifikasi ke pelanggan
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      'Jadwal Pickup Dikonfirmasi',
      'Pengajuan kardus Anda telah dijadwalkan untuk diambil pada ' || 
      to_char(NEW.scheduled_pickup_date, 'DD Mon YYYY HH24:MI'),
      'pickup',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk membuat notifikasi jadwal pickup
CREATE TRIGGER on_submission_scheduled
  AFTER UPDATE OF status, scheduled_pickup_date ON cardboard_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_pickup_notification();

-- Fungsi untuk membuat notifikasi transaksi baru
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Kirim notifikasi ke pelanggan
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (
    NEW.customer_id,
    'Transaksi Berhasil',
    'Transaksi pembelian kardus seberat ' || NEW.weight || 'kg telah selesai dengan total Rp' || NEW.total_amount,
    'transaction',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk membuat notifikasi transaksi baru
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_notification();

-- Fungsi untuk memperbarui status pengajuan saat transaksi dibuat
CREATE OR REPLACE FUNCTION update_submission_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.submission_id IS NOT NULL THEN
    UPDATE cardboard_submissions
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = NEW.submission_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk memperbarui status pengajuan saat transaksi dibuat
CREATE TRIGGER on_transaction_update_submission
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_on_transaction();

-- Fungsi untuk memperbarui inventori saat transaksi dibuat
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Tambahkan ke inventori pengepul
  INSERT INTO inventory (
    collector_id,
    type,
    condition,
    weight,
    acquired_date,
    source,
    notes
  )
  VALUES (
    NEW.collector_id,
    NEW.type,
    (SELECT condition FROM cardboard_submissions WHERE id = NEW.submission_id),
    NEW.weight,
    CURRENT_DATE,
    'purchase',
    'Dari transaksi #' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk memperbarui inventori saat transaksi dibuat
CREATE TRIGGER on_transaction_update_inventory
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_transaction();
