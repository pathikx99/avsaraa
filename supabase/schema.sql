-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Supabase Database Schema
-- Focused on: Auth (Profiles), Addresses, Products, Contact Inquiries & Newsletter
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

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 2. USER ADDRESSES (User Account Delivery Locations)
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

DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" 
    ON public.addresses FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" 
    ON public.addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" 
    ON public.addresses FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" 
    ON public.addresses FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. CONTACT INQUIRIES (Customer Messages)
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

DROP POLICY IF EXISTS "Anyone can submit a contact inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit a contact inquiry" 
    ON public.contact_inquiries FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Users can view their own contact inquiries" 
    ON public.contact_inquiries FOR SELECT 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. NEWSLETTER SUBSCRIBERS (Email Updates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Subscribed' CHECK (status IN ('Subscribed', 'Unsubscribed')),
    source TEXT DEFAULT 'Website Footer',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to the newsletter" ON public.newsletter_subscribers;
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
        COALESCE(new.raw_user_meta_data->>'full_name', 'Avsaraa Member'),
        new.email,
        new.phone
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. PRODUCTS (Minimal Schema for Store)
-- Categories from navigation: Sarees, Dresses, New Arrivals, Occasion Wear
-- ONLY signed-in users can add products
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Sarees', 'Dresses', 'New Arrivals', 'Occasion Wear')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

-- ONLY signed-in / authenticated users can add products
DROP POLICY IF EXISTS "Only signed-in users can add products" ON public.products;
CREATE POLICY "Only signed-in users can add products" 
    ON public.products FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own added products
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users can update their own products" 
    ON public.products FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own added products
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Users can delete their own products" 
    ON public.products FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

-- ==============================================================================
-- 6. ADMIN USERS (Platform Administrators, Roles, Permissions & Activity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Admin', 'Product Manager', 'Store Manager', 'Support Lead')),
    department TEXT DEFAULT 'Operations',
    phone_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    permissions TEXT[] DEFAULT ARRAY['users:manage', 'products:manage', 'analytics:view'],
    notes TEXT,
    last_active TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current requester is an active administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
                  AND status = 'Active'
            )
            OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. admin_users policies:
-- Only active admins or the user themselves can view admin user profiles
DROP POLICY IF EXISTS "Public or admin can view admin users" ON public.admin_users;
CREATE POLICY "Admins or self can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin() OR auth.uid() = user_id);

-- Only active admins can create new admin accounts
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
CREATE POLICY "Only admins can insert admin users" 
    ON public.admin_users FOR INSERT 
    WITH CHECK (public.is_admin());

-- Only active admins can update admin user accounts
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
CREATE POLICY "Only admins can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

-- Only active admins can delete admin user accounts
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;
CREATE POLICY "Only admins can delete admin users" 
    ON public.admin_users FOR DELETE 
    USING (public.is_admin());

-- 2. Enhanced products policies:
-- Admins can update any product, or authors can update their own
DROP POLICY IF EXISTS "Admins can manage any product" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users or admins can update products" 
    ON public.products FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin());

-- Admins can delete any product, or authors can delete their own
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Users or admins can delete products" 
    ON public.products FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- 3. Enhanced profiles policies:
-- Admins can delete customer profiles if needed for compliance/abuse
DROP POLICY IF EXISTS "Admins can manage any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" 
    ON public.profiles FOR DELETE 
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);

-- Initial Seed for Default Admin Users
INSERT INTO public.admin_users (full_name, email, role, department, phone_number, status, permissions, notes)
VALUES 
    ('Kratos Lord', 'admin@avsaraa.com', 'Super Admin', 'Executive Leadership', '+91 98765 43210', 'Active', ARRAY['users:manage', 'products:manage', 'orders:manage', 'system:admin'], 'Founding administrator with full system privileges.'),
    ('Aanya Sharma', 'aanya.atelier@avsaraa.com', 'Product Manager', 'Atelier Curation', '+91 98250 11223', 'Active', ARRAY['products:manage', 'inventory:update'], 'Head of Saree & Luxury Drape procurement in Surat.'),
    ('Devendra Rathore', 'devendra@avsaraa.com', 'Store Manager', 'Retail Operations', '+91 99130 44556', 'Active', ARRAY['products:manage', 'users:manage'], 'Oversees dispatch and inventory verification.')
ON CONFLICT (email) DO NOTHING;

-- Initial Seed for Luxury Products Catalog
INSERT INTO public.products (name, category, price, image_url, description)
VALUES
    ('Royal Banarasi Katan Silk Saree', 'Sarees', 24999.00, '/images/banarasi_silk_saree.jpg', 'Authentic handwoven pure Banarasi katan silk saree with antique gold zari kadhwa borders and delicate floral jaal.'),
    ('Emerald Organza Embroidered Saree', 'Sarees', 18450.00, '/images/royal_organza_saree.jpg', 'Weightless sheer organza drape adorned with resham threadwork, scalloped borders, and pearl highlights.'),
    ('Heritage Anarkali Silk Gown', 'Occasion Wear', 28900.00, '/images/royal_occasion_dress.jpg', 'Regal floor-sweeping Kalidar gown tailored in Surat silk with heritage hand-zardozi neckline.'),
    ('Festive Chanderi Foil Print Dress', 'Dresses', 12500.00, '/images/festive_chanderi_dress.jpg', 'Contemporary silhouette crafted from lightweight Chanderi weave featuring artisanal metallic foil accents.'),
    ('Royal Zari Bridal Drape', 'New Arrivals', 34500.00, '/images/saree_model_hero.jpg', 'Exquisite bridal drape with intricate floral motifs and royal pallu, hand-crafted for auspicious moments.')
ON CONFLICT DO NOTHING;


