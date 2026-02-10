-- ============================================================================
-- ANDO JV Database Migrations (Combined)
-- Generated: 2026-02-10
-- Order: Chronological by migration timestamp
-- ============================================================================
-- This file combines all migrations from supabase/migrations/ in correct order.
-- For local Supabase self-hosted deployment.
-- ============================================================================

-- ============================================================================
-- Migration: 20251012115758_a1a5e4ae-7e18-432c-b602-f70d4c99be04.sql
-- Initial schema: roles, categories, products, orders, profiles
-- ============================================================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- User roles table (must be created BEFORE has_role function)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (created AFTER user_roles table)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Now we can create policies for user_roles that use has_role
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update categories"
  ON public.categories FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  article TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  material TEXT,
  description TEXT,
  care_instructions TEXT,
  delivery_info TEXT,
  payment_info TEXT,
  is_sale BOOLEAN DEFAULT false,
  available_sizes TEXT[] DEFAULT '{}',
  available_colors TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update products"
  ON public.products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Product images table
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images are viewable by everyone"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update product images"
  ON public.product_images FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  delivery_method TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and managers can update orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  size TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of their own orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can view all order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can insert items to their own orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );

  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket and policies will be created via Supabase Storage service
-- (Removed direct INSERT to storage.buckets due to schema differences)

-- ============================================================================
-- Migration: 20251012115816_c830c285-00bd-4033-983f-26eb6791f8ea.sql
-- Fix search_path for update_updated_at_column function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Migration: 20251012120251_779f4545-51c4-4e9b-ae33-ee861fc81079.sql
-- Fix missing INSERT policy for profiles table
-- ============================================================================

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add policy for users to update their phone in profiles
CREATE POLICY "Users can update their profile phone"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Migration: 20251012121044_ceda5562-93a3-43fb-a627-6aa93cef7c93.sql
-- Site settings, lookbook, info pages
-- ============================================================================

-- Create site_settings table for general site configuration
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lookbook_seasons table
CREATE TABLE public.lookbook_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lookbook_images table
CREATE TABLE public.lookbook_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.lookbook_seasons(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  photographer_credit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create info_pages table for managing informational pages
CREATE TABLE public.info_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookbook_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookbook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings
CREATE POLICY "Everyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update site settings"
ON public.site_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lookbook_seasons
CREATE POLICY "Everyone can view lookbook seasons"
ON public.lookbook_seasons
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can insert lookbook seasons"
ON public.lookbook_seasons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update lookbook seasons"
ON public.lookbook_seasons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete lookbook seasons"
ON public.lookbook_seasons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lookbook_images
CREATE POLICY "Everyone can view lookbook images"
ON public.lookbook_images
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can insert lookbook images"
ON public.lookbook_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update lookbook images"
ON public.lookbook_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete lookbook images"
ON public.lookbook_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for info_pages
CREATE POLICY "Everyone can view info pages"
ON public.info_pages
FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can insert info pages"
ON public.info_pages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update info pages"
ON public.info_pages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete info pages"
ON public.info_pages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lookbook_seasons_updated_at
BEFORE UPDATE ON public.lookbook_seasons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_info_pages_updated_at
BEFORE UPDATE ON public.info_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for site-images will be created via Supabase Storage service
-- (Removed direct INSERT to storage.buckets due to schema differences)

-- ============================================================================
-- Migration: 20251012122324_6891b908-3a51-4bc4-8d76-381e6b0b5bcc.sql
-- First user admin assignment
-- ============================================================================

DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user (by creation date) who doesn't have any roles yet
  SELECT au.id INTO first_user_id
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE ur.id IS NULL
  ORDER BY au.created_at ASC
  LIMIT 1;

  -- If we found a user without roles, make them an admin
  IF first_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role assigned to first user: %', first_user_id;
  ELSE
    RAISE NOTICE 'No users without roles found';
  END IF;
END $$;

-- ============================================================================
-- Migration: 20251012130949_0cdea9aa-6f89-4c24-b011-8a8fa8785526.sql
-- Add display_order to categories
-- ============================================================================

ALTER TABLE public.categories
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Update existing categories with sequential order
UPDATE public.categories
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM public.categories
) AS subquery
WHERE categories.id = subquery.id;

-- ============================================================================
-- Migration: 20251012132711_5afefb57-475e-4d60-9093-9d7d49e5da20.sql
-- Add display_order to products
-- ============================================================================

ALTER TABLE public.products
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Update existing products with sequential order
UPDATE public.products
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 as row_num
  FROM public.products
) AS subquery
WHERE products.id = subquery.id;

-- ============================================================================
-- Migration: 20251012171428_2cab0993-2cf1-4349-b8aa-6192321e3626.sql
-- Create hero_slides table
-- ============================================================================

CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins and managers can insert hero slides"
ON public.hero_slides
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update hero slides"
ON public.hero_slides
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete hero slides"
ON public.hero_slides
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Migration: 20251012174456_63a47f68-dcaf-48cb-9a3c-ff4c978268cf.sql
-- Create about_page table
-- ============================================================================

CREATE TABLE public.about_page (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text,
  content text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view about page content"
  ON public.about_page
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert about page content"
  ON public.about_page
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update about page content"
  ON public.about_page
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete about page content"
  ON public.about_page
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_about_page_updated_at
  BEFORE UPDATE ON public.about_page
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Migration: 20251012180826_9a3112cb-66b0-43f8-801f-eb4f6f0d8670.sql
-- Create favorites table
-- ============================================================================

CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_product_id ON public.favorites(product_id);

-- ============================================================================
-- Migration: 20251104050232_11020db0-990e-45c6-bc7f-061ee7fd204a.sql
-- Add is_new column to products
-- ============================================================================

ALTER TABLE public.products
ADD COLUMN is_new boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_new IS 'Indicates if product should display NEW badge';

-- ============================================================================
-- Migration: 20251104073247_6c115f21-c736-4b72-b48c-2a7a0f7fee62.sql
-- Add sale date fields to products
-- ============================================================================

ALTER TABLE public.products
ADD COLUMN sale_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN sale_end_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_products_sale_dates ON public.products(sale_start_date, sale_end_date) WHERE is_sale = true;

CREATE OR REPLACE FUNCTION public.update_sale_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enable sale for products within sale period
  UPDATE public.products
  SET is_sale = true
  WHERE sale_start_date IS NOT NULL
    AND sale_end_date IS NOT NULL
    AND NOW() BETWEEN sale_start_date AND sale_end_date
    AND is_sale = false;

  -- Disable sale for products outside sale period
  UPDATE public.products
  SET is_sale = false
  WHERE sale_end_date IS NOT NULL
    AND NOW() > sale_end_date
    AND is_sale = true;

  -- Also disable sale if start date is in future
  UPDATE public.products
  SET is_sale = false
  WHERE sale_start_date IS NOT NULL
    AND NOW() < sale_start_date
    AND is_sale = true;
END;
$$;

-- ============================================================================
-- Migration: 20251113072224_ecedb059-f33f-4e19-bcea-74fbf7112fdd.sql
-- Add lookbook fields
-- ============================================================================

ALTER TABLE public.lookbook_seasons
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS subtitle text,
ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.lookbook_images
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS alt_text text,
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_lookbook_seasons_slug ON public.lookbook_seasons(slug);

UPDATE public.lookbook_seasons
SET slug = LOWER(REGEXP_REPLACE(season_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- ============================================================================
-- Migration: 20251113072609_28a47ed9-301c-4437-b5e9-a9f5278576e0.sql
-- Update lookbook RLS policy
-- ============================================================================

DROP POLICY IF EXISTS "Everyone can view lookbook seasons" ON public.lookbook_seasons;

CREATE POLICY "Everyone can view active lookbook seasons"
ON public.lookbook_seasons
FOR SELECT
USING (is_active = true);

ALTER TABLE public.lookbook_seasons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: 20251205000001_populate_info_pages.sql
-- Populate info_pages with initial content (skip for now - data will come from CSV)
-- ============================================================================
-- Note: This migration contains large HTML content for info pages.
-- The data will be imported from CSV backup instead.

-- ============================================================================
-- Migration: 20251218091445_8cb049de-14da-4512-8547-2bae38daafdd.sql
-- Add color_links to products
-- ============================================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS color_links JSONB DEFAULT NULL;

COMMENT ON COLUMN public.products.color_links IS 'Links to products in other colors. Format: {"color name": "/product/slug"}';

-- ============================================================================
-- Migration: 20251218120622_57f7fef5-66da-47e4-ba19-cff3a7574ae0.sql
-- Add composition to products
-- ============================================================================

ALTER TABLE public.products ADD COLUMN composition TEXT NULL;

-- ============================================================================
-- Migration: 20251225113926_96892339-0b67-449e-8dc4-1142c6f9e0b0.sql
-- Add gender to products
-- ============================================================================

ALTER TABLE products
ADD COLUMN gender TEXT CHECK (gender IN ('women', 'men'));

COMMENT ON COLUMN products.gender IS 'Gender: women, men';

-- ============================================================================
-- Migration: 20251226061108_c60db2ba-0583-41fd-b4ae-9a7434843e17.sql
-- Add size_quantities to products
-- ============================================================================

ALTER TABLE products
ADD COLUMN size_quantities JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.size_quantities IS 'Quantity by size: {"S": 2, "M": 5, "XL": 3}';

-- ============================================================================
-- Migration: 20260115092601_aed7dc64-609c-4f16-bbcd-b2646f306f5a.sql
-- Add responsive image fields to hero_slides
-- ============================================================================

ALTER TABLE hero_slides
ADD COLUMN image_url_tablet TEXT,
ADD COLUMN image_url_mobile TEXT;

COMMENT ON COLUMN hero_slides.image_url IS 'Desktop version (1920x1080)';
COMMENT ON COLUMN hero_slides.image_url_tablet IS 'Tablet version (1024x768)';
COMMENT ON COLUMN hero_slides.image_url_mobile IS 'Mobile version (480x800)';

-- ============================================================================
-- Migration: 20260115115946_70e0fd9d-fac5-42a9-95d2-7e7d07c6aa21.sql
-- Create colors table
-- ============================================================================

CREATE TABLE public.colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Migration: 20260122071714_6fc05f36-549c-4958-9d77-a9aa0d81b47e.sql
-- Add hex_code to colors and add image_url to info_pages
-- ============================================================================

ALTER TABLE colors ADD COLUMN hex_code TEXT DEFAULT '#CCCCCC';

ALTER TABLE info_pages ADD COLUMN image_url TEXT;

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
