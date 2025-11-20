-- ============================================================================
-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ НАСТРОЙКИ САЙТА ANDOJV.COM
-- ============================================================================
-- Этот скрипт заполняет все необходимые таблицы данными для работы сайта
-- Запустите в Supabase SQL Editor: https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/sql
-- ============================================================================

-- ВАЖНО: Если хотите начать с чистого листа, раскомментируйте следующие строки:
-- DELETE FROM public.lookbook_images;
-- DELETE FROM public.lookbook_seasons;
-- DELETE FROM public.product_images;
-- DELETE FROM public.products;
-- DELETE FROM public.categories;
-- DELETE FROM public.info_pages;
-- DELETE FROM public.about_page;
-- DELETE FROM public.site_settings WHERE setting_key = 'hero_image';

-- ============================================================================
-- 1. НАСТРОЙКИ САЙТА (site_settings)
-- ============================================================================
-- Главное изображение на домашней странице
INSERT INTO public.site_settings (setting_key, value, description)
VALUES (
  'hero_image',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
  'Главное изображение на домашней странице'
) ON CONFLICT (setting_key) DO UPDATE
SET value = EXCLUDED.value;

-- Показывать интро на странице лукбука
INSERT INTO public.site_settings (setting_key, value, description)
VALUES (
  'lookbook_show_intro',
  'true',
  'Показывать интро на странице лукбука'
) ON CONFLICT (setting_key) DO UPDATE
SET value = EXCLUDED.value;

INSERT INTO public.site_settings (setting_key, value, description)
VALUES (
  'lookbook_intro_title',
  'Лукбуки',
  'Заголовок интро на странице лукбука'
) ON CONFLICT (setting_key) DO UPDATE
SET value = EXCLUDED.value;

INSERT INTO public.site_settings (setting_key, value, description)
VALUES (
  'lookbook_intro_description',
  'Исследуйте наши сезонные коллекции',
  'Описание интро на странице лукбука'
) ON CONFLICT (setting_key) DO UPDATE
SET value = EXCLUDED.value;

-- ============================================================================
-- 2. КАТЕГОРИИ ТОВАРОВ (categories)
-- ============================================================================
INSERT INTO public.categories (name, slug, description, display_order, is_active)
VALUES
  ('Футболки', 'futbolki', 'Базовые футболки из качественного хлопка', 1, true),
  ('Рубашки', 'rubashki', 'Минималистичные рубашки', 2, true),
  ('Брюки', 'bryuki', 'Удобные брюки для повседневной жизни', 3, true),
  ('Верхняя одежда', 'verhnyaya-odezhda', 'Куртки и пальто', 4, true),
  ('Аксессуары', 'aksessuary', 'Дополнения к образу', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. ТОВАРЫ (products) - Пример товаров
-- ============================================================================
-- Получаем ID категории "Футболки"
DO $$
DECLARE
  futbolki_category_id UUID;
  rubashki_category_id UUID;
  product_id UUID;
BEGIN
  -- Получаем ID категорий
  SELECT id INTO futbolki_category_id FROM public.categories WHERE slug = 'futbolki';
  SELECT id INTO rubashki_category_id FROM public.categories WHERE slug = 'rubashki';

  -- Добавляем товар "Базовая футболка"
  INSERT INTO public.products (
    name, slug, category_id, price, old_price, description, article,
    available_sizes, available_colors, material, is_new, is_sale,
    is_available, stock_quantity
  ) VALUES (
    'Базовая футболка',
    'bazovaya-futbolka-white',
    futbolki_category_id,
    2990,
    NULL,
    'Классическая футболка из 100% хлопка. Свободный крой, подходит для повседневной носки.',
    'BF-001-WHT',
    ARRAY['XS', 'S', 'M', 'L', 'XL'],
    ARRAY['Белый', 'Черный', 'Серый'],
    '100% хлопок',
    true,
    false,
    true,
    50
  ) RETURNING id INTO product_id;

  -- Добавляем изображения для футболки
  INSERT INTO public.product_images (product_id, image_url, alt_text, display_order)
  VALUES
    (product_id, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 'Базовая футболка - вид спереди', 1),
    (product_id, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', 'Базовая футболка - вид сбоку', 2);

  -- Добавляем еще один товар
  INSERT INTO public.products (
    name, slug, category_id, price, old_price, description, article,
    available_sizes, available_colors, material, is_new, is_sale,
    is_available, stock_quantity
  ) VALUES (
    'Оверсайз футболка',
    'oversajz-futbolka-black',
    futbolki_category_id,
    3490,
    4990,
    'Оверсайз футболка свободного кроя. Идеально для стиля casual.',
    'OF-002-BLK',
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Черный', 'Бежевый'],
    '100% хлопок',
    false,
    true,
    true,
    30
  ) RETURNING id INTO product_id;

  INSERT INTO public.product_images (product_id, image_url, alt_text, display_order)
  VALUES
    (product_id, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80', 'Оверсайз футболка', 1);

  -- Добавляем рубашку
  INSERT INTO public.products (
    name, slug, category_id, price, old_price, description, article,
    available_sizes, available_colors, material, is_new, is_sale,
    is_available, stock_quantity
  ) VALUES (
    'Льняная рубашка',
    'lnyanaya-rubashka-beige',
    rubashki_category_id,
    5990,
    NULL,
    'Рубашка из натурального льна. Легкая и дышащая ткань для теплой погоды.',
    'LR-003-BGE',
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Бежевый', 'Белый', 'Голубой'],
    '100% лен',
    true,
    false,
    true,
    25
  ) RETURNING id INTO product_id;

  INSERT INTO public.product_images (product_id, image_url, alt_text, display_order)
  VALUES
    (product_id, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80', 'Льняная рубашка', 1),
    (product_id, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80', 'Льняная рубашка - детали', 2);
END $$;

-- ============================================================================
-- 4. ЛУКБУКИ (lookbook_seasons и lookbook_images)
-- ============================================================================
INSERT INTO public.lookbook_seasons (
  season_name, slug, short_description, cover_image_url,
  title, subtitle, description, display_order, is_active
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
  )
ON CONFLICT (slug) DO UPDATE
SET
  season_name = EXCLUDED.season_name,
  cover_image_url = EXCLUDED.cover_image_url,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description;

-- Добавляем изображения для лукбуков
INSERT INTO public.lookbook_images (
  season_id, image_url, caption, alt_text, display_order, is_visible
)
SELECT
  id,
  'https://andojv.com/assets/lookbook-winter-1.jpg',
  'Базовый гардероб для холодного сезона',
  'Осень-Зима 2024 - фото 1',
  1,
  true
FROM public.lookbook_seasons WHERE slug = 'autumn-winter-2024'
ON CONFLICT DO NOTHING;

INSERT INTO public.lookbook_images (
  season_id, image_url, caption, alt_text, display_order, is_visible
)
SELECT
  id,
  'https://andojv.com/assets/lookbook-winter-2.jpg',
  'Минималистичный стиль в деталях',
  'Осень-Зима 2024 - фото 2',
  2,
  true
FROM public.lookbook_seasons WHERE slug = 'autumn-winter-2024'
ON CONFLICT DO NOTHING;

INSERT INTO public.lookbook_images (
  season_id, image_url, caption, alt_text, display_order, is_visible
)
SELECT
  id,
  'https://andojv.com/assets/lookbook-spring-1.jpg',
  'Легкие силуэты весеннего сезона',
  'Весна-Лето 2024 - фото 1',
  1,
  true
FROM public.lookbook_seasons WHERE slug = 'spring-summer-2024'
ON CONFLICT DO NOTHING;

INSERT INTO public.lookbook_images (
  season_id, image_url, caption, alt_text, display_order, is_visible
)
SELECT
  id,
  'https://andojv.com/assets/lookbook-spring-2.jpg',
  'Натуральные ткани и цвета',
  'Весна-Лето 2024 - фото 2',
  2,
  true
FROM public.lookbook_seasons WHERE slug = 'spring-summer-2024'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ИНФОРМАЦИОННЫЕ СТРАНИЦЫ (info_pages)
-- ============================================================================
INSERT INTO public.info_pages (page_key, title, content, display_order, is_visible)
VALUES
  (
    'delivery',
    'Доставка',
    '<p>Мы осуществляем доставку по всей России.</p>
    <h3>Сроки доставки:</h3>
    <ul>
      <li>По Москве и Санкт-Петербургу: 1-2 дня</li>
      <li>По России: 3-7 дней</li>
    </ul>
    <h3>Стоимость:</h3>
    <p>Доставка по России бесплатная при заказе от 5000 ₽</p>
    <p>При заказе до 5000 ₽ стоимость доставки 300 ₽</p>',
    1,
    true
  ),
  (
    'returns',
    'Возврат',
    '<p>Вы можете вернуть товар в течение 14 дней с момента получения.</p>
    <h3>Условия возврата:</h3>
    <ul>
      <li>Товар не был в использовании</li>
      <li>Сохранены все бирки и упаковка</li>
      <li>Товарный вид не нарушен</li>
    </ul>
    <p>Для оформления возврата свяжитесь с нами по email: info@andojv.com</p>',
    2,
    true
  ),
  (
    'size-guide',
    'Таблица размеров',
    '<h3>Мужская одежда:</h3>
    <table>
      <tr><th>Размер</th><th>Грудь (см)</th><th>Талия (см)</th></tr>
      <tr><td>XS</td><td>86-89</td><td>71-74</td></tr>
      <tr><td>S</td><td>90-93</td><td>75-78</td></tr>
      <tr><td>M</td><td>94-97</td><td>79-82</td></tr>
      <tr><td>L</td><td>98-101</td><td>83-86</td></tr>
      <tr><td>XL</td><td>102-105</td><td>87-90</td></tr>
    </table>
    <p>При возникновении вопросов о размере, пишите нам - поможем подобрать!</p>',
    3,
    true
  ),
  (
    'warranty',
    'Гарантия',
    '<p>На всю нашу продукцию распространяется гарантия качества.</p>
    <p>Если вы обнаружили брак или дефект, мы заменим товар или вернем деньги.</p>
    <p>Гарантия не распространяется на естественный износ и повреждения в результате неправильного ухода.</p>',
    4,
    true
  ),
  (
    'contacts',
    'Контакты',
    '<h3>Как с нами связаться:</h3>
    <p>Email: info@andojv.com</p>
    <p>Телефон: +7 (999) 123-45-67</p>
    <p>Мы работаем ежедневно с 10:00 до 20:00 (МСК)</p>
    <h3>Шоурум:</h3>
    <p>г. Москва, ул. Примерная, д. 1</p>
    <p>Посещение по предварительной записи</p>',
    5,
    true
  )
ON CONFLICT (page_key) DO UPDATE
SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_visible = EXCLUDED.is_visible;

-- ============================================================================
-- 6. СТРАНИЦА "О НАС" (about_page)
-- ============================================================================
INSERT INTO public.about_page (section_key, title, content, image_url, display_order)
VALUES
  (
    'brand_title',
    'ANDO JV',
    NULL,
    NULL,
    1
  ),
  (
    'description_1',
    NULL,
    'ANDO JV — российский бренд минималистичной одежды, основанный в 2024 году.',
    NULL,
    2
  ),
  (
    'description_2',
    NULL,
    'Мы создаем базовую одежду высокого качества, которая служит долго и не выходит из моды. Наша философия — минимализм, функциональность и внимание к деталям.',
    NULL,
    3
  ),
  (
    'description_3',
    NULL,
    'Каждая вещь разработана и произведена с заботой о людях и планете. Мы используем только качественные натуральные материалы и работаем с проверенными производствами.',
    NULL,
    4
  ),
  (
    'philosophy',
    'Философия',
    'Меньше вещей, больше качества. Мы верим в осознанное потребление и создаем одежду, которая прослужит вам долгие годы.',
    NULL,
    5
  ),
  (
    'production',
    'Производство',
    'Вся наша продукция производится в России. Мы лично контролируем каждый этап производства и гарантируем высокое качество.',
    NULL,
    6
  ),
  (
    'contacts',
    'Контакты',
    'Email: info@andojv.com
Телефон: +7 (999) 123-45-67
Instagram: @andojv',
    NULL,
    7
  ),
  (
    'founder_image',
    NULL,
    NULL,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    8
  )
ON CONFLICT (section_key) DO UPDATE
SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  image_url = EXCLUDED.image_url;

-- ============================================================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================================================
-- Проверяем заполнение данных
SELECT 'Настройки сайта:' as info, COUNT(*) as count FROM public.site_settings
UNION ALL
SELECT 'Категории:', COUNT(*) FROM public.categories WHERE is_active = true
UNION ALL
SELECT 'Товары:', COUNT(*) FROM public.products WHERE is_available = true
UNION ALL
SELECT 'Сезоны лукбуков:', COUNT(*) FROM public.lookbook_seasons WHERE is_active = true
UNION ALL
SELECT 'Изображения лукбуков:', COUNT(*) FROM public.lookbook_images WHERE is_visible = true
UNION ALL
SELECT 'Информационные страницы:', COUNT(*) FROM public.info_pages WHERE is_visible = true
UNION ALL
SELECT 'Секции страницы О нас:', COUNT(*) FROM public.about_page;

-- ============================================================================
-- ГОТОВО!
-- После выполнения этого скрипта все страницы сайта должны работать
-- ============================================================================
