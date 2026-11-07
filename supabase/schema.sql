-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Supabase Database Schema
-- Focused on: Auth, Profiles, Super Admin, Addresses, Products, Inquiries & Newsletter
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SUPER ADMIN (Sole Master Administrator - Single Authority Model)
-- Must be created first so is_admin() is available for subsequent RLS policies
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Super Admin' CHECK (role = 'Super Admin'),
    department TEXT DEFAULT 'Executive Leadership',
    phone_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    permissions TEXT[] DEFAULT ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'],
    notes TEXT,
    last_active TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current requester is the active Super Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
                  AND status = 'Active'
                  AND role = 'Super Admin'
            )
            OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
            OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
            OR LOWER(auth.jwt()->>'email') = 'admin@avsaraa.com'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Admin users RLS policies
DROP POLICY IF EXISTS "Public or admin can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins or self can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can view admin users" ON public.admin_users;
CREATE POLICY "Super admin can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can insert admin users" ON public.admin_users;
CREATE POLICY "Super admin can insert admin users" 
    ON public.admin_users FOR INSERT 
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can update admin users" ON public.admin_users;
CREATE POLICY "Super admin can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can delete admin users" ON public.admin_users;

-- ==============================================================================
-- ==============================================================================
-- 2. PROFILES (Extends Supabase auth.users for Login & Register)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    membership_tier TEXT DEFAULT 'Standard' CHECK (membership_tier IN ('Standard', 'Privilege', 'Atelier Circle', 'VIP')),
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
    preferred_currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Partial unique index to enforce that no two accounts can share a phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_number_unique 
ON public.profiles (phone_number) 
WHERE phone_number IS NOT NULL AND phone_number <> '';

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or admin can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or admin can view all" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles" 
    ON public.profiles FOR DELETE 
    USING (public.is_admin());

-- AUTOMATIC PROFILE CREATION TRIGGER (Handles Email & Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_name TEXT;
    extracted_phone TEXT;
    extracted_avatar TEXT;
BEGIN
    extracted_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        NULLIF(CONCAT_WS(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name'), ''),
        SPLIT_PART(new.email, '@', 1),
        'Avsaraa Member'
    );

    extracted_phone := NULLIF(TRIM(COALESCE(
        new.phone,
        new.raw_user_meta_data->>'phone_number',
        new.raw_user_meta_data->>'phone'
    )), '');

    extracted_avatar := COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
    );

    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        phone_number, 
        avatar_url,
        status,
        membership_tier,
        reward_points,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        extracted_name,
        new.email,
        extracted_phone,
        extracted_avatar,
        'Active',
        'Standard',
        100,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = CASE 
            WHEN public.profiles.full_name = 'Avsaraa Member' OR public.profiles.full_name IS NULL 
            THEN EXCLUDED.full_name 
            ELSE public.profiles.full_name 
        END,
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        phone_number = COALESCE(public.profiles.phone_number, EXCLUDED.phone_number),
        updated_at = NOW();

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security Guard: Prevent non-admin users from escalating membership_tier, reward_points, or status
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        NEW.membership_tier := OLD.membership_tier;
        NEW.reward_points := OLD.reward_points;
        NEW.status := OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_fields_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Helper function to check if a phone number already exists
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_to_check TEXT, current_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF phone_to_check IS NULL OR TRIM(phone_to_check) = '' THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE phone_number = TRIM(phone_to_check)
          AND (current_user_id IS NULL OR id != current_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Helper function to check if an email already exists
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT, current_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF email_to_check IS NULL OR TRIM(email_to_check) = '' THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(email) = LOWER(TRIM(email_to_check))
          AND (current_user_id IS NULL OR id != current_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. USER ADDRESSES (User Account Delivery Locations)
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
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" 
    ON public.addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" 
    ON public.addresses FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" 
    ON public.addresses FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 4. PRODUCTS (Luxury Catalog & Inventory)
-- Categories: Sarees, Dresses, New Arrivals, Occasion Wear
-- ONLY the Super Admin can insert, update, or delete products.
-- Customers & public have read-only viewing access.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Sarees', 'Dresses', 'Co-ords', 'Men''s Wear', 'New Arrivals', 'Occasion Wear')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    occasion_tags TEXT[] DEFAULT '{}',
    color_variants JSONB DEFAULT '[]',
    sales_count INTEGER DEFAULT 0,
    product_type TEXT DEFAULT 'standalone' CHECK (product_type IN ('standalone', 'top', 'bottom', 'set')),
    gallery_images JSONB DEFAULT '[]'::jsonb,
    available_sizes TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', 'Free Size'],
    specifications JSONB DEFAULT '{}'::jsonb,
    stock_count INTEGER DEFAULT 10 CHECK (stock_count >= 0),
    mrp NUMERIC(10, 2),
    discount_percent INTEGER DEFAULT 0,
    video_url TEXT,
    highlights TEXT[] DEFAULT '{}'
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

-- ONLY Super Admin can add products
DROP POLICY IF EXISTS "Only signed-in users can add products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can add products" ON public.products;
CREATE POLICY "Only super admin can add products" 
    ON public.products FOR INSERT 
    WITH CHECK (public.is_admin());

-- ONLY Super Admin can update products
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users or admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can update products" ON public.products;
CREATE POLICY "Only super admin can update products" 
    ON public.products FOR UPDATE 
    USING (public.is_admin());

-- ONLY Super Admin can delete products
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users or admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can delete products" ON public.products;
CREATE POLICY "Only super admin can delete products" 
    ON public.products FOR DELETE 
    USING (public.is_admin());

-- ==============================================================================
-- 5. CONTACT INQUIRIES (Customer Messages)
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
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Super admin can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Super admin can update contact inquiries" 
    ON public.contact_inquiries FOR UPDATE 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Super admin can delete contact inquiries" 
    ON public.contact_inquiries FOR DELETE 
    USING (public.is_admin());

-- ==============================================================================
-- 6. NEWSLETTER SUBSCRIBERS (Email Updates)
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

DROP POLICY IF EXISTS "Super admin can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admin can view subscribers" 
    ON public.newsletter_subscribers FOR SELECT 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admin can delete subscribers" 
    ON public.newsletter_subscribers FOR DELETE 
    USING (public.is_admin());

-- ==============================================================================
-- 7. WISHLISTS (Authenticated Patron Saved Heirlooms)
-- Users can save heirlooms to their persistent account wishlist.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_data JSONB, -- cached product snapshot for instant loading
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;
CREATE POLICY "Users can view their own wishlist" 
    ON public.wishlists FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own wishlist" ON public.wishlists;
CREATE POLICY "Users can insert their own wishlist" 
    ON public.wishlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own wishlist" ON public.wishlists;
CREATE POLICY "Users can delete their own wishlist" 
    ON public.wishlists FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 8. PRODUCT REVIEWS & TESTIMONIALS (With Customer Photos)
-- Real patron reviews including photo media.
-- Reviews can be managed, moderated, and DELETED by Super Admin.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    product_name TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_city TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published reviews
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view published reviews" 
    ON public.product_reviews FOR SELECT 
    USING (status = 'published' OR public.is_admin());

-- Customers or patrons can submit reviews
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.product_reviews;
CREATE POLICY "Anyone can submit a review" 
    ON public.product_reviews FOR INSERT 
    WITH CHECK (true);

-- Super admin can update review status (e.g. approve, verify, flag)
DROP POLICY IF EXISTS "Super admin can update reviews" ON public.product_reviews;
CREATE POLICY "Super admin can update reviews" 
    ON public.product_reviews FOR UPDATE 
    USING (public.is_admin());

-- Super admin can DELETE reviews
DROP POLICY IF EXISTS "Super admin can delete reviews" ON public.product_reviews;
CREATE POLICY "Super admin can delete reviews" 
    ON public.product_reviews FOR DELETE 
    USING (public.is_admin());

-- Security Guard: Enforce that public review submissions cannot falsify verified_purchase badge
CREATE OR REPLACE FUNCTION public.protect_review_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        NEW.verified_purchase := false;
        NEW.helpful_count := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS protect_review_fields_trigger ON public.product_reviews;
CREATE TRIGGER protect_review_fields_trigger
    BEFORE INSERT ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION public.protect_review_fields();

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_occasion_tags ON public.products USING GIN (occasion_tags);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON public.products (sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products (product_type);
CREATE INDEX IF NOT EXISTS idx_products_stock_count ON public.products(stock_count);
CREATE INDEX IF NOT EXISTS idx_products_available_sizes ON public.products USING GIN (available_sizes);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.product_reviews(created_at DESC);


-- ==============================================================================
-- 9. SUPABASE STORAGE: 'items' BUCKET & ACCESS POLICIES
-- ==============================================================================
-- 1. Create or ensure 'items' storage bucket exists with public access enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'items',
    'items',
    true,
    52428800, -- 50 MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies if re-running script to avoid duplicate errors
DROP POLICY IF EXISTS "Public Items Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload to Items" ON storage.objects;
DROP POLICY IF EXISTS "Allow Service and Authenticated Upload to Items" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Overwrite on Items" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Delete on Items" ON storage.objects;

-- 3. Policy: Allow public read access to all files inside 'items' bucket
CREATE POLICY "Public Items Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'items');

-- 4. Policy: Allow authenticated users, anon (for seeding/uploads), and service role to upload
CREATE POLICY "Allow Service and Authenticated Upload to Items"
ON storage.objects FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'items');

-- 5. Policy: Allow update/overwrite on items bucket
CREATE POLICY "Allow Upload Overwrite on Items"
ON storage.objects FOR UPDATE
TO authenticated, anon, service_role
USING (bucket_id = 'items');

-- 6. Policy: Allow deletion on items bucket
CREATE POLICY "Allow Authenticated Delete on Items"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'items');



-- ==============================================================================
-- 10. ORDERS, ORDER ITEMS, COUPONS & PAYMENTS (Phase 1: Transactional Core)
-- ==============================================================================

-- 10.1 COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0 NOT NULL,
    valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Active coupons are viewable by everyone"
    ON public.coupons FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Super admin can insert coupons" ON public.coupons;
CREATE POLICY "Super admin can insert coupons"
    ON public.coupons FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Super admin can update coupons" ON public.coupons;
CREATE POLICY "Super admin can update coupons"
    ON public.coupons FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete coupons" ON public.coupons;
CREATE POLICY "Super admin can delete coupons"
    ON public.coupons FOR DELETE
    USING (public.is_admin());

-- Seed promotional coupon 'AVSARAA10'
INSERT INTO public.coupons (
    code,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    is_active
)
VALUES (
    'AVSARAA10',
    'percentage',
    10.00,
    0,
    10000.00,
    true
)
ON CONFLICT (code) DO UPDATE SET
    is_active = true,
    discount_value = 10.00;

-- 10.2 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    shipping_address_snapshot JSONB NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    coupon_code TEXT,
    order_status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (
        order_status IN (
            'Pending',
            'Confirmed',
            'Processing',
            'Dispatched',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Exchange Requested',
            'Exchanged'
        )
    ),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (
        payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')
    ),
    payment_method TEXT NOT NULL CHECK (
        payment_method IN ('Online Card / UPI', 'Razorpay', 'Cashfree', 'COD')
    ),
    notes TEXT,
    tracking_number TEXT,
    courier_partner TEXT,
    estimated_delivery TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders or admin can view all" ON public.orders;
CREATE POLICY "Users can view their own orders or admin can view all"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can place their own orders" ON public.orders;
CREATE POLICY "Users can place their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Super admin can update any order" ON public.orders;
CREATE POLICY "Super admin can update any order"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete orders" ON public.orders;
CREATE POLICY "Super admin can delete orders"
    ON public.orders FOR DELETE
    USING (public.is_admin());

-- 10.3 ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    size TEXT,
    color TEXT,
    tailored_blouse BOOLEAN DEFAULT false,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own order items or admin can view all" ON public.order_items;
CREATE POLICY "Users can view their own order items or admin can view all"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
CREATE POLICY "Users can insert their own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Super admin can manage order items" ON public.order_items;
CREATE POLICY "Super admin can manage order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

-- 10.4 PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their order payments or admin can view all" ON public.payments;
CREATE POLICY "Users can view their order payments or admin can view all"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = payments.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Users can record payments for their orders" ON public.payments;
CREATE POLICY "Users can record payments for their orders"
    ON public.payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = payments.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Super admin can update payments" ON public.payments;
CREATE POLICY "Super admin can update payments"
    ON public.payments FOR UPDATE
    USING (public.is_admin());

-- 10.5 INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ==============================================================================
-- 11. USER CARTS, WEBHOOK DEDUPLICATION, INVENTORY LOCKING & CLEANUP
-- ==============================================================================

-- 11.1 USER CARTS (Server-side Cart Persistence)
CREATE TABLE IF NOT EXISTS public.user_carts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON public.user_carts;
CREATE POLICY "Users can manage their own cart"
    ON public.user_carts FOR ALL
    USING (auth.uid() = user_id OR public.is_admin());

-- 11.2 WEBHOOK DEDUPLICATION (Handles Code 23505 Unique Constraint Violations)
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
    webhook_id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and admin can manage webhooks" ON public.processed_webhooks;
CREATE POLICY "Service role and admin can manage webhooks"
    ON public.processed_webhooks FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at ON public.processed_webhooks(processed_at DESC);

-- 11.3 ATOMIC CHECKOUT RPC (Inventory Row Locks & Deadlock Prevention)
CREATE OR REPLACE FUNCTION public.create_checkout_order(
    p_user_id UUID,
    p_order_number TEXT,
    p_shipping_address_id UUID,
    p_shipping_address_snapshot JSONB,
    p_items JSONB,
    p_subtotal NUMERIC,
    p_discount_amount NUMERIC,
    p_shipping_fee NUMERIC,
    p_total_amount NUMERIC,
    p_coupon_code TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'Online Card / UPI',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_product_id UUID;
    v_qty INTEGER;
    v_current_stock INTEGER;
    v_product_name TEXT;
    v_unit_price NUMERIC;
    v_total_price NUMERIC;
    v_image_url TEXT;
    v_size TEXT;
    v_color TEXT;
BEGIN
    -- 1. Inventory Locking & Concurrency Guard:
    -- Deterministic sorting (ORDER BY product_id ASC) eliminates PostgreSQL deadlocks.
    -- SELECT ... FOR UPDATE acquires row-level locks on stock items.
    FOR v_item IN
        SELECT 
            (elem->>'product_id')::uuid AS p_id,
            COALESCE((elem->>'quantity')::integer, 1) AS p_qty,
            elem->>'product_name' AS p_name,
            COALESCE((elem->>'unit_price')::numeric, 0) AS p_unit_price,
            elem->>'image_url' AS p_image_url,
            COALESCE(elem->>'size', 'Standard Size') AS p_size,
            COALESCE(elem->>'color', 'Default') AS p_color
        FROM jsonb_array_elements(p_items) AS elem
        WHERE elem->>'product_id' IS NOT NULL
        ORDER BY (elem->>'product_id')::uuid ASC
    LOOP
        -- Lock product row and verify stock
        SELECT stock_count, name INTO v_current_stock, v_product_name
        FROM public.products
        WHERE id = v_item.p_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % does not exist in catalog', v_item.p_id;
        END IF;

        IF v_current_stock < v_item.p_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product "%": requested %, available %',
                v_product_name, v_item.p_qty, v_current_stock;
        END IF;

        -- Decrement stock atomically
        UPDATE public.products
        SET stock_count = stock_count - v_item.p_qty
        WHERE id = v_item.p_id;
    END LOOP;

    -- 2. Insert Order Record
    INSERT INTO public.orders (
        user_id,
        shipping_address_id,
        shipping_address_snapshot,
        order_number,
        subtotal,
        discount_amount,
        shipping_fee,
        total_amount,
        coupon_code,
        order_status,
        payment_status,
        payment_method,
        notes
    ) VALUES (
        p_user_id,
        p_shipping_address_id,
        p_shipping_address_snapshot,
        p_order_number,
        p_subtotal,
        p_discount_amount,
        p_shipping_fee,
        p_total_amount,
        p_coupon_code,
        'Confirmed',
        CASE WHEN p_payment_method = 'COD' THEN 'Pending' ELSE 'Paid' END,
        p_payment_method,
        p_notes
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items
    FOR v_item IN
        SELECT 
            (elem->>'product_id')::uuid AS p_id,
            COALESCE((elem->>'quantity')::integer, 1) AS p_qty,
            elem->>'product_name' AS p_name,
            COALESCE((elem->>'unit_price')::numeric, 0) AS p_unit_price,
            elem->>'image_url' AS p_image_url,
            COALESCE(elem->>'size', 'Standard Size') AS p_size,
            COALESCE(elem->>'color', 'Default') AS p_color,
            COALESCE((elem->>'tailored_blouse')::boolean, false) AS p_tailored
        FROM jsonb_array_elements(p_items) AS elem
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            image_url,
            size,
            color,
            tailored_blouse,
            unit_price,
            quantity,
            total_price
        ) VALUES (
            v_order_id,
            v_item.p_id,
            v_item.p_name,
            COALESCE(v_item.p_image_url, '/images/placeholder.jpg'),
            v_item.p_size,
            v_item.p_color,
            v_item.p_tailored,
            v_item.p_unit_price,
            v_item.p_qty,
            v_item.p_unit_price * v_item.p_qty
        );
    END LOOP;

    -- 4. Increment Coupon Redemption Count
    IF p_coupon_code IS NOT NULL THEN
        UPDATE public.coupons
        SET used_count = used_count + 1
        WHERE ilike(code, p_coupon_code);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', p_order_number
    );
END;
$$;

-- 11.4 INVENTORY RESTORATION CRON LOGIC (Releases stock from unpaid orders older than 30 mins)
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_restored_count INTEGER := 0;
BEGIN
    FOR v_order IN
        SELECT id, order_number
        FROM public.orders
        WHERE payment_status = 'Pending'
          AND order_status = 'Pending'
          AND created_at < (TIMEZONE('utc', NOW()) - INTERVAL '30 minutes')
        FOR UPDATE
    LOOP
        -- Restore inventory for each item
        FOR v_item IN
            SELECT product_id, quantity
            FROM public.order_items
            WHERE order_id = v_order.id
              AND product_id IS NOT NULL
        LOOP
            UPDATE public.products
            SET stock_count = stock_count + v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;

        -- Transition order status to Cancelled
        UPDATE public.orders
        SET order_status = 'Cancelled',
            notes = COALESCE(notes || ' | ', '') || 'Auto-cancelled due to payment timeout (30m expired). Inventory released.',
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_order.id;

        v_restored_count := v_restored_count + 1;
    END LOOP;

    RETURN v_restored_count;
END;
$$;

