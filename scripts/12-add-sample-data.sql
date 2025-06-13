-- Script untuk menambahkan sample data jika belum ada
-- Versi 1: Sample data untuk testing

-- Cek apakah sudah ada data di cardboard_prices
DO $$
DECLARE
    price_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO price_count FROM cardboard_prices;
    
    IF price_count = 0 THEN
        RAISE NOTICE 'No price data found. Adding sample data...';
        
        -- Insert sample cardboard prices
        INSERT INTO cardboard_prices (type, condition, price_per_kg, collector_id, is_active) VALUES
        ('Kardus Bekas', 'excellent', 3500.00, NULL, true),
        ('Kardus Bekas', 'good', 3000.00, NULL, true),
        ('Kardus Bekas', 'fair', 2500.00, NULL, true),
        ('Kardus Bekas', 'poor', 2000.00, NULL, true),
        ('Kardus Tebal', 'excellent', 4000.00, NULL, true),
        ('Kardus Tebal', 'good', 3500.00, NULL, true),
        ('Kardus Tebal', 'fair', 3000.00, NULL, true),
        ('Kardus Tebal', 'poor', 2500.00, NULL, true),
        ('Kardus Tipis', 'excellent', 3000.00, NULL, true),
        ('Kardus Tipis', 'good', 2500.00, NULL, true),
        ('Kardus Tipis', 'fair', 2000.00, NULL, true),
        ('Kardus Tipis', 'poor', 1500.00, NULL, true);
        
        RAISE NOTICE 'Sample price data added successfully!';
    ELSE
        RAISE NOTICE 'Price data already exists (% records)', price_count;
    END IF;
END $$;

-- Verifikasi data yang baru ditambahkan
SELECT 
    'Sample Data Verification' as test_name,
    type,
    condition,
    price_per_kg,
    is_active
FROM cardboard_prices 
ORDER BY type, 
    CASE condition 
        WHEN 'excellent' THEN 1
        WHEN 'good' THEN 2
        WHEN 'fair' THEN 3
        WHEN 'poor' THEN 4
    END;

-- Summary
SELECT 
    'Sample Data Summary' as test_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT condition) as unique_conditions,
    MIN(price_per_kg) as min_price,
    MAX(price_per_kg) as max_price
FROM cardboard_prices;
