-- Обновляем RLS политику для просмотра лукбуков - разрешаем всем видеть активные лукбуки
DROP POLICY IF EXISTS "Everyone can view lookbook seasons" ON public.lookbook_seasons;

CREATE POLICY "Everyone can view active lookbook seasons"
ON public.lookbook_seasons
FOR SELECT
USING (is_active = true);

-- Убеждаемся что RLS включен
ALTER TABLE public.lookbook_seasons ENABLE ROW LEVEL SECURITY;