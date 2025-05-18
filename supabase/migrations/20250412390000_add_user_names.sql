/*
  # Add User Names

  1. Changes
    - Add name field to user metadata
    - Create function to check for duplicate names
    - Add validation for name format
*/

-- Create function to check for duplicate names
CREATE OR REPLACE FUNCTION check_duplicate_name(name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    name_exists boolean;
BEGIN
    -- Check if name exists in any user's metadata
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE raw_user_meta_data->>'full_name' = name
    ) INTO name_exists;
    
    RETURN name_exists;
END;
$$;

-- Create function to validate name format
CREATE OR REPLACE FUNCTION validate_name(name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if name is null or empty
    IF name IS NULL OR trim(name) = '' THEN
        RETURN false;
    END IF;
    
    -- Check if name is too long (max 50 characters)
    IF length(trim(name)) > 50 THEN
        RETURN false;
    END IF;
    
    -- Check if name contains only letters, spaces, and basic punctuation
    IF NOT name ~ E'^[a-zA-Z\\s\\-\\.\\\']+$' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Create function to set user name
CREATE OR REPLACE FUNCTION set_user_name(user_id uuid, name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Validate name format
    IF NOT validate_name(name) THEN
        RAISE EXCEPTION 'Invalid name format';
    END IF;
    
    -- Check for duplicate name
    IF check_duplicate_name(name) THEN
        RAISE EXCEPTION 'Name already taken';
    END IF;
    
    -- Update user metadata with name
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('full_name', name)
            ELSE 
                raw_user_meta_data || jsonb_build_object('full_name', name)
        END
    WHERE id = user_id;
END;
$$; 