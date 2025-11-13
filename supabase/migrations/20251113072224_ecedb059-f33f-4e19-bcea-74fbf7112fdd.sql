-- Добавляем недостающие поля в таблицу lookbook_seasons
ALTER TABLE public.lookbook_seasons
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS subtitle text,
ADD COLUMN IF NOT EXISTS description text;

-- Добавляем недостающие поля в таблицу lookbook_images
ALTER TABLE public.lookbook_images
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS alt_text text,
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Создаем индекс для slug
CREATE INDEX IF NOT EXISTS idx_lookbook_seasons_slug ON public.lookbook_seasons(slug);

-- Обновляем существующие записи, чтобы добавить slug на основе season_name
UPDATE public.lookbook_seasons
SET slug = LOWER(REGEXP_REPLACE(season_name, '[^a-zA-Zа-яА-Я0-9]+', '-', 'g'))
WHERE slug IS NULL;