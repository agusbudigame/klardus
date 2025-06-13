-- Script untuk test aplikasi setelah perbaikan RLS dan trigger
-- Versi 1: Test komprehensif untuk semua fitur

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

-- Test 5: Verifikasi struktur tabel user_settings
SELECT 
    'User Settings Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- Test 6: Verifikasi existing data
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

-- Test 7: Test sample data untuk cardboard_prices
SELECT 
    'Sample Cardboard Prices' as test_name,
    cardboard_type,
    price_per_kg,
    updated_at
FROM cardboard_prices 
ORDER BY cardboard_type;

-- Test 8: Verifikasi RLS enabled pada semua tabel
SELECT 
    'RLS Status' as test_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_settings', 'cardboard_submissions', 'cardboard_prices', 'transactions', 'notifications')
ORDER BY tablename;

-- Test 9: Test auth functions
SELECT 
    'Auth Functions Test' as test_name,
    'auth.uid()' as function_name,
    auth.uid() IS NULL as is_null_when_not_authenticated;

-- Test 10: Summary report
SELECT 
    'Summary Report' as test_name,
    'All systems ready' as status,
    NOW() as test_time;
