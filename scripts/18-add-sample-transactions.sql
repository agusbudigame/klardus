-- Script untuk menambahkan data sample transaksi dan inventory

DO $$
DECLARE
    first_collector_id UUID;
    first_customer_id UUID;
    submission_id UUID;
    transaction_id UUID;
    customer_exists BOOLEAN;
BEGIN
    -- 1. Ambil ID collector pertama
    SELECT id INTO first_collector_id FROM profiles WHERE user_type = 'collector' LIMIT 1;
    
    -- 2. Cek apakah ada customer
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE user_type = 'customer'
    ) INTO customer_exists;
    
    IF NOT customer_exists THEN
        RAISE NOTICE 'Tidak ada user dengan role customer. Membuat user customer dummy...';
        
        -- Buat user customer dummy jika tidak ada
        INSERT INTO auth.users (id, email, confirmed_at)
        VALUES 
            (gen_random_uuid(), 'customer@example.com', now())
        RETURNING id INTO first_customer_id;
        
        -- Buat profile untuk user customer
        INSERT INTO profiles (id, email, name, phone, user_type, company_name)
        VALUES 
            (first_customer_id, 'customer@example.com', 'Pelanggan Demo', '08123456789', 'customer', 'Toko Demo');
            
        RAISE NOTICE 'User customer dummy berhasil dibuat dengan ID: %', first_customer_id;
    ELSE
        -- Ambil ID customer pertama jika sudah ada
        SELECT id INTO first_customer_id FROM profiles WHERE user_type = 'customer' LIMIT 1;
        RAISE NOTICE 'Menggunakan customer yang sudah ada dengan ID: %', first_customer_id;
    END IF;
    
    -- 3. Buat submission sample
    INSERT INTO cardboard_submissions (
        customer_id, 
        type, 
        weight, 
        condition, 
        estimated_price, 
        notes, 
        status, 
        scheduled_collector_id,
        scheduled_pickup_date,
        completed_at,
        priority
    )
    VALUES (
        first_customer_id,
        'Kardus Tebal',
        25.5,
        'good',
        57375, -- 25.5 * 2250
        'Kardus bekas packaging elektronik',
        'completed',
        first_collector_id,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day',
        'medium'
    )
    RETURNING id INTO submission_id;
    
    -- 4. Tambahkan lokasi submission
    INSERT INTO submission_locations (
        submission_id,
        address,
        latitude,
        longitude,
        pickup_instructions
    )
    VALUES (
        submission_id,
        'Jl. Contoh No. 123, Jakarta Selatan',
        -6.2088,
        106.8456,
        'Di depan toko, hubungi satpam jika kesulitan'
    );
    
    -- 5. Buat transaksi sample
    INSERT INTO transactions (
        submission_id,
        customer_id,
        collector_id,
        type,
        weight,
        price_per_kg,
        total_amount,
        payment_status,
        notes,
        transaction_date,
        pickup_location,
        customer_notes,
        collector_notes
    )
    VALUES (
        submission_id,
        first_customer_id,
        first_collector_id,
        'Kardus Tebal',
        25.5,
        2250,
        57375, -- 25.5 * 2250
        'completed',
        'Transaksi pertama',
        CURRENT_DATE - INTERVAL '1 day',
        'Jl. Contoh No. 123, Jakarta Selatan',
        'Terima kasih atas layanannya',
        'Kardus dalam kondisi baik'
    )
    RETURNING id INTO transaction_id;
    
    -- 6. Buat beberapa transaksi tambahan dengan tanggal berbeda
    -- Transaksi 2 (3 hari lalu)
    INSERT INTO transactions (
        customer_id,
        collector_id,
        type,
        weight,
        price_per_kg,
        total_amount,
        payment_status,
        transaction_date
    )
    VALUES (
        first_customer_id,
        first_collector_id,
        'Kardus Tipis',
        15.2,
        1800,
        27360, -- 15.2 * 1800
        'completed',
        CURRENT_DATE - INTERVAL '3 days'
    );
    
    -- Transaksi 3 (5 hari lalu)
    INSERT INTO transactions (
        customer_id,
        collector_id,
        type,
        weight,
        price_per_kg,
        total_amount,
        payment_status,
        transaction_date
    )
    VALUES (
        first_customer_id,
        first_collector_id,
        'Kardus Bekas',
        18.7,
        1620,
        30294, -- 18.7 * 1620
        'completed',
        CURRENT_DATE - INTERVAL '5 days'
    );
    
    -- Transaksi 4 (7 hari lalu)
    INSERT INTO transactions (
        customer_id,
        collector_id,
        type,
        weight,
        price_per_kg,
        total_amount,
        payment_status,
        transaction_date
    )
    VALUES (
        first_customer_id,
        first_collector_id,
        'Kardus Tebal',
        22.3,
        2250,
        50175, -- 22.3 * 2250
        'completed',
        CURRENT_DATE - INTERVAL '7 days'
    );
    
    -- Transaksi 5 (pending)
    INSERT INTO transactions (
        customer_id,
        collector_id,
        type,
        weight,
        price_per_kg,
        total_amount,
        payment_status,
        transaction_date
    )
    VALUES (
        first_customer_id,
        first_collector_id,
        'Kardus Tipis',
        12.8,
        1800,
        23040, -- 12.8 * 1800
        'pending',
        CURRENT_DATE
    );
    
    RAISE NOTICE 'Data sample transaksi berhasil dibuat';
    
    -- 7. Verifikasi data transaksi
    RAISE NOTICE 'Verifikasi data transaksi:';
    
END $$;

-- Verifikasi data transaksi
SELECT 
    t.id, 
    t.receipt_number,
    t.transaction_date,
    t.type,
    t.weight,
    t.price_per_kg,
    t.total_amount,
    t.payment_status,
    c.name as customer_name,
    col.name as collector_name
FROM transactions t
JOIN profiles c ON c.id = t.customer_id
JOIN profiles col ON col.id = t.collector_id
ORDER BY t.transaction_date DESC;

-- Verifikasi data inventory (yang seharusnya sudah diupdate oleh trigger)
SELECT 
    i.id,
    i.type,
    i.condition,
    i.weight,
    i.acquired_date,
    i.status,
    i.purchase_price,
    i.estimated_selling_price,
    p.name as collector_name
FROM inventory i
JOIN profiles p ON p.id = i.collector_id
ORDER BY i.acquired_date DESC;
