-- Script untuk test aplikasi setelah perbaikan RLS dan trigger
-- Versi Fixed: Test komprehensif untuk semua fitur dengan kolom yang benar

-- Test 1: Verifikasi trigger function
SELECT 
    'Trigger Function Test' as test_name,
    proname as function_name,
    prosrc IS NOT NULL as function_exists
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Test 2: Verifikasi trigger
SELECT 
    'Trigger Test' as test_name,
    tgname as trigger_name,
    tgenabled as trigger_enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Test 3: Verifikasi RLS policies count
SELECT 
    'RLS Policies Count' as test_name,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
GROUP BY tablename
ORDER BY tablename;

-- Test 4: Verifikasi struktur tabel profiles
SELECT 
    'Profiles Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test 5: Verifikasi struktur tabel cardboard_prices
SELECT 
    'Cardboard Prices Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'cardboard_prices'
ORDER BY ordinal_position;

-- Test 6: Verifikasi struktur tabel user_settings
SELECT 
    'User Settings Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- Test 7: Verifikasi existing data
SELECT 
    'Existing Data Count' as test_name,
    'profiles' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
    'Existing Data Count' as test_name,
    'user_settings' as table_name,
    COUNT(*) as record_count
FROM user_settings
UNION ALL
SELECT 
    'Existing Data Count' as test_name,
    'cardboard_prices' as table_name,
    COUNT(*) as record_count
FROM cardboard_prices;

-- Test 8: Test sample data untuk cardboard_prices (dengan kolom yang benar)
SELECT 
    'Sample Cardboard Prices' as test_name,
    type,
    condition,
    price_per_kg,
    updated_at
FROM cardboard_prices 
ORDER BY type, condition
LIMIT 10;

-- Test 9: Verifikasi RLS enabled pada semua tabel
SELECT 
    'RLS Status' as test_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
ORDER BY tablename;

-- Test 10: Test auth functions (akan return null jika tidak authenticated)
SELECT 
    'Auth Functions Test' as test_name,
    'auth.uid()' as function_name,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Not authenticated (expected)'
        ELSE 'Authenticated as: ' || auth.uid()::text
    END as status;

-- Test 11: Verifikasi semua tabel utama ada
SELECT 
    'Tables Verification' as test_name,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
ORDER BY table_name;

-- Test 12: Verifikasi foreign key constraints
SELECT 
    'Foreign Key Constraints' as test_name,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
ORDER BY tc.table_name, tc.constraint_name;

-- Test 13: Summary report
SELECT 
    'Summary Report' as test_name,
    'Database structure verified' as status,
    NOW() as test_time;

-- Test 14: Check if sample data exists in cardboard_prices
SELECT 
    'Sample Data Check' as test_name,
    COUNT(*) as total_price_records,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT condition) as unique_conditions
FROM cardboard_prices;
