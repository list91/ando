-- Добавляем колонку gender в таблицу products
ALTER TABLE products
ADD COLUMN gender TEXT CHECK (gender IN ('women', 'men'));

-- Добавляем комментарий
COMMENT ON COLUMN products.gender IS 'Пол: women (женское), men (мужское)';