-- Script untuk memperbaiki auth trigger
-- Versi 2: Menambahkan extensive logging dan exception handling

-- Hapus trigger dan function yang sudah ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Buat function baru dengan logging dan exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type text;
  full_name text;
  avatar_url text;
  phone_number text;
  address text;
  v_error_msg text;
BEGIN
  -- Log the start of the function
  RAISE LOG 'handle_new_user: Starting for user %', new.id;
  
  BEGIN
    -- Extract user data from metadata
    user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'customer');
    full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
    avatar_url := COALESCE(new.raw_user_meta_data->>'avatar_url', '');
    phone_number := COALESCE(new.raw_user_meta_data->>'phone_number', '');
    address := COALESCE(new.raw_user_meta_data->>'address', '');
    
    RAISE LOG 'handle_new_user: Extracted metadata for user % - type: %, name: %', 
      new.id, user_type, full_name;
    
    -- Insert into profiles with ON CONFLICT DO NOTHING to prevent duplicate errors
    INSERT INTO public.profiles (id, email, full_name, avatar_url, user_type, phone_number, address, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      full_name,
      avatar_url,
      user_type,
      phone_number,
      address,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'handle_new_user: Profile created for user %', new.id;
    
    -- Insert into user_settings with ON CONFLICT DO NOTHING
    INSERT INTO public.user_settings (user_id, email_notifications, push_notifications, theme, language)
    VALUES (
      new.id,
      true,
      true,
      'light',
      'id'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'handle_new_user: User settings created for user %', new.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Capture the error message
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
    
    -- Log the error but don't rethrow it to prevent user creation failure
    RAISE WARNING 'handle_new_user: Error creating profile for user %: %', new.id, v_error_msg;
    
    -- Insert a basic profile record to ensure the user can still use the app
    BEGIN
      INSERT INTO public.profiles (id, email, user_type, created_at, updated_at)
      VALUES (new.id, new.email, 'customer', now(), now())
      ON CONFLICT (id) DO NOTHING;
      
      RAISE LOG 'handle_new_user: Created fallback profile for user %', new.id;
    EXCEPTION WHEN OTHERS THEN
      -- Just log this error but don't fail
      RAISE WARNING 'handle_new_user: Failed to create fallback profile for user %', new.id;
    END;
  END;
  
  -- Always return NEW to ensure the user is created regardless of profile creation success
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log that the trigger has been created
DO $$
BEGIN
  RAISE NOTICE 'Auth trigger successfully created';
END $$;

-- Show existing profiles for verification
SELECT id, email, user_type, created_at FROM profiles;
