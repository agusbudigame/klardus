-- Test basic database functionality
SELECT 
  'Database connection successful' as status,
  current_timestamp as timestamp,
  current_user as user_role;

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'user_settings', 'cardboard_prices')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'user_settings');
