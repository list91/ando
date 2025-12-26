-- Добавляем колонку size_quantities для учёта количества по размерам
ALTER TABLE products
ADD COLUMN size_quantities JSONB DEFAULT '{}'::jsonb;

-- Добавляем комментарий
COMMENT ON COLUMN products.size_quantities IS 'Количество товара по размерам: {"S": 2, "M": 5, "XL": 3}';