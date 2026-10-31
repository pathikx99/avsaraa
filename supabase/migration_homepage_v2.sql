-- ==============================================================================
-- AVSARAA - HOMEPAGE V2 DATABASE MIGRATION
-- File: supabase/migration_homepage_v2.sql
-- ==============================================================================
-- Safe, non-destructive ALTER TABLE statements to support:
-- 1. Occasion multi-tagging (Everyday Essentials, Festive Edit, Wedding Guest, Haldi & Mehendi, etc.)
-- 2. Colour variant swatches (array of { name, hex, image_url })
-- 3. Sales count ranking for Bestsellers / Our Favourites
-- 4. Product type for AVSARAA Style combinations ('standalone', 'top', 'bottom', 'set')
-- ==============================================================================

-- 1. Add occasion_tags column (text array for multi-tagging products)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS occasion_tags TEXT[] DEFAULT '{}';

-- 2. Add color_variants column (JSONB array for color swatch dots)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]';

-- 3. Add sales_count column for bestseller ranking
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- 4. Add product_type column for mix & match combinations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'standalone';

-- 5. Add check constraint on product_type if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_product_type'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT check_product_type 
        CHECK (product_type IN ('standalone', 'top', 'bottom', 'set'));
    END IF;
END $$;

-- 6. Performance indexes for occasion filtering, price ceiling, and bestsellers
CREATE INDEX IF NOT EXISTS idx_products_occasion_tags ON public.products USING GIN (occasion_tags);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON public.products (sales_count DESC);

-- ==============================================================================
-- Verification Query:
-- SELECT id, name, price, occasion_tags, sales_count FROM public.products LIMIT 5;
-- ==============================================================================
