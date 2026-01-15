-- Create colors table without RLS
CREATE TABLE public.colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial colors
INSERT INTO colors (name, display_order) VALUES
  ('Черный', 1),
  ('Белый', 2),
  ('Серый', 3),
  ('Бежевый', 4),
  ('Коричневый', 5),
  ('Синий', 6),
  ('Голубой', 7),
  ('Зеленый', 8),
  ('Красный', 9),
  ('Розовый', 10),
  ('Желтый', 11),
  ('Оранжевый', 12),
  ('Фиолетовый', 13),
  ('Бордовый', 14),
  ('Хаки', 15);