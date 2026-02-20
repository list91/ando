-- ============================================================================
-- Migration: User Discounts System
-- Description: Добавляет систему персональных скидок, промокодов и истории применения
-- Created: 2026-02-19
-- ============================================================================

-- ============================================================================
-- 1. USER_DISCOUNTS TABLE
-- Персональные скидки пользователей
-- ============================================================================

CREATE TABLE public.user_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('first_order', 'personal', 'birthday', 'loyalty')),
  discount_amount NUMERIC(5,2) NOT NULL CHECK (discount_amount >= 0 AND discount_amount <= 100),
  description TEXT,
  assigned_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Проверка: valid_until должен быть больше valid_from (если указан)
  CONSTRAINT check_valid_period CHECK (valid_until IS NULL OR valid_until > valid_from),

  -- Проверка: только одна активная скидка 'first_order' на пользователя
  CONSTRAINT unique_active_first_order UNIQUE (user_id, discount_type)
    DEFERRABLE INITIALLY DEFERRED
);

-- Индексы для user_discounts
CREATE INDEX idx_user_discounts_user_id ON public.user_discounts(user_id);
CREATE INDEX idx_user_discounts_active ON public.user_discounts(is_active) WHERE is_active = true;
CREATE INDEX idx_user_discounts_valid_until ON public.user_discounts(valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX idx_user_discounts_type ON public.user_discounts(discount_type);

-- Комментарии
COMMENT ON TABLE public.user_discounts IS 'Персональные скидки пользователей';
COMMENT ON COLUMN public.user_discounts.discount_type IS 'Тип скидки: first_order, personal, birthday, loyalty';
COMMENT ON COLUMN public.user_discounts.discount_amount IS 'Процент скидки (0.00 - 100.00)';

-- ============================================================================
-- 2. PROMO_CODES TABLE
-- Общие промокоды
-- ============================================================================

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_amount NUMERIC(5,2) NOT NULL CHECK (discount_amount >= 0 AND discount_amount <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Проверка: valid_until должен быть больше valid_from (если указан)
  CONSTRAINT check_promo_valid_period CHECK (valid_until IS NULL OR valid_until > valid_from),

  -- Проверка: used_count не может превышать max_uses (если задан)
  CONSTRAINT check_max_uses CHECK (max_uses IS NULL OR used_count <= max_uses)
);

-- Индексы для promo_codes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_promo_codes_valid_until ON public.promo_codes(valid_until) WHERE valid_until IS NOT NULL;

-- Комментарии
COMMENT ON TABLE public.promo_codes IS 'Общие промокоды для скидок';
COMMENT ON COLUMN public.promo_codes.code IS 'Уникальный код промокода';
COMMENT ON COLUMN public.promo_codes.max_uses IS 'Максимальное количество использований (NULL = безлимит)';

-- ============================================================================
-- 3. ORDER_DISCOUNTS TABLE
-- История применения скидок к заказам
-- ============================================================================

CREATE TABLE public.order_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  discount_type VARCHAR(50) NOT NULL,
  discount_amount NUMERIC(5,2) NOT NULL CHECK (discount_amount >= 0 AND discount_amount <= 100),
  promo_code VARCHAR(50),
  user_discount_id UUID REFERENCES public.user_discounts(id) ON DELETE SET NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Только один тип скидки на заказ (или промокод, или персональная)
  CONSTRAINT unique_discount_per_order UNIQUE (order_id)
);

-- Индексы для order_discounts
CREATE INDEX idx_order_discounts_order_id ON public.order_discounts(order_id);
CREATE INDEX idx_order_discounts_type ON public.order_discounts(discount_type);
CREATE INDEX idx_order_discounts_applied_at ON public.order_discounts(applied_at);

-- Комментарии
COMMENT ON TABLE public.order_discounts IS 'История применения скидок к заказам';
COMMENT ON COLUMN public.order_discounts.discount_type IS 'Тип применённой скидки';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_discounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES FOR USER_DISCOUNTS
-- ============================================================================

-- Пользователи видят только свои скидки
CREATE POLICY "Users can view their own discounts"
  ON public.user_discounts FOR SELECT
  USING (auth.uid() = user_id);

-- Админы видят все скидки
CREATE POLICY "Admins can view all discounts"
  ON public.user_discounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Админы могут создавать скидки
CREATE POLICY "Admins can create discounts"
  ON public.user_discounts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Админы могут обновлять скидки
CREATE POLICY "Admins can update discounts"
  ON public.user_discounts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Админы могут удалять скидки
CREATE POLICY "Admins can delete discounts"
  ON public.user_discounts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 6. RLS POLICIES FOR PROMO_CODES
-- ============================================================================

-- Все могут просматривать активные промокоды (для проверки валидности)
CREATE POLICY "Everyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = true);

-- Админы видят все промокоды
CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Админы могут создавать промокоды
CREATE POLICY "Admins can create promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Админы могут обновлять промокоды
CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Админы могут удалять промокоды
CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 7. RLS POLICIES FOR ORDER_DISCOUNTS
-- ============================================================================

-- Пользователи видят скидки своих заказов
CREATE POLICY "Users can view discounts of their own orders"
  ON public.order_discounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_discounts.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Админы и менеджеры видят все скидки заказов
CREATE POLICY "Admins and managers can view all order discounts"
  ON public.order_discounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Пользователи могут добавлять скидки к своим заказам
CREATE POLICY "Users can add discounts to their own orders"
  ON public.order_discounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_discounts.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. TRIGGER: AUTO-ASSIGN FIRST ORDER DISCOUNT
-- Автоматически создаёт скидку 5% при регистрации нового пользователя
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_assign_first_order_discount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Добавляем скидку 5% на первый заказ
  INSERT INTO public.user_discounts (
    user_id,
    discount_type,
    discount_amount,
    description,
    is_active,
    valid_from,
    valid_until
  )
  VALUES (
    NEW.id,
    'first_order',
    5.00,
    'Скидка 5% на первый заказ',
    true,
    now(),
    now() + interval '30 days'  -- Действует 30 дней
  );

  RETURN NEW;
END;
$$;

-- Создаём триггер (после создания профиля, чтобы не было конфликтов)
CREATE TRIGGER trg_auto_discount_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_order_discount();

-- Комментарий
COMMENT ON FUNCTION public.auto_assign_first_order_discount() IS 'Автоматически добавляет скидку 5% на первый заказ при регистрации';

-- ============================================================================
-- 9. TRIGGER: UPDATE updated_at TIMESTAMP
-- ============================================================================

CREATE TRIGGER update_user_discounts_updated_at
  BEFORE UPDATE ON public.user_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 10. HELPER FUNCTION: GET BEST DISCOUNT FOR USER
-- Возвращает лучшую доступную скидку для пользователя
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_best_user_discount(p_user_id UUID)
RETURNS TABLE (
  discount_id UUID,
  discount_type VARCHAR(50),
  discount_amount NUMERIC(5,2),
  description TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ud.id,
    ud.discount_type,
    ud.discount_amount,
    ud.description
  FROM public.user_discounts ud
  WHERE ud.user_id = p_user_id
    AND ud.is_active = true
    AND ud.valid_from <= now()
    AND (ud.valid_until IS NULL OR ud.valid_until > now())
  ORDER BY ud.discount_amount DESC
  LIMIT 1;
END;
$$;

-- Комментарий
COMMENT ON FUNCTION public.get_best_user_discount(UUID) IS 'Возвращает лучшую активную скидку для пользователя';

-- ============================================================================
-- 11. HELPER FUNCTION: VALIDATE PROMO CODE
-- Проверяет валидность промокода
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code VARCHAR(50))
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount NUMERIC(5,2),
  message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.promo_codes;
BEGIN
  -- Находим промокод
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = p_code;

  -- Промокод не найден
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT false, 0.00::NUMERIC(5,2), 'Промокод не найден';
    RETURN;
  END IF;

  -- Промокод неактивен
  IF v_promo.is_active = false THEN
    RETURN QUERY SELECT false, 0.00::NUMERIC(5,2), 'Промокод неактивен';
    RETURN;
  END IF;

  -- Промокод ещё не начал действовать
  IF v_promo.valid_from > now() THEN
    RETURN QUERY SELECT false, 0.00::NUMERIC(5,2), 'Промокод ещё не активирован';
    RETURN;
  END IF;

  -- Промокод истёк
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN QUERY SELECT false, 0.00::NUMERIC(5,2), 'Промокод истёк';
    RETURN;
  END IF;

  -- Превышен лимит использований
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, 0.00::NUMERIC(5,2), 'Превышен лимит использований промокода';
    RETURN;
  END IF;

  -- Промокод валиден
  RETURN QUERY SELECT true, v_promo.discount_amount, 'Промокод валиден';
END;
$$;

-- Комментарий
COMMENT ON FUNCTION public.validate_promo_code(VARCHAR) IS 'Проверяет валидность промокода и возвращает размер скидки';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
