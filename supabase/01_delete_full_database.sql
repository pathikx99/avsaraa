-- ==============================================================================
-- AVSARAA · WEAR THE MOMENT
-- SCRIPT 1: WIPE & DELETE ENTIRE DATABASE (START FROM SCRATCH)
-- ==============================================================================
-- Paste and run this script in your Supabase Dashboard -> SQL Editor.
-- It safely removes:
--   - All auth triggers on auth.users
--   - All public tables, views, sequences, types, and functions
--   - All storage objects and custom storage buckets (items, avatars, etc.)
-- ==============================================================================

-- 1. Remove Auth Triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the entire public schema and all associated tables, views, types, sequences, and functions
DROP SCHEMA IF EXISTS public CASCADE;

-- 3. Recreate a clean public schema
CREATE SCHEMA public;

-- 4. Restore default permissions on the public schema for Supabase standard roles
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 4b. Ensure all future tables, sequences, and routines inherit full permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 5. Clean up custom storage buckets and objects (leaves internal storage schema intact)
DO $$
BEGIN
    -- Delete storage objects in custom buckets if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DELETE FROM storage.objects WHERE bucket_id IN ('items', 'avatars', 'products', 'reviews');
    END IF;

    -- Delete custom storage buckets if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        DELETE FROM storage.buckets WHERE id IN ('items', 'avatars', 'products', 'reviews');
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore storage cleanup errors if storage extension is not yet initialized
    NULL;
END $$;
