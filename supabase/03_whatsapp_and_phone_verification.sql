-- ==============================================================================
-- 03. WHATSAPP & PHONE VERIFICATION MIGRATION
-- Adds explicit verification flags to patron profiles for dual-contact orders.
-- ==============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Fast index for phone verification and authentication lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verification 
ON public.profiles(phone_number, phone_verified);

-- Deduplication index for single-use proof token replay prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_codes_proof_hash 
ON public.otp_codes(otp_hash) 
WHERE channel = 'proof_token';

-- Security Hardening: Revoke public anon read/write from sensitive OTP and rate limiting tables
DROP POLICY IF EXISTS "Anyone can insert OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can view own OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can insert rate limit counters" ON public.rate_limit_counters;
DROP POLICY IF EXISTS "Anyone can view rate limit counters" ON public.rate_limit_counters;

-- Ensure wishlists table supports cached product_data snapshot
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS product_data JSONB;

-- Seed guest patron profile to satisfy foreign key constraints for guest orders
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    status,
    membership_tier,
    reward_points
) VALUES (
    '7a3b2e24-820f-4706-8cc3-4218b42b0da3',
    'Guest Checkout Patron',
    'guest@avsaraa.in',
    'Active',
    'Standard',
    0
) ON CONFLICT (id) DO NOTHING;
