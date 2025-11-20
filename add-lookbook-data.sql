-- SQL скрипт для добавления данных лукбуков в Supabase
-- Запустите этот скрипт в Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql

-- Сначала проверим, есть ли уже данные
-- Если нужно удалить существующие данные, раскомментируйте следующие строки:
-- DELETE FROM public.lookbook_images;
-- DELETE FROM public.lookbook_seasons;

-- Добавляем сезоны
INSERT INTO public.lookbook_seasons (
  season_name,
  slug,
  short_description,
  cover_image_url,
  title,
  subtitle,
  description,
  display_order,
  is_active
) VALUES
(
  'Осень-Зима 2024',
  'autumn-winter-2024',
  'Коллекция Осень-Зима 2024',
  'https://andojv.com/assets/lookbook-winter-cover.jpg',
  'Осень-Зима 2024',
  'Минимализм и уют',
  'Новая коллекция, сочетающая комфорт и стиль для холодного сезона.',
  1,
  true
),
(
  'Весна-Лето 2024',
  'spring-summer-2024',
  'Коллекция Весна-Лето 2024',
  'https://andojv.com/assets/lookbook-spring-cover.jpg',
  'Весна-Лето 2024',
  'Легкость и свобода',
  'Весенняя коллекция, воплощающая легкость и естественность.',
  2,
  true
);

-- Добавляем изображения для сезона Осень-Зима 2024
-- Сначала получим ID сезона
INSERT INTO public.lookbook_images (
  season_id,
  image_url,
  caption,
  alt_text,
  display_order,
  is_visible,
  photographer_credit
)
SELECT
  id,
  'https://andojv.com/assets/lookbook-winter-1.jpg',
  'Базовый гардероб для холодного сезона',
  'Осень-Зима 2024 - фото 1',
  1,
  true,
  NULL
FROM public.lookbook_seasons
WHERE slug = 'autumn-winter-2024'
UNION ALL
SELECT
  id,
  'https://andojv.com/assets/lookbook-winter-2.jpg',
  'Минималистичный стиль в деталях',
  'Осень-Зима 2024 - фото 2',
  2,
  true,
  NULL
FROM public.lookbook_seasons
WHERE slug = 'autumn-winter-2024';

-- Добавляем изображения для сезона Весна-Лето 2024
INSERT INTO public.lookbook_images (
  season_id,
  image_url,
  caption,
  alt_text,
  display_order,
  is_visible,
  photographer_credit
)
SELECT
  id,
  'https://andojv.com/assets/lookbook-spring-1.jpg',
  'Легкие силуэты весеннего сезона',
  'Весна-Лето 2024 - фото 1',
  1,
  true,
  NULL
FROM public.lookbook_seasons
WHERE slug = 'spring-summer-2024'
UNION ALL
SELECT
  id,
  'https://andojv.com/assets/lookbook-spring-2.jpg',
  'Натуральные ткани и цвета',
  'Весна-Лето 2024 - фото 2',
  2,
  true,
  NULL
FROM public.lookbook_seasons
WHERE slug = 'spring-summer-2024';

-- Проверим результат
SELECT
  s.season_name,
  s.slug,
  s.cover_image_url,
  COUNT(i.id) as image_count
FROM public.lookbook_seasons s
LEFT JOIN public.lookbook_images i ON s.id = i.season_id
GROUP BY s.id, s.season_name, s.slug, s.cover_image_url
ORDER BY s.display_order;
