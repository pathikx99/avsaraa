-- ==============================================================================
-- AVSARAA · WEAR THE MOMENT
-- SCRIPT 3: DEMO & SEED DATA (PRODUCTS, PROMOTIONS & DEMO CATALOG)
-- ==============================================================================
-- Run this optional script in your Supabase Dashboard -> SQL Editor
-- AFTER running 02_fresh_setup.sql whenever you want demo or sample catalog data.
--
-- Contents:
--   1. Demo Super Administrator Profile
--   2. Curated Luxury Ethnic Products (Sarees, Dresses, Sets)
--   3. Active Promotional Coupons & Discount Codes
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEMO SUPER ADMINISTRATOR AUTHORITY
-- ------------------------------------------------------------------------------
INSERT INTO public.admin_users (
    full_name,
    email,
    role,
    department,
    status,
    permissions,
    notes
) VALUES (
    'Avsaraa Master Authority',
    'web.avsaraa@gmail.com',
    'Super Admin',
    'Executive Leadership',
    'Active',
    ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'],
    'Pre-seeded demo administrator authority for local testing and store initialization.'
) ON CONFLICT (email) DO UPDATE SET
    status = 'Active',
    role = 'Super Admin';

-- ------------------------------------------------------------------------------
-- 2. CURATED LUXURY ETHNIC DEMO PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO public.products (
    id,
    name,
    category,
    price,
    mrp,
    discount_percent,
    image_url,
    gallery_images,
    video_url,
    description,
    fabric,
    weave,
    color_variants,
    available_sizes,
    stock_count,
    sales_count,
    product_type,
    specifications,
    highlights,
    occasion_tags
) VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'Royal Banarasi Katan Silk Saree',
    'Sarees',
    24999.00,
    32500.00,
    23,
    '/images/saree_model_hero.jpg',
    '["/images/saree_model_hero.jpg", "/images/occasion_traditional.jpg", "/images/occasion_wedding.jpg"]'::jsonb,
    'https://www.youtube.com/embed/5mGUdDq42iI',
    'Pure mulberry Katan silk handwoven on traditional Varanasi handlooms with intricate real zari kadhwa floral jaal and a regal gold brocade pallu.',
    'Pure Mulberry Katan Silk',
    'Handloom Banarasi Kadhwa',
    '[
        {"name": "Crimson Red", "hex": "#8A181A", "image_url": "/images/saree_model_hero.jpg"},
        {"name": "Royal Emerald", "hex": "#1C4D35", "image_url": "/images/occasion_traditional.jpg"},
        {"name": "Rani Pink", "hex": "#B8255F", "image_url": "/images/occasion_wedding.jpg"}
    ]'::jsonb,
    ARRAY['Free Size (5.5m + 0.8m Blouse)'],
    10,
    320,
    'standalone',
    '{
        "fabric": "Pure Mulberry Katan Silk (Handloom Certified)",
        "work": "Intricate Antique Gold Zari Kadhwa Weave & Handwoven Floral Jaal",
        "pattern": "Traditional Royal Floral Boota & Ornate Brocade Border",
        "fit": "Classic 6-Yard Drape with Sculpted Fall",
        "occasion": "Bridal Receptions, Weddings, Traditional Ceremonies",
        "set_includes": "1 Saree (5.5 Meters) + 1 Unstitched Matching Blouse Piece (0.8 Meters)",
        "product_length": "Saree: 5.5 Meters | Blouse: 0.8 Meters | Width: 45 Inches",
        "care_instructions": "Dry clean only. Store wrapped in pure muslin cloth."
    }'::jsonb,
    ARRAY['100% Certified Pure Katan Silk', 'Intricate Antique Gold Zari Weft', 'Sculpted Heirloom Weight Drape'],
    ARRAY['Traditional & Ceremonial Wear', 'Wedding Guest', 'Festive Edit']
),
(
    'e0000000-0000-0000-0000-000000000004',
    'Festive Chanderi Foil Print Dress',
    'Dresses',
    12500.00,
    16900.00,
    26,
    '/images/occasion_festive.jpg',
    '["/images/occasion_festive.jpg", "/images/occasion_party.jpg", "/images/botanical_flowers.jpg"]'::jsonb,
    'https://www.youtube.com/embed/5mGUdDq42iI',
    'Contemporary silhouette crafted from lightweight Chanderi weave featuring artisanal metallic foil accents, soft inner lining, and a flowing flared hem.',
    'Pure Chanderi Silk Blend',
    'Zari Weft & Handblock',
    '[
        {"name": "Festive Gold", "hex": "#D4AF37", "image_url": "/images/occasion_festive.jpg"},
        {"name": "Deep Ruby", "hex": "#7B1113", "image_url": "/images/occasion_party.jpg"},
        {"name": "Ivory Pearl", "hex": "#F3ECE1", "image_url": "/images/botanical_flowers.jpg"}
    ]'::jsonb,
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    15,
    215,
    'top',
    '{
        "fabric": "Pure Chanderi Silk Blend with Soft Butter Crepe Lining",
        "work": "Artisanal Metallic Gold Foil Print & Micro-Sequin Yoke",
        "pattern": "Contemporary Kalidar Flared Motif",
        "fit": "Flared Anarkali Silhouette with Cinched Waist",
        "occasion": "Festive Soirées, Diwali Celebrations, Evening Gatherings",
        "set_includes": "1 Flared Long Dress with Inbuilt Lining",
        "product_length": "Dress Length: 49 Inches | Sleeve Length: 18 Inches",
        "care_instructions": "Dry clean recommended for first two washes. Hand wash cold separately."
    }'::jsonb,
    ARRAY['Weightless Breathable Sheen', 'Artisanal Metallic Accents', 'All-Day Tailored Comfort Cut'],
    ARRAY['Festive Edit', 'Haldi & Mehendi', 'Party & Special Occasions']
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Emerald Organza Embroidered Saree',
    'Sarees',
    18450.00,
    23900.00,
    23,
    '/images/occasion_traditional.jpg',
    '["/images/occasion_traditional.jpg", "/images/occasion_party.jpg", "/images/saree_model_hero.jpg"]'::jsonb,
    'https://www.youtube.com/embed/5mGUdDq42iI',
    'Whisper-light handloom organza saree in deep emerald adorned with scalloped hand-cut resham embroidery and delicate badla zari accents.',
    'Pure Sheer Handloom Organza Silk',
    'Fine Sheer Organza Weave',
    '[
        {"name": "Deep Emerald", "hex": "#0E4731", "image_url": "/images/occasion_traditional.jpg"},
        {"name": "Powder Blue", "hex": "#8DA7B8", "image_url": "/images/occasion_party.jpg"}
    ]'::jsonb,
    ARRAY['Free Size (5.5m + 0.8m Blouse)'],
    8,
    190,
    'standalone',
    '{
        "fabric": "Pure Sheer Handloom Organza Silk",
        "work": "Hand-cut Scalloped Resham Border with Micro-Zari Highlights",
        "pattern": "Minimalist Scattered Floral Motifs",
        "fit": "Lightweight Sculptural Drape",
        "occasion": "Cocktail Dinners, Wedding Guest, Evening Receptions",
        "set_includes": "1 Saree (5.5 Meters) + 1 Heavy Embroidered Blouse Piece (0.8 Meters)",
        "product_length": "Saree: 5.5 Meters | Blouse: 0.8 Meters | Width: 44 Inches",
        "care_instructions": "Dry clean only. Roll-press recommended for organza pleats."
    }'::jsonb,
    ARRAY['Weightless Sculptural Drape', 'Intricate Badla & Resham Cutwork', 'Graceful Fluid Movement'],
    ARRAY['Traditional & Ceremonial Wear', 'Party & Special Occasions']
),
(
    'e1000000-0000-0000-0000-000000000003',
    'Indigo Floral Handblock Printed Suit Set',
    'Dresses',
    1299.00,
    1899.00,
    32,
    '/images/occasion_everyday.jpg',
    '["/images/occasion_everyday.jpg", "/images/occasion_festive.jpg", "/images/botanical_flowers.jpg"]'::jsonb,
    'https://www.youtube.com/embed/5mGUdDq42iI',
    'Breathable pure cotton slub suit set in deep indigo blue, featuring traditional handblock botanical motifs, comfortable straight-fit trousers, and matching lightweight stole.',
    '100% Breathable Pure Cotton Slub',
    'Artisanal Bagru Handblock',
    '[
        {"name": "Indigo Blue", "hex": "#233D60", "image_url": "/images/occasion_everyday.jpg"},
        {"name": "Earthy Sage", "hex": "#6A7B69", "image_url": "/images/occasion_festive.jpg"}
    ]'::jsonb,
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    25,
    210,
    'set',
    '{
        "fabric": "100% Breathable Pure Cotton Slub",
        "work": "Authentic Bagru Handblock Botanical Print",
        "pattern": "Traditional Indigo Floral Motif",
        "fit": "Straight Cut Kurta with Relaxed Comfort Trousers",
        "occasion": "Everyday Workwear, Daytime Gatherings, Casual Outings",
        "set_includes": "1 Kurta + 1 Pair of Trousers + 1 Cotton Mul Stole",
        "product_length": "Kurta Length: 44 Inches | Trouser Length: 38 Inches",
        "care_instructions": "Gentle machine wash cold. Wash dark colors separately."
    }'::jsonb,
    ARRAY['Skin-Friendly Cotton Slub', 'Natural Fast Dyes', 'Easy Care All-Day Comfort Fit'],
    ARRAY['Everyday Essentials', 'Festive Edit']
),
(
    'e1000000-0000-0000-0000-000000000009',
    'Sage Minimalist Linen Everyday Kurta',
    'Dresses',
    1250.00,
    1750.00,
    29,
    '/images/occasion_everyday.jpg',
    '["/images/occasion_everyday.jpg", "/images/occasion_party.jpg"]'::jsonb,
    'https://www.youtube.com/embed/5mGUdDq42iI',
    'Minimalist hand-spun linen kurta in soothing sage green. Tailored with a relaxed silhouette, side slits, and mother-of-pearl button detailing for effortless everyday elegance.',
    'Pure Handloom Linen & Breathable Cotton Blend',
    'Relaxed Kalidar Linen Weave',
    '[
        {"name": "Sage Green", "hex": "#7E8C78", "image_url": "/images/occasion_everyday.jpg"},
        {"name": "Natural Ivory", "hex": "#EBE3D5", "image_url": "/images/botanical_flowers.jpg"}
    ]'::jsonb,
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    20,
    88,
    'top',
    '{
        "fabric": "Pure Handloom Linen & Breathable Cotton Blend",
        "work": "Minimalist Stitch Detailing & Mother-of-Pearl Accents",
        "pattern": "Solid Organic Slub Texture",
        "fit": "Relaxed Straight Cut with Side Slits",
        "occasion": "Daily Wear, Office Meetings, Casual Brunches",
        "set_includes": "1 Handcrafted Everyday Kurta",
        "product_length": "Kurta Length: 43 Inches | Sleeve Length: 17 Inches",
        "care_instructions": "Gentle hand wash or cold machine wash. Warm iron while slightly damp."
    }'::jsonb,
    ARRAY['Naturally Breathable Pure Linen', 'Natural Mother-of-Pearl Buttons', 'Effortless Everyday Silhouette'],
    ARRAY['Everyday Essentials']
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    mrp = EXCLUDED.mrp,
    discount_percent = EXCLUDED.discount_percent,
    image_url = EXCLUDED.image_url,
    gallery_images = EXCLUDED.gallery_images,
    description = EXCLUDED.description,
    fabric = EXCLUDED.fabric,
    weave = EXCLUDED.weave,
    color_variants = EXCLUDED.color_variants,
    available_sizes = EXCLUDED.available_sizes,
    stock_count = EXCLUDED.stock_count,
    specifications = EXCLUDED.specifications,
    highlights = EXCLUDED.highlights,
    occasion_tags = EXCLUDED.occasion_tags,
    updated_at = TIMEZONE('utc', NOW());

-- ------------------------------------------------------------------------------
-- 3. PROMOTIONAL COUPONS & DISCOUNT CODES
-- ------------------------------------------------------------------------------
INSERT INTO public.coupons (
    code,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    is_active,
    usage_limit,
    used_count,
    per_user_limit,
    valid_from
) VALUES 
(
    'AVSARAA10',
    'percentage',
    10.00,
    0.00,
    10000.00,
    true,
    1000,
    42,
    5,
    TIMEZONE('utc', NOW()) - INTERVAL '30 days'
),
(
    'FREEDEL',
    'free_shipping',
    0.00,
    0.00,
    NULL,
    true,
    1000,
    5,
    3,
    TIMEZONE('utc', NOW()) - INTERVAL '30 days'
),
(
    'WELCOME500',
    'fixed',
    500.00,
    2999.00,
    500.00,
    true,
    500,
    18,
    1,
    TIMEZONE('utc', NOW()) - INTERVAL '30 days'
),
(
    'FESTIVE25',
    'percentage',
    25.00,
    4999.00,
    5000.00,
    true,
    250,
    12,
    1,
    TIMEZONE('utc', NOW()) - INTERVAL '15 days'
),
(
    'ROYAL1000',
    'fixed',
    1000.00,
    9999.00,
    1000.00,
    true,
    200,
    9,
    2,
    TIMEZONE('utc', NOW()) - INTERVAL '15 days'
)
ON CONFLICT (code) DO UPDATE SET
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    min_order_amount = EXCLUDED.min_order_amount,
    max_discount_amount = EXCLUDED.max_discount_amount,
    is_active = EXCLUDED.is_active,
    per_user_limit = EXCLUDED.per_user_limit;
