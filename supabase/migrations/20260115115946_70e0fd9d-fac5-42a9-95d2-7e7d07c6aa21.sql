-- Добавляем колонку hex_code
ALTER TABLE colors ADD COLUMN hex_code TEXT DEFAULT '#CCCCCC';

-- Заполняем существующими значениями
UPDATE colors SET hex_code = '#000000' WHERE LOWER(name) = 'черный';
UPDATE colors SET hex_code = '#FFFFFF' WHERE LOWER(name) = 'белый';
UPDATE colors SET hex_code = '#808080' WHERE LOWER(name) = 'серый';
UPDATE colors SET hex_code = '#F5F5DC' WHERE LOWER(name) = 'бежевый';
UPDATE colors SET hex_code = '#8B4513' WHERE LOWER(name) = 'коричневый';
UPDATE colors SET hex_code = '#4169E1' WHERE LOWER(name) = 'синий';
UPDATE colors SET hex_code = '#87CEEB' WHERE LOWER(name) = 'голубой';
UPDATE colors SET hex_code = '#228B22' WHERE LOWER(name) = 'зеленый';
UPDATE colors SET hex_code = '#DC143C' WHERE LOWER(name) = 'красный';
UPDATE colors SET hex_code = '#FFB6C1' WHERE LOWER(name) = 'розовый';
UPDATE colors SET hex_code = '#FFD700' WHERE LOWER(name) = 'желтый';
UPDATE colors SET hex_code = '#FF8C00' WHERE LOWER(name) = 'оранжевый';
UPDATE colors SET hex_code = '#8A2BE2' WHERE LOWER(name) = 'фиолетовый';
UPDATE colors SET hex_code = '#800020' WHERE LOWER(name) = 'бордовый';
UPDATE colors SET hex_code = '#C3B091' WHERE LOWER(name) = 'хаки';