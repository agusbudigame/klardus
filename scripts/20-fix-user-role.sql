-- Script 20: Fix User Role Issues
-- This script helps fix issues with user roles (customer vs collector)

-- 1. Create a function to check and fix user roles
CREATE OR REPLACE FUNCTION fix_user_role(target_user_id UUID, desired_role TEXT)
RETURNS TEXT AS $$
DECLARE
    current_role TEXT;
    result TEXT;
BEGIN
    -- Get current role
    SELECT user_type INTO current_role FROM profiles WHERE id = target_user_id;
    
    -- Check if user exists
    IF current_role IS NULL THEN
        RETURN 'User not found';
    END IF;
    
    -- Check if role change is needed
    IF current_role = desired_role THEN
        RETURN 'User already has the desired role: ' || current_role;
    END IF;
    
    -- Update the role
    UPDATE profiles SET user_type = desired_role WHERE id = target_user_id;
    
    -- Log the change
    INSERT INTO role_change_logs (user_id, old_role, new_role)
    VALUES (target_user_id, current_role, desired_role);
    
    RETURN 'Role updated from ' || current_role || ' to ' || desired_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create role_change_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_change_logs') THEN
        CREATE TABLE role_change_logs (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            old_role TEXT,
            new_role TEXT,
            changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE role_change_logs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY role_change_logs_select ON role_change_logs
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 3. Create a view to show users with potentially mismatched roles
CREATE OR REPLACE VIEW potential_role_issues AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.user_type,
    p.created_at,
    (SELECT COUNT(*) FROM cardboard_submissions cs WHERE cs.customer_id = p.id) as submission_count,
    (SELECT COUNT(*) FROM cardboard_prices cp WHERE cp.collector_id = p.id) as price_entries
FROM 
    profiles p
WHERE 
    (p.user_type = 'customer' AND 
     (SELECT COUNT(*) FROM cardboard_prices cp WHERE cp.collector_id = p.id) > 0)
    OR
    (p.user_type = 'collector' AND 
     (SELECT COUNT(*) FROM cardboard_submissions cs WHERE cs.customer_id = p.id) > 0);

-- 4. Create a function to automatically detect and suggest role fixes
CREATE OR REPLACE FUNCTION suggest_role_fixes()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    current_role TEXT,
    suggested_role TEXT,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Users marked as customers but with price entries (likely collectors)
    SELECT 
        p.id,
        p.full_name,
        p.user_type,
        'collector'::TEXT,
        'User has ' || COUNT(cp.id) || ' price entries but is marked as customer'
    FROM 
        profiles p
    JOIN 
        cardboard_prices cp ON cp.collector_id = p.id
    WHERE 
        p.user_type = 'customer'
    GROUP BY 
        p.id, p.full_name, p.user_type
    
    UNION ALL
    
    -- Users marked as collectors but with submissions (likely customers)
    SELECT 
        p.id,
        p.full_name,
        p.user_type,
        'customer'::TEXT,
        'User has ' || COUNT(cs.id) || ' submissions but is marked as collector'
    FROM 
        profiles p
    JOIN 
        cardboard_submissions cs ON cs.customer_id = p.id
    WHERE 
        p.user_type = 'collector'
    GROUP BY 
        p.id, p.full_name, p.user_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix the current user's role if needed (assuming they want to be a collector)
DO $$
DECLARE
    current_user_id UUID;
    current_role TEXT;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();
    
    -- Check if the user exists in profiles
    SELECT user_type INTO current_role FROM profiles WHERE id = current_user_id;
    
    -- If user exists and is not a collector, update to collector
    IF current_role IS NOT NULL AND current_role != 'collector' THEN
        PERFORM fix_user_role(current_user_id, 'collector');
        RAISE NOTICE 'Updated your role from % to collector', current_role;
    ELSIF current_role = 'collector' THEN
        RAISE NOTICE 'Your role is already set to collector';
    ELSE
        RAISE NOTICE 'Could not find your user profile';
    END IF;
END
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION fix_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_role_fixes TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'User role fix script completed successfully';
END
$$;
