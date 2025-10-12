-- Create table for managing About page content
CREATE TABLE public.about_page (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text,
  content text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view about page content"
  ON public.about_page
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can insert about page content"
  ON public.about_page
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update about page content"
  ON public.about_page
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete about page content"
  ON public.about_page
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_about_page_updated_at
  BEFORE UPDATE ON public.about_page
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial content
INSERT INTO public.about_page (section_key, title, content, display_order) VALUES
  ('brand_title', 'ANDO JV', NULL, 1),
  ('description_1', NULL, '— это российский бренд концептуальной одежды на каждый день, основанный двумя дизайнерами: Анзыловой Екатериной и Долгушиной Екатериной. ANDO JV сочетает в себе традиции и современность японской культуры, предлагая изделия, идеально подходящие как для городской жизни, так и для отдыха на природе.', 2),
  ('description_2', NULL, 'В стиле ANDO JV отражено видение двух дизайнеров, где соединяются минимализм и изысканные детали в виде асимметрии, смешения фактур, форм, текстур и цвета.', 3),
  ('description_3', NULL, 'Мы создаем капсульные коллекции с возможностью сочетать как с другими вещами бренда, так и с существующими айтемами гардероба.', 4),
  ('philosophy', 'Философия', 'Осознанное потребление и внимание к деталям. Качественные натуральные материалы и проверенные производители.', 5),
  ('production', 'Производство', 'Все изделия производятся в России с соблюдением высоких стандартов качества.', 6),
  ('contacts', 'Контакты', 'Email: hello@jnby.com.ru\nТелефон: +7 (921) 909-39-67', 7),
  ('founder_image', 'Основатели бренда', NULL, 8);