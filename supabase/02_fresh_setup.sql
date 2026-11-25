-- ==============================================================================
-- AVSARAA · WEAR THE MOMENT
-- SCRIPT 2: FRESH DATABASE SETUP & STORAGE INITIALIZATION
-- ==============================================================================
-- Paste and run this script in your Supabase Dashboard -> SQL Editor
-- (after running 01_delete_full_database.sql).
-- It creates:
--   - Storage buckets ('items', 'avatars') with public CDN access
--   - 16 active durable tables: admin_users, profiles, addresses, products,
--     contact_inquiries, newsletter_subscribers, wishlists, product_reviews,
--     coupons, orders, order_items, payments, user_carts, processed_webhooks,
--     back_in_stock_subscriptions, order_edits
--   - Row Level Security (RLS) policies & Super Admin authority model
--   - Atomic stock deduction & restoration RPCs (OTPs & rate limits use Upstash Redis)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 2. SUPABASE STORAGE BUCKETS (FOLDERS FOR USER UPLOADS & ATELIER ASSETS)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'items',
        'items',
        true,
        52428800, -- 50 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    ),
    (
        'avatars',
        'avatars',
        true,
        10485760, -- 10 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Access Policies
DROP POLICY IF EXISTS "Public Storage Read Access" ON storage.objects;
CREATE POLICY "Public Storage Read Access"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id IN ('items', 'avatars'));

DROP POLICY IF EXISTS "Service and User Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated and Service Upload" ON storage.objects;
CREATE POLICY "Service and User Avatar Upload"
    ON storage.objects FOR INSERT
    TO authenticated, service_role
    WITH CHECK (
        (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR (auth.role() = 'service_role')
    );

DROP POLICY IF EXISTS "Service and User Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated and Service Update" ON storage.objects;
CREATE POLICY "Service and User Avatar Update"
    ON storage.objects FOR UPDATE
    TO authenticated, service_role
    USING (
        (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR (auth.role() = 'service_role')
    );

DROP POLICY IF EXISTS "Service and User Avatar Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated and Service Delete" ON storage.objects;
CREATE POLICY "Service and User Avatar Delete"
    ON storage.objects FOR DELETE
    TO authenticated, service_role
    USING (
        (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR (auth.role() = 'service_role')
    );

-- ------------------------------------------------------------------------------
-- 3. SUPER ADMIN USERS (Single Master Authority Model)
-- ------------------------------------------------------------------------------
CREATE TABLE public.admin_users (
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
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE POLICY "Super admin can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin());

CREATE POLICY "Super admin can insert admin users" 
    ON public.admin_users FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Super admin can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. USER PROFILES (Patrons, CRM Accounts & Concierge Notes)
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMPTZ,
    email TEXT UNIQUE,
    avatar_url TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    membership_tier TEXT DEFAULT 'Standard' CHECK (membership_tier IN ('Standard', 'Privilege', 'Atelier Circle', 'VIP')),
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
    preferred_currency TEXT DEFAULT 'INR',
    concierge_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_profiles_phone_number_unique 
    ON public.profiles (phone_number) 
    WHERE phone_number IS NOT NULL AND phone_number <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_phone_verification 
    ON public.profiles (phone_number, phone_verified);

CREATE POLICY "Users can view their own profile or admin can view all" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Super admin can delete profiles" 
    ON public.profiles FOR DELETE 
    USING (public.is_admin());

-- Automatic Profile Creation Trigger on Auth Sign-Up
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

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT := COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), auth.role(), '');
BEGIN
    IF caller_role IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
        IF TG_OP = 'INSERT' THEN
            NEW.membership_tier := 'Standard';
            NEW.reward_points := 100;
            NEW.status := 'Active';
            NEW.phone_verified := false;
            NEW.phone_verified_at := NULL;
        ELSIF TG_OP = 'UPDATE' THEN
            NEW.membership_tier := OLD.membership_tier;
            NEW.reward_points := OLD.reward_points;
            NEW.status := OLD.status;
            NEW.phone_verified := OLD.phone_verified;
            NEW.phone_verified_at := OLD.phone_verified_at;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER protect_profile_fields_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

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

-- ------------------------------------------------------------------------------
-- 5. USER ADDRESSES (Delivery Locations)
-- ------------------------------------------------------------------------------
CREATE TABLE public.addresses (
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
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own addresses" 
    ON public.addresses FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own addresses" 
    ON public.addresses FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own addresses" 
    ON public.addresses FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. PRODUCTS (Luxury Catalog · Cloudflare Images / R2 CDN Compatible)
-- ------------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Sarees', 'Dresses', 'Co-ords', 'Men''s Wear', 'New Arrivals', 'Occasion Wear')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    mrp NUMERIC(10, 2),
    discount_percent INTEGER DEFAULT 0,
    image_url TEXT NOT NULL, -- Public Cloudflare R2 URL or Cloudflare Images URL
    gallery_images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    fabric TEXT,
    weave TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    occasion_tags TEXT[] DEFAULT '{}',
    color_variants JSONB DEFAULT '[]'::jsonb,
    available_sizes TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', 'Free Size'],
    stock_count INTEGER DEFAULT 10 CHECK (stock_count >= 0),
    sales_count INTEGER DEFAULT 0,
    product_type TEXT DEFAULT 'standalone' CHECK (product_type IN ('standalone', 'top', 'bottom', 'set')),
    specifications JSONB DEFAULT '{}'::jsonb,
    video_url TEXT,
    highlights TEXT[] DEFAULT '{}',
    back_in_stock_notify BOOLEAN DEFAULT false,
    pre_order BOOLEAN DEFAULT false,
    pre_order_available_at TIMESTAMPTZ,
    pre_order_deposit_percent INTEGER DEFAULT 100 CHECK (pre_order_deposit_percent >= 0 AND pre_order_deposit_percent <= 100),
    size_guide_url TEXT,
    fit_notes TEXT,
    publish_status TEXT DEFAULT 'published' CHECK (publish_status IN ('draft', 'scheduled', 'published', 'archived')),
    scheduled_publish_at TIMESTAMPTZ,
    low_stock_threshold INTEGER DEFAULT 5 CHECK (low_stock_threshold >= 0),
    shipping_weight_grams INTEGER,
    international_shippable BOOLEAN DEFAULT false,
    country_of_origin TEXT DEFAULT 'India',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

CREATE POLICY "Only super admin can add products" 
    ON public.products FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Only super admin can update products" 
    ON public.products FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Only super admin can delete products" 
    ON public.products FOR DELETE 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. CONTACT & CONCIERGE INQUIRIES
-- ------------------------------------------------------------------------------
CREATE TABLE public.contact_inquiries (
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
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Super admin can update contact inquiries" 
    ON public.contact_inquiries FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Super admin can delete contact inquiries" 
    ON public.contact_inquiries FOR DELETE 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. NEWSLETTER SUBSCRIBERS
-- ------------------------------------------------------------------------------
CREATE TABLE public.newsletter_subscribers (
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

CREATE POLICY "Super admin can view subscribers" 
    ON public.newsletter_subscribers FOR SELECT 
    USING (public.is_admin());

CREATE POLICY "Super admin can delete subscribers" 
    ON public.newsletter_subscribers FOR DELETE 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. WISHLISTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_data JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist" 
    ON public.wishlists FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own wishlist" 
    ON public.wishlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own wishlist" 
    ON public.wishlists FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. PRODUCT REVIEWS & TESTIMONIALS
-- ------------------------------------------------------------------------------
CREATE TABLE public.product_reviews (
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

CREATE POLICY "Anyone can view published reviews" 
    ON public.product_reviews FOR SELECT 
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Anyone can submit a review" 
    ON public.product_reviews FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Super admin can update reviews" 
    ON public.product_reviews FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Super admin can delete reviews" 
    ON public.product_reviews FOR DELETE 
    USING (public.is_admin());

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

CREATE OR REPLACE TRIGGER protect_review_fields_trigger
    BEFORE INSERT ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION public.protect_review_fields();

-- ------------------------------------------------------------------------------
-- 11. COUPONS & PROMOTIONAL OFFERS
-- ------------------------------------------------------------------------------
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value >= 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0 NOT NULL,
    valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    valid_until TIMESTAMPTZ,
    per_user_limit INTEGER DEFAULT 1 CHECK (per_user_limit > 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coupons are viewable by everyone" 
    ON public.coupons FOR SELECT 
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Super admin can insert coupons" 
    ON public.coupons FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Super admin can update coupons" 
    ON public.coupons FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Super admin can delete coupons" 
    ON public.coupons FOR DELETE 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 12. ORDERS, ORDER ITEMS & PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.orders (
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

CREATE POLICY "Users can view their own orders or admin can view all" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Super admin can insert orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Super admin can update any order" 
    ON public.orders FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Super admin can delete orders" 
    ON public.orders FOR DELETE 
    USING (public.is_admin());

CREATE TABLE public.order_items (
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

CREATE POLICY "Users can view their own order items or admin can view all" 
    ON public.order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Super admin can manage order items" 
    ON public.order_items FOR ALL 
    USING (public.is_admin());

CREATE TABLE public.payments (
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

CREATE POLICY "Users can view their order payments or admin can view all" 
    ON public.payments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = payments.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Super admin can manage payments" 
    ON public.payments FOR ALL 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. USER CARTS & WEBHOOK DEDUPLICATION
-- ------------------------------------------------------------------------------
CREATE TABLE public.user_carts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart" 
    ON public.user_carts FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE TABLE public.processed_webhooks (
    webhook_id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role and admin can manage webhooks" 
    ON public.processed_webhooks FOR ALL 
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 14. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_category_created ON public.products(category, created_at DESC);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_stock_count ON public.products(stock_count);
CREATE INDEX idx_products_occasion_tags ON public.products USING GIN (occasion_tags);
CREATE INDEX idx_products_available_sizes ON public.products USING GIN (available_sizes);
CREATE INDEX idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_reviews_status ON public.product_reviews(status);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_processed_webhooks_processed_at ON public.processed_webhooks(processed_at DESC);

-- ------------------------------------------------------------------------------
-- 15. BACK-IN-STOCK SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.back_in_stock_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    variant_name TEXT,
    size TEXT,
    notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe to back-in-stock" ON public.back_in_stock_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own subscriptions" ON public.back_in_stock_subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Super admin manages subscriptions" ON public.back_in_stock_subscriptions FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 16. ORDER EXTENSIONS: gift wrap, gift message, exchange tracking
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gift_wrap BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_wrap_fee_cents INTEGER DEFAULT 0 CHECK (gift_wrap_fee_cents >= 0),
  ADD COLUMN IF NOT EXISTS gift_message TEXT,
  ADD COLUMN IF NOT EXISTS shipping_zone TEXT DEFAULT 'gujarat' CHECK (shipping_zone IN ('gujarat', 'india', 'international')),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS exchange_source_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exchange_replacement_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 17. ORDER CANCELLATION & EDITING AUDIT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    edit_type TEXT NOT NULL CHECK (edit_type IN ('cancel', 'address_change', 'item_add', 'item_remove', 'quantity_change', 'note_change')),
    before_snapshot JSONB DEFAULT '{}'::jsonb,
    after_snapshot JSONB DEFAULT '{}'::jsonb,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.order_edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order edits viewable by owner or admin" ON public.order_edits FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_edits.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Super admin manages order edits" ON public.order_edits FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 18. INVENTORY RESTORE RPC (used when cancelling orders)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_stock(
    p_id UUID,
    p_qty INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.products
    SET stock_count = stock_count + p_qty
    WHERE id = p_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 29. ATOMIC STOCK DEDUCTION RPC (prevents overselling under concurrency)
-- Uses FOR UPDATE row locking to ensure serializable stock deduction.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_stock_atomic(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    -- Lock the product row for the duration of this transaction
    SELECT stock_count INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN FALSE;
    END IF;

    UPDATE public.products
    SET stock_count = stock_count - p_quantity
    WHERE id = p_product_id;

    RETURN TRUE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 30. GUEST CHECKOUT PATRON SEED (satisfies FK constraints for guest orders)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '7a3b2e24-820f-4706-8cc3-4218b42b0da3',
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'guest@avsaraa.in',
            '',
            TIMEZONE('utc', NOW()),
            '{"provider":"system","providers":["system"]}'::jsonb,
            '{"full_name":"Guest Checkout Patron"}'::jsonb,
            TIMEZONE('utc', NOW()),
            TIMEZONE('utc', NOW())
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '7a3b2e24-820f-4706-8cc3-4218b42b0da3') THEN
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
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 31. POSTGRES TABLE & SEQUENCE PRIVILEGES (ESSENTIAL FOR POSTGREST & RLS)
-- ------------------------------------------------------------------------------
-- Grants table and sequence access to Supabase system roles so RLS policies
-- are evaluated properly instead of failing with PostgreSQL 42501 (permission denied).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Restrict sensitive SECURITY DEFINER RPCs strictly to server service_role
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT, UUID) TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;
