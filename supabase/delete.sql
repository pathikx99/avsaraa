-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Database Clear & Reset Script
-- File: supabase/delete.sql
-- ==============================================================================
-- This script provides two clear reset modes:
--
-- MODE 1: TRUNCATE ALL DATA (Preserves schema, tables, triggers, and RLS policies)
--         Use this when you want to wipe all records and start fresh with empty tables.
--
-- MODE 2: DROP ALL TABLES & FUNCTIONS (Full Clean-Slate Tear-Down)
--         Use this when you want to completely destroy all tables, functions,
--         and policies before re-running schema.sql.
-- ==============================================================================

-- ==============================================================================
-- MODE 1: WIPE ALL DATA (TRUNCATE)
-- Uncomment the block below if you only want to empty tables without dropping schema.
-- ==============================================================================
/*
BEGIN;

-- Disable triggers temporarily to avoid foreign key or cascade check conflicts
SET session_replication_role = 'replica';

-- Truncate all application tables in dependency order
TRUNCATE TABLE 
    public.newsletter_subscribers,
    public.contact_inquiries,
    public.addresses,
    public.products,
    public.admin_users,
    public.profiles
RESTART IDENTITY CASCADE;

-- Re-enable normal trigger execution
SET session_replication_role = 'origin';

COMMIT;
*/


-- ==============================================================================
-- MODE 2: COMPLETE TEAR-DOWN (DROP EVERYTHING)
-- Runs by default: cleanly removes all tables, functions, triggers, and policies.
-- After running this, execute `schema.sql` to re-create the pristine structure.
-- ==============================================================================

BEGIN;

-- 1. Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS set_admin_users_updated_at ON public.admin_users;

-- 2. Drop Tables (in reverse dependency order with CASCADE)
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.contact_inquiries CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Drop Helper Functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.check_phone_exists(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_email_exists(TEXT, UUID) CASCADE;

COMMIT;

-- Verification query (should return 0 rows for public tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
