-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function for handling new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_type TEXT;
BEGIN
  -- Extract name and user_type from raw_user_meta_data
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');

  -- Insert into profiles table
  INSERT INTO profiles (id, email, name, user_type, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_name, 
    user_type,
    NOW(),
    NOW()
  );
  
  -- Create default user settings
  INSERT INTO user_settings (user_id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
