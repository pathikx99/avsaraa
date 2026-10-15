-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Supabase Database Schema & Architecture
-- Luxury Ethnic & Western Fashion E-Commerce Platform
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES (Extends Supabase auth.users)
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

-- ==============================================================================
-- 2. USER ADDRESSES (Shipping & Billing)
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
-- 3. ATELIER TAILORING PROFILES (Custom Sizing & Measurements)
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
-- 4. CATEGORIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by everyone" 
    ON public.categories FOR SELECT 
    USING (true);

-- ==============================================================================
-- 5. PRODUCTS (Sarees, Coordinates, Dresses, Dupattas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    fabric TEXT,
    craft_technique TEXT,
    care_instructions TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    compare_at_price NUMERIC(10,2),
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" 
    ON public.products FOR SELECT 
    USING (is_available = true);

-- ==============================================================================
-- 6. PRODUCT VARIANTS (Sizes, Colors, Stock)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    color_name TEXT,
    color_hex TEXT,
    size TEXT CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Custom Made')),
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    price_override NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone" 
    ON public.product_variants FOR SELECT 
    USING (true);

-- ==============================================================================
-- 7. CURATED LOOKS (Avsaraa Style Pairings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.curated_looks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT,
    occasion TEXT CHECK (occasion IN ('All Looks', 'Everyday', 'Festive', 'Wedding', 'Party')),
    top_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    bottom_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    dupatta_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    total_price NUMERIC(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.curated_looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curated looks are viewable by everyone" 
    ON public.curated_looks FOR SELECT 
    USING (is_active = true);

-- ==============================================================================
-- 8. WISHLIST & SAVED LOOKS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    look_id UUID REFERENCES public.curated_looks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT product_or_look_check CHECK (
        (product_id IS NOT NULL AND look_id IS NULL) OR 
        (product_id IS NULL AND look_id IS NOT NULL)
    ),
    UNIQUE(user_id, product_id),
    UNIQUE(user_id, look_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist items" 
    ON public.wishlist_items FOR ALL 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 9. ORDERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Tailoring', 'Dispatched', 'Delivered', 'Cancelled', 'Returned')),
    subtotal NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded')),
    payment_method TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. ORDER ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    look_id UUID REFERENCES public.curated_looks(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    tailoring_profile_id UUID REFERENCES public.tailoring_profiles(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items" 
    ON public.order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 11. STYLING CONSULTATIONS & ATELIER APPOINTMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.styling_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    consultation_type TEXT DEFAULT 'Virtual' CHECK (consultation_type IN ('Virtual Video Call', 'Atelier Visit (Mumbai)', 'WhatsApp Stylist Consultation')),
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
-- 12. CONTACT INQUIRIES (From Contact Us Form)
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
-- 13. NEWSLETTER SUBSCRIBERS (Stay in the Loop)
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
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- ==============================================================================
-- SEED DATA (Curated looks & categories from Avsaraa design)
-- ==============================================================================
INSERT INTO public.categories (name, slug, description, display_order)
VALUES 
    ('Sarees', 'sarees', 'Artisanal Chanderi, Banarasi, and Organza Silk Sarees', 1),
    ('Occasion Wear', 'occasion-wear', 'Royal Bridal and Festive coordinates', 2),
    ('Dresses & Coordinates', 'dresses', 'Contemporary ethnic pairings and ensembles', 3),
    ('New Arrivals', 'new-arrivals', 'Fresh handloom releases handpicked for the season', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.curated_looks (title, slug, tagline, description, occasion, total_price, image_url, display_order)
VALUES
    ('Sage Serenity', 'sage-serenity', 'TOP + BOTTOM + DUPATTA', 'Handcrafted zari embellishment with muted pastel tones for festive poise.', 'Festive', 5899.00, '/images/saree_model_hero.jpg', 1),
    ('Dusty Rose Elegance', 'dusty-rose-elegance', 'TOP + BOTTOM + DUPATTA', 'Delicate organza weaves paired with an embroidered bodice and flowing silhouette.', 'Everyday', 5499.00, '/images/saree_model_hero.jpg', 2),
    ('Festive Grace', 'festive-grace', 'TOP + BOTTOM + DUPATTA', 'Royal jewel-toned drape celebrating heritage hand-embroidery.', 'Party', 6299.00, '/images/saree_model_hero.jpg', 3),
    ('Ivory Dreams', 'ivory-dreams', 'TOP + BOTTOM + DUPATTA', 'Classic Chanderi gold-dusted ensemble for wedding festivities.', 'Wedding', 5299.00, '/images/saree_model_hero.jpg', 4)
ON CONFLICT (slug) DO NOTHING;
