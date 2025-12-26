-- Добавить поля для адаптивных изображений
ALTER TABLE hero_slides
ADD COLUMN image_url_tablet TEXT,
ADD COLUMN image_url_mobile TEXT;

-- Комментарии к полям
COMMENT ON COLUMN hero_slides.image_url IS 'Desktop версия (1920×1080)';
COMMENT ON COLUMN hero_slides.image_url_tablet IS 'Tablet версия (1024×768)';
COMMENT ON COLUMN hero_slides.image_url_mobile IS 'Mobile версия (480×800)';