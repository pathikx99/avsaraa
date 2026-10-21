-- ==============================================================================
-- AVSARAA - WEAR THE MOMENT
-- Dummy & Seed Data Script
-- File: supabase/dummy.sql
-- ==============================================================================
-- Run this script in the Supabase SQL Editor AFTER executing schema.sql.
-- It seeds the database with:
--   1. The Sole Super Admin Account (Kratos Lord / admin@avsaraa.com)
--   2. Luxury Handcrafted Products across Sarees, Dresses, Occasion Wear & New Arrivals
--   3. Sample Customer Concierge Inquiries (Unread, In Progress, Resolved)
--   4. Sample Newsletter Subscribers
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. SOLE SUPER ADMIN (Master Authority)
-- ==============================================================================
-- Clean up any extraneous non-super-admin records
DELETE FROM public.admin_users WHERE email != 'admin@avsaraa.com';

INSERT INTO public.admin_users (
    full_name,
    email,
    role,
    department,
    phone_number,
    status,
    permissions,
    notes
)
VALUES (
    'Kratos Lord',
    'admin@avsaraa.com',
    'Super Admin',
    'Executive Leadership',
    '+91 98765 43210',
    'Active',
    ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'],
    'Founding Super Administrator with full system control and supreme authority.'
)
ON CONFLICT (email) DO UPDATE SET
    role = 'Super Admin',
    status = 'Active',
    updated_at = TIMEZONE('utc', NOW());


-- ==============================================================================
-- 2. LUXURY PRODUCTS CATALOG
-- ==============================================================================
-- Clean existing dummy products to avoid duplicates when re-seeding
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

INSERT INTO public.products (name, category, price, image_url, description)
VALUES
    (
        'Royal Banarasi Katan Silk Saree',
        'Sarees',
        24999.00,
        '/images/banarasi_silk_saree.jpg',
        'Authentic handwoven pure Banarasi katan silk saree with antique gold zari kadhwa borders and delicate floral jaal.'
    ),
    (
        'Emerald Organza Embroidered Saree',
        'Sarees',
        18450.00,
        '/images/royal_organza_saree.jpg',
        'Weightless sheer organza drape adorned with intricate resham threadwork, scalloped borders, and lustrous pearl highlights.'
    ),
    (
        'Heritage Anarkali Silk Gown',
        'Occasion Wear',
        28900.00,
        '/images/royal_occasion_dress.jpg',
        'Regal floor-sweeping Kalidar gown tailored in Surat silk with heritage hand-zardozi embroidery across the neckline and cuffs.'
    ),
    (
        'Festive Chanderi Foil Print Dress',
        'Dresses',
        12500.00,
        '/images/festive_chanderi_dress.jpg',
        'Contemporary silhouette crafted from lightweight Chanderi weave featuring artisanal metallic foil accents and a flowing flared hem.'
    ),
    (
        'Royal Zari Bridal Drape',
        'New Arrivals',
        34500.00,
        '/images/saree_model_hero.jpg',
        'Exquisite bridal masterpiece with intricate peacock and floral motifs in pure gold-toned zari, crafted for auspicious celebrations.'
    ),
    (
        'Surat Brocade Evening Gown',
        'Occasion Wear',
        19200.00,
        '/images/royal_occasion_dress.jpg',
        'Modern cocktail gown woven with traditional gold-thread Surat brocade, complete with a structured silhouette and concealed pockets.'
    ),
    (
        'Handloom Tissue Silk Saree',
        'Sarees',
        21800.00,
        '/images/banarasi_silk_saree.jpg',
        'Glimmering metallic gold tissue saree interwoven with fine silk threads, paired with an embellished running blouse piece.'
    ),
    (
        'Crimson Heritage Bridal Kalidar',
        'New Arrivals',
        38000.00,
        '/images/saree_model_hero.jpg',
        'Opulent crimson bridal silhouette featuring intensive hand-embroidered dabka, sitara, and gota patti craftsmanship.'
    );


-- ==============================================================================
-- 3. CONTACT CONCIERGE INQUIRIES
-- ==============================================================================
DELETE FROM public.contact_inquiries WHERE email IN (
    'priya.mehta@example.com',
    'ananya.sharma@example.com',
    'rohit.deshmukh@example.com',
    'kavita.nair@example.com'
);

INSERT INTO public.contact_inquiries (full_name, email, phone_number, subject, message, status)
VALUES
    (
        'Priya Mehta',
        'priya.mehta@example.com',
        '+91 98201 11223',
        'Custom Bridal Trousseau Styling',
        'Hello Avsaraa team, I am getting married in December in Udaipur and would like to schedule a personal consultation for 4 custom bridal drapes.',
        'In Progress'
    ),
    (
        'Ananya Sharma',
        'ananya.sharma@example.com',
        '+91 98112 33445',
        'Bespoke Blouse Tailoring Inquiry',
        'I am interested in ordering the Royal Banarasi Katan Silk Saree. Does Avsaraa provide custom blouse stitching with padded lining according to measurements?',
        'Unread'
    ),
    (
        'Rohit Deshmukh',
        'rohit.deshmukh@example.com',
        '+44 7700 900123',
        'International Shipping to London',
        'Greetings. How long does express shipping take to London, UK for the Heritage Anarkali Silk Gown? Also, are customs duties handled at checkout?',
        'Resolved'
    ),
    (
        'Kavita Nair',
        'kavita.nair@example.com',
        '+91 97400 55667',
        'Silk Care & Restoration Advice',
        'Could you advise on the recommended dry-cleaning care for the pure tissue silk sarees? Should they be stored in muslin bags?',
        'Unread'
    );


-- ==============================================================================
-- 4. NEWSLETTER SUBSCRIBERS
-- ==============================================================================
DELETE FROM public.newsletter_subscribers WHERE email IN (
    'aisha.patel@example.com',
    'meera.kapoor@example.com',
    'neha.verma@example.com',
    'sneha.joshi@example.com'
);

INSERT INTO public.newsletter_subscribers (email, is_active, source)
VALUES
    ('aisha.patel@example.com', true, 'storefront_footer'),
    ('meera.kapoor@example.com', true, 'hero_announcement'),
    ('neha.verma@example.com', true, 'checkout_modal'),
    ('sneha.joshi@example.com', true, 'storefront_footer')
ON CONFLICT (email) DO UPDATE SET
    is_active = true;

COMMIT;

-- Verification of seeded counts
SELECT 'Super Admin' AS entity, COUNT(*) FROM public.admin_users
UNION ALL
SELECT 'Products' AS entity, COUNT(*) FROM public.products
UNION ALL
SELECT 'Inquiries' AS entity, COUNT(*) FROM public.contact_inquiries
UNION ALL
SELECT 'Subscribers' AS entity, COUNT(*) FROM public.newsletter_subscribers;
