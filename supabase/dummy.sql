-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Database Dummy / Seed Data Script
-- File: supabase/dummy.sql
-- ==============================================================================
-- Seeds realistic mock data for development, testing, and staging:
-- 1. Super Administrator Profile
-- 2. Dummy Customer Profiles & Member Accounts
-- 3. Customer Delivery Addresses
-- 4. Luxury Heritage Products Catalog (Sarees, Dresses, Occasion Wear, New Arrivals)
-- 5. Real Patron Reviews & Testimonials (With Photos - NO Videos)
-- 6. Concierge Inquiries & Messaging
-- 7. Newsletter Subscribers
-- ==============================================================================

BEGIN;

-- Temporarily relax foreign key constraint checks for clean mock data insertion
SET session_replication_role = 'replica';

-- ==============================================================================
-- 1. SUPER ADMINISTRATOR SEED
-- ==============================================================================
DELETE FROM public.admin_users WHERE email = 'admin@avsaraa.com';

INSERT INTO public.admin_users (
    id,
    full_name,
    email,
    role,
    department,
    phone_number,
    status,
    permissions,
    notes,
    created_at,
    updated_at
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Kratos Lord',
    'admin@avsaraa.com',
    'Super Admin',
    'Executive Leadership',
    '+91 98765 43210',
    'Active',
    ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'],
    'Master Super Administrator with unrestricted platform governance and supreme authority.',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'Super Admin',
    status = 'Active';


-- ==============================================================================
-- 2. DUMMY CUSTOMER PROFILES (Patron Accounts)
-- ==============================================================================
DELETE FROM public.profiles WHERE email IN (
    'priya.sharma@example.com',
    'ananya.singhania@example.com',
    'radhika.varma@example.com',
    'meera.kapoor@example.com',
    'vikramaditya.rao@example.com',
    'gayatri.deshmukh@example.com'
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
    preferred_currency,
    created_at,
    updated_at
)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'Priya Sharma',
        'priya.sharma@example.com',
        '+91 98201 11223',
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/account_hero.jpg',
        'Active',
        'VIP',
        1250,
        'INR',
        NOW() - INTERVAL '45 days',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'Ananya Singhania',
        'ananya.singhania@example.com',
        '+91 98112 33445',
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/patron_review_bride.jpg',
        'Active',
        'Atelier Circle',
        850,
        'INR',
        NOW() - INTERVAL '30 days',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'Radhika Varma',
        'radhika.varma@example.com',
        '+91 98722 55667',
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/patron_review_emerald.jpg',
        'Active',
        'Privilege',
        500,
        'INR',
        NOW() - INTERVAL '20 days',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000004',
        'Meera Kapoor',
        'meera.kapoor@example.com',
        '+91 97400 88990',
        NULL,
        'Active',
        'Standard',
        100,
        'INR',
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000005',
        'Vikramaditya Rao',
        'vikramaditya.rao@example.com',
        '+91 99001 22334',
        NULL,
        'Active',
        'VIP',
        2100,
        'INR',
        NOW() - INTERVAL '60 days',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000006',
        'Dr. Gayatri Deshmukh',
        'gayatri.deshmukh@example.com',
        '+91 98900 44556',
        NULL,
        'Active',
        'Atelier Circle',
        720,
        'INR',
        NOW() - INTERVAL '15 days',
        NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    membership_tier = EXCLUDED.membership_tier,
    reward_points = EXCLUDED.reward_points;


-- ==============================================================================
-- 3. CUSTOMER DELIVERY ADDRESSES
-- ==============================================================================
DELETE FROM public.addresses WHERE recipient_name IN (
    'Priya Sharma',
    'Ananya Singhania',
    'Radhika Varma',
    'Vikramaditya Rao'
);

INSERT INTO public.addresses (
    id,
    user_id,
    address_type,
    recipient_name,
    phone_number,
    address_line1,
    address_line2,
    landmark,
    city,
    state,
    postal_code,
    country,
    is_default,
    created_at,
    updated_at
)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'Home',
        'Priya Sharma',
        '+91 98201 11223',
        'Flat 14B, Royal Regency Towers',
        'Altamount Road, Cumballa Hill',
        'Near Villa Theresa High School',
        'Mumbai',
        'Maharashtra',
        '400026',
        'India',
        true,
        NOW(),
        NOW()
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000002',
        'Home',
        'Ananya Singhania',
        '+91 98112 33445',
        'Bungalow 7, Amrita Shergill Marg',
        'Lutyens Bungalow Zone',
        'Opposite Lodhi Gardens',
        'New Delhi',
        'Delhi',
        '110003',
        'India',
        true,
        NOW(),
        NOW()
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000003',
        'Studio',
        'Radhika Varma',
        '+91 98722 55667',
        'Atelier Studio 4, Lavelle Road',
        'Shanthala Nagar',
        'Behind UB City',
        'Bengaluru',
        'Karnataka',
        '560001',
        'India',
        true,
        NOW(),
        NOW()
    ),
    (
        'd0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000005',
        'Home',
        'Vikramaditya Rao',
        '+91 99001 22334',
        'Heritage Villa, Civil Lines',
        'Near Raj Bhavan',
        'Civil Lines',
        'Jaipur',
        'Rajasthan',
        '302006',
        'India',
        true,
        NOW(),
        NOW()
    );


-- ==============================================================================
-- 4. LUXURY PRODUCTS CATALOG
-- ==============================================================================
DELETE FROM public.products WHERE name IN (
    'Royal Banarasi Katan Silk Saree',
    'Emerald Organza Embroidered Saree',
    'Heritage Anarkali Silk Gown',
    'Festive Chanderi Foil Print Dress',
    'Royal Zari Bridal Drape',
    'Surat Brocade Evening Gown',
    'Handloom Tissue Silk Saree',
    'Crimson Heritage Bridal Kalidar'
);

INSERT INTO public.products (
    id,
    name,
    category,
    price,
    image_url,
    description,
    created_at
)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'Royal Banarasi Katan Silk Saree',
        'Sarees',
        24999.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/banarasi_silk_saree.jpg',
        'Authentic handwoven pure Banarasi katan silk saree featuring antique gold zari kadhwa borders and delicate floral jaal artistry.',
        NOW() - INTERVAL '30 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'Emerald Organza Embroidered Saree',
        'Sarees',
        18450.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/royal_organza_saree.jpg',
        'Weightless sheer organza drape adorned with intricate resham threadwork, scalloped borders, and lustrous pearl highlights.',
        NOW() - INTERVAL '25 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'Heritage Anarkali Silk Gown',
        'Occasion Wear',
        28900.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/royal_occasion_dress.jpg',
        'Regal floor-sweeping Kalidar gown tailored in Surat silk with heritage hand-zardozi embroidery across the neckline and cuffs.',
        NOW() - INTERVAL '20 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000004',
        'Festive Chanderi Foil Print Dress',
        'Dresses',
        12500.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/festive_chanderi_dress.jpg',
        'Contemporary silhouette crafted from lightweight Chanderi weave featuring artisanal metallic foil accents and a flowing flared hem.',
        NOW() - INTERVAL '18 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000005',
        'Royal Zari Bridal Drape',
        'New Arrivals',
        34500.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/saree_model_hero.jpg',
        'Exquisite bridal masterpiece with intricate peacock and floral motifs in pure gold-toned zari, crafted for auspicious celebrations.',
        NOW() - INTERVAL '12 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000006',
        'Surat Brocade Evening Gown',
        'Occasion Wear',
        19200.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/royal_occasion_dress.jpg',
        'Modern cocktail gown woven with traditional gold-thread Surat brocade, complete with a structured silhouette and concealed pockets.',
        NOW() - INTERVAL '8 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000007',
        'Handloom Tissue Silk Saree',
        'Sarees',
        21800.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/banarasi_silk_saree.jpg',
        'Glimmering metallic gold tissue saree interwoven with fine silk threads, paired with an embellished running blouse piece.',
        NOW() - INTERVAL '5 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000008',
        'Crimson Heritage Bridal Kalidar',
        'New Arrivals',
        38000.00,
        'https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/saree_model_hero.jpg',
        'Opulent crimson bridal silhouette featuring intensive hand-embroidered dabka, sitara, and gota patti craftsmanship.',
        NOW() - INTERVAL '2 days'
    );


-- ==============================================================================
-- 5. REAL PATRON REVIEWS & TESTIMONIALS (With Photos - NO Videos)
-- ==============================================================================
DELETE FROM public.product_reviews WHERE customer_email IN (
    'ananya.singhania@example.com',
    'radhika.varma@example.com',
    'gayatri.deshmukh@example.com',
    'priya.sharma@example.com'
);

INSERT INTO public.product_reviews (
    product_id,
    product_name,
    customer_name,
    customer_email,
    customer_city,
    rating,
    title,
    comment,
    photos,
    verified_purchase,
    helpful_count,
    status,
    created_at,
    updated_at
)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'Royal Banarasi Katan Silk Saree',
        'Ananya Singhania',
        'ananya.singhania@example.com',
        'New Delhi',
        5,
        'Breathtaking Wedding Drape — Absolute Masterpiece',
        'Wore this royal crimson Banarasi saree for our wedding reception. The handwoven real zari sheen and drape weight felt like true royal couture. Guests could not stop asking about the weavers from Surat.',
        ARRAY['https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/patron_review_bride.jpg'],
        true,
        34,
        'published',
        NOW() - INTERVAL '14 days',
        NOW()
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'Emerald Organza Embroidered Saree',
        'Radhika Varma',
        'radhika.varma@example.com',
        'Mumbai',
        5,
        'The Gold Zari Glow in Ambient Candlelight is Unreal',
        'Received endless compliments at our Diwali family gathering! The organza holds its pleats like a sculpture while remaining weightless. Pure heirloom quality from the Avsaraa atelier.',
        ARRAY['https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/patron_review_emerald.jpg'],
        true,
        22,
        'published',
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        'e0000000-0000-0000-0000-000000000004',
        'Festive Chanderi Foil Print Dress',
        'Dr. Gayatri Deshmukh',
        'gayatri.deshmukh@example.com',
        'Pune',
        5,
        'Atelier Packaging & Craftsmanship Surpassed Every Expectation',
        'From the handcrafted keepsake box to the master drape instructions included, Avsaraa defines quiet Indian luxury. Arrived in 48 hours to Pune with royal crest seals.',
        ARRAY['https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/festive_chanderi_dress.jpg'],
        true,
        18,
        'published',
        NOW() - INTERVAL '6 days',
        NOW()
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'Heritage Anarkali Silk Gown',
        'Priya Sharma',
        'priya.sharma@example.com',
        'Mumbai',
        5,
        'Unmatched Royal Flare & Zardozi Detail',
        'The silhouette flows with such majestic elegance. Tailoring is precise down to the millimeter. Truly a wardrobe heirloom for a lifetime of family milestones.',
        ARRAY['https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items/royal_occasion_dress.jpg'],
        true,
        15,
        'published',
        NOW() - INTERVAL '3 days',
        NOW()
    );


-- ==============================================================================
-- 6. CONTACT CONCIERGE INQUIRIES
-- ==============================================================================
DELETE FROM public.contact_inquiries WHERE email IN (
    'priya.mehta@example.com',
    'ananya.sharma@example.com',
    'rohit.deshmukh@example.com',
    'kavita.nair@example.com'
);

INSERT INTO public.contact_inquiries (
    full_name,
    email,
    phone_number,
    subject,
    message,
    status,
    created_at
)
VALUES
    (
        'Priya Mehta',
        'priya.mehta@example.com',
        '+91 98201 11223',
        'Custom Bridal Trousseau Styling',
        'Hello Avsaraa team, I am getting married in December in Udaipur and would like to schedule a personal consultation for 4 custom bridal drapes.',
        'In Progress',
        NOW() - INTERVAL '4 days'
    ),
    (
        'Ananya Sharma',
        'ananya.sharma@example.com',
        '+91 98112 33445',
        'Bespoke Blouse Tailoring Inquiry',
        'I am interested in ordering the Royal Banarasi Katan Silk Saree. Does Avsaraa provide custom blouse stitching with padded lining according to measurements?',
        'Unread',
        NOW() - INTERVAL '2 days'
    ),
    (
        'Rohit Deshmukh',
        'rohit.deshmukh@example.com',
        '+44 7700 900123',
        'International Shipping to London',
        'Greetings. How long does express shipping take to London, UK for the Heritage Anarkali Silk Gown? Also, are customs duties handled at checkout?',
        'Resolved',
        NOW() - INTERVAL '7 days'
    ),
    (
        'Kavita Nair',
        'kavita.nair@example.com',
        '+91 97400 55667',
        'Silk Care & Restoration Advice',
        'Could you advise on the recommended dry-cleaning care for the pure tissue silk sarees? Should they be stored in muslin bags?',
        'Unread',
        NOW() - INTERVAL '1 day'
    );


-- ==============================================================================
-- 7. NEWSLETTER SUBSCRIBERS
-- ==============================================================================
DELETE FROM public.newsletter_subscribers WHERE email IN (
    'aisha.patel@example.com',
    'meera.kapoor@example.com',
    'neha.verma@example.com',
    'sneha.joshi@example.com'
);

INSERT INTO public.newsletter_subscribers (email, status, source, created_at)
VALUES
    ('aisha.patel@example.com', 'Subscribed', 'Website Footer', NOW() - INTERVAL '12 days'),
    ('meera.kapoor@example.com', 'Subscribed', 'Hero Announcement', NOW() - INTERVAL '9 days'),
    ('neha.verma@example.com', 'Subscribed', 'Checkout Drawer', NOW() - INTERVAL '5 days'),
    ('sneha.joshi@example.com', 'Subscribed', 'Website Footer', NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO UPDATE SET
    status = 'Subscribed';

-- Re-enable normal trigger and foreign key constraint execution
SET session_replication_role = 'origin';

COMMIT;

-- ==============================================================================
-- VERIFICATION REPORT: Summary of Seeded Records
-- ==============================================================================
SELECT 'Super Admin' AS entity, COUNT(*) AS count FROM public.admin_users
UNION ALL
SELECT 'Customer Profiles' AS entity, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Addresses' AS entity, COUNT(*) FROM public.addresses
UNION ALL
SELECT 'Products' AS entity, COUNT(*) FROM public.products
UNION ALL
SELECT 'Reviews (Photos Only)' AS entity, COUNT(*) FROM public.product_reviews
UNION ALL
SELECT 'Inquiries' AS entity, COUNT(*) FROM public.contact_inquiries
UNION ALL
SELECT 'Subscribers' AS entity, COUNT(*) FROM public.newsletter_subscribers;
