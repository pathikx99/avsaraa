-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Supabase Database Schema
-- Focused on: Auth (Login/Register), User Account, Contact, and Newsletter
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES (Extends Supabase auth.users for Login & Register)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    membership_tier TEXT DEFAULT 'Standard' CHECK (membership_tier IN ('Standard', 'Privilege', 'Atelier Circle', 'VIP')),
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
    preferred_currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 2. USER ADDRESSES (User Account)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_type TEXT DEFAULT 'Home' CHECK (address_type IN ('Home', 'Work', 'Studio', 'Other')),
    recipient_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'India' NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses" 
    ON public.addresses FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
    ON public.addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
    ON public.addresses FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
    ON public.addresses FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. TAILORING PROFILES & MEASUREMENTS (User Account)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tailoring_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_name TEXT DEFAULT 'Standard Measurement' NOT NULL,
    bust_inches NUMERIC(4,1),
    waist_inches NUMERIC(4,1),
    hips_inches NUMERIC(4,1),
    blouse_length_inches NUMERIC(4,1),
    front_neck_depth_inches NUMERIC(4,1),
    back_neck_depth_inches NUMERIC(4,1),
    sleeve_length_inches NUMERIC(4,1),
    sleeve_circumference_inches NUMERIC(4,1),
    height_feet_inches TEXT,
    shoulder_width_inches NUMERIC(4,1),
    custom_notes TEXT,
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.tailoring_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tailoring profiles" 
    ON public.tailoring_profiles FOR ALL 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. STYLING CONSULTATIONS & ATELIER APPOINTMENTS (User Account / Concierge)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.styling_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    consultation_type TEXT DEFAULT 'Virtual Video Call' CHECK (consultation_type IN ('Virtual Video Call', 'Atelier Visit (Mumbai)', 'WhatsApp Stylist Consultation')),
    preferred_date DATE NOT NULL,
    preferred_time_slot TEXT NOT NULL,
    occasion_type TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Requested' CHECK (status IN ('Requested', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.styling_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own styling consultations" 
    ON public.styling_consultations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit a styling consultation" 
    ON public.styling_consultations FOR INSERT 
    WITH CHECK (true);

-- ==============================================================================
-- 5. CONTACT INQUIRIES (Contact Page / Section)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Unread' CHECK (status IN ('Unread', 'In Progress', 'Resolved', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact inquiry" 
    ON public.contact_inquiries FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can view their own contact inquiries" 
    ON public.contact_inquiries FOR SELECT 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 6. NEWSLETTER SUBSCRIBERS (Stay in the Loop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Subscribed' CHECK (status IN ('Subscribed', 'Unsubscribed')),
    source TEXT DEFAULT 'Website Footer',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to the newsletter" 
    ON public.newsletter_subscribers FOR INSERT 
    WITH CHECK (true);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up via Supabase Auth, automatically insert a row in profiles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone_number)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Avsaraa Patron'),
        new.email,
        new.phone
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_tailoring_user ON public.tailoring_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON public.styling_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.contact_inquiries(email);
