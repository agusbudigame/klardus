-- Script verifikasi final untuk memastikan aplikasi siap digunakan
-- Versi 1: Comprehensive final check

-- Test 1: Verifikasi semua komponen database
SELECT 
    'Database Components Status' as category,
    'Tables' as component,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')

UNION ALL

SELECT 
    'Database Components Status' as category,
    'RLS Policies' as component,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Database Components Status' as category,
    'Triggers' as component,
    COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'

UNION ALL

SELECT 
    'Database Components Status' as category,
    'Functions' as component,
    COUNT(*) as count
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Test 2: Verifikasi data sample
SELECT 
    'Sample Data Status' as category,
    'Cardboard Prices' as component,
    COUNT(*) as count
FROM cardboard_prices

UNION ALL

SELECT 
    'Sample Data Status' as category,
    'User Profiles' as component,
    COUNT(*) as count
FROM profiles

UNION ALL

SELECT 
    'Sample Data Status' as category,
    'User Settings' as component,
    COUNT(*) as count
FROM user_settings;

-- Test 3: Verifikasi harga kardus per kategori
SELECT 
    'Price Data by Type' as category,
    type as component,
    COUNT(*) as count
FROM cardboard_prices 
GROUP BY type
ORDER BY type;

-- Test 4: Verifikasi harga kardus per kondisi
SELECT 
    'Price Data by Condition' as category,
    condition as component,
    COUNT(*) as count
FROM cardboard_prices 
GROUP BY condition
ORDER BY 
    CASE condition 
        WHEN 'excellent' THEN 1
        WHEN 'good' THEN 2
        WHEN 'fair' THEN 3
        WHEN 'poor' THEN 4
    END;

-- Test 5: Verifikasi range harga
SELECT 
    'Price Range Analysis' as category,
    type as component,
    MIN(price_per_kg) as min_price,
    MAX(price_per_kg) as max_price,
    AVG(price_per_kg)::numeric(10,2) as avg_price
FROM cardboard_prices 
GROUP BY type
ORDER BY type;

-- Test 6: Status RLS per tabel
SELECT 
    'RLS Status per Table' as category,
    tablename as component,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
ORDER BY tablename;

-- Test 7: Verifikasi auth functions tersedia
SELECT 
    'Auth Functions Available' as category,
    'auth.uid()' as component,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Available (not authenticated)'
        ELSE 'Available (authenticated)'
    END as status;

-- Test 8: Final readiness check
SELECT 
    'Application Readiness' as category,
    'Overall Status' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
        ) = 6
        AND (
            SELECT COUNT(*) FROM cardboard_prices
        ) > 0
        AND (
            SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
        ) > 0
        THEN '✅ READY FOR TESTING'
        ELSE '❌ NOT READY'
    END as status;

-- Test 9: Recommended test scenarios
SELECT 
    'Recommended Tests' as category,
    test_scenario as component,
    'Ready to test' as status
FROM (
    VALUES 
        ('User Registration'),
        ('User Login'),
        ('Customer Dashboard'),
        ('Collector Dashboard'),
        ('Price Viewing'),
        ('Profile Management'),
        ('Forgot Password'),
        ('Reset Password')
) AS tests(test_scenario);

-- Test 10: Sample price data untuk referensi
SELECT 
    'Sample Price Reference' as category,
    CONCAT(type, ' - ', condition) as component,
    CONCAT('Rp ', price_per_kg::text, '/kg') as price
FROM cardboard_prices 
ORDER BY type, 
    CASE condition 
        WHEN 'excellent' THEN 1
        WHEN 'good' THEN 2
        WHEN 'fair' THEN 3
        WHEN 'poor' THEN 4
    END;
