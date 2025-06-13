-- Script untuk memperbaiki error foreign key constraint pada cardboard_prices

-- 1. Periksa apakah ada user dengan role collector
DO $$
DECLARE
    collector_exists BOOLEAN;
    first_collector_id UUID;
BEGIN
    -- Cek apakah ada user dengan role collector
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE user_type = 'collector'
    ) INTO collector_exists;
    
    IF NOT collector_exists THEN
        RAISE NOTICE 'Tidak ada user dengan role collector. Membuat user collector dummy...';
        
        -- Buat user collector dummy jika tidak ada
        INSERT INTO auth.users (id, email, confirmed_at)
        VALUES 
            (gen_random_uuid(), 'collector@example.com', now())
        RETURNING id INTO first_collector_id;
        
        -- Buat profile untuk user collector
        INSERT INTO profiles (id, email, name, phone, user_type, operational_area, vehicle_type)
        VALUES 
            (first_collector_id, 'collector@example.com', 'Pengepul Demo', '08123456789', 'collector', 'Jakarta Selatan', 'Motor');
            
        RAISE NOTICE 'User collector dummy berhasil dibuat dengan ID: %', first_collector_id;
    ELSE
        -- Ambil ID collector pertama jika sudah ada
        SELECT id INTO first_collector_id FROM profiles WHERE user_type = 'collector' LIMIT 1;
        RAISE NOTICE 'Menggunakan collector yang sudah ada dengan ID: %', first_collector_id;
    END IF;
    
    -- 2. Update data cardboard_prices yang menggunakan ID default
    UPDATE cardboard_prices 
    SET collector_id = first_collector_id
    WHERE collector_id = '00000000-0000-0000-0000-000000000000';
    
    RAISE NOTICE 'Data cardboard_prices berhasil diupdate dengan collector_id yang valid';
    
    -- 3. Hapus data cardboard_prices yang masih memiliki collector_id tidak valid
    DELETE FROM cardboard_prices
    WHERE collector_id NOT IN (SELECT id FROM profiles WHERE user_type = 'collector');
    
    RAISE NOTICE 'Data cardboard_prices dengan collector_id tidak valid berhasil dihapus';
    END IF;
END $$;

-- 4. Coba insert data sample dengan collector_id yang valid
DO $$
DECLARE
    first_collector_id UUID;
BEGIN
    -- Ambil ID collector pertama
    SELECT id INTO first_collector_id FROM profiles WHERE user_type = 'collector' LIMIT 1;
    
    IF first_collector_id IS NOT NULL THEN
        -- Hapus data lama untuk menghindari duplikasi
        DELETE FROM cardboard_prices WHERE collector_id = first_collector_id;
        
        -- Insert data baru dengan collector_id yang valid
        INSERT INTO cardboard_prices (type, condition, price_per_kg, collector_id, is_active)
        VALUES
          ('Kardus Tebal', 'excellent', 2500, first_collector_id, true),
          ('Kardus Tebal', 'good', 2250, first_collector_id, true),
          ('Kardus Tebal', 'fair', 2000, first_collector_id, true),
          ('Kardus Tebal', 'poor', 1750, first_collector_id, true),
          ('Kardus Tipis', 'excellent', 2000, first_collector_id, true),
          ('Kardus Tipis', 'good', 1800, first_collector_id, true),
          ('Kardus Tipis', 'fair', 1600, first_collector_id, true),
          ('Kardus Tipis', 'poor', 1400, first_collector_id, true),
          ('Kardus Bekas', 'excellent', 1800, first_collector_id, true),
          ('Kardus Bekas', 'good', 1620, first_collector_id, true),
          ('Kardus Bekas', 'fair', 1440, first_collector_id, true),
          ('Kardus Bekas', 'poor', 1260, first_collector_id, true);
          
        RAISE NOTICE 'Data sample cardboard_prices berhasil diinsert dengan collector_id: %', first_collector_id;
    ELSE
        RAISE EXCEPTION 'Tidak ada collector yang tersedia di database';
    END IF;
END $$;

-- 5. Verifikasi data
SELECT 
    cp.id, 
    cp.type, 
    cp.condition, 
    cp.price_per_kg, 
    cp.collector_id,
    p.name as collector_name,
    p.user_type
FROM cardboard_prices cp
JOIN profiles p ON p.id = cp.collector_id
LIMIT 10;
