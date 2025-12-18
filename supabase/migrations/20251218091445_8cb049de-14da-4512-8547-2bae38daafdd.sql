-- Add color_links column for storing links to products in other colors
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS color_links JSONB DEFAULT NULL;

COMMENT ON COLUMN public.products.color_links IS 'Ссылки на товары других цветов. Формат: {"название цвета": "/product/slug"}';