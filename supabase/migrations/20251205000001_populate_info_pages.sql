-- Populate info_pages table with all 14 sections
-- This migration uses INSERT ... ON CONFLICT to safely re-run

INSERT INTO public.info_pages (page_key, title, content, display_order, is_visible, created_at, updated_at)
VALUES
  (
    'brand',
    'О Бренде',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p>ANDO JV — это бренд, который рождается из страсти к качеству и уважения к деталям. Мы создаём одежду, которая не просто носится, а живёт вместе с вами, становясь частью вашего дня и отражением вашего стиля.</p>
      <p>Наша философия «Feel the moment» говорит о главном: жизнь состоит из моментов. Каждый из них важен. Мы верим, что одежда должна помогать вам полностью ощутить эти моменты — будь то спокойный день дома, встреча с друзьями или важное событие. ANDO JV создаёт вещи, которые позволяют вам быть собой и наслаждаться каждым мгновением.</p>
    </div>',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    'cooperation',
    'Сотрудничество',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p>Мы открыты для сотрудничества и партнёрства. Если вы заинтересованы в совместных проектах, рекламе или другой форме сотрудничества с ANDO JV, мы будем рады услышать от вас.</p>
      <p class="font-semibold text-foreground">Свяжитесь с нами:</p>
      <div class="space-y-2">
        <p><span class="font-medium">Электронная почта:</span> info@andojv.ru</p>
        <p><span class="font-medium">Телефон:</span> +7 (966) 753-31-48</p>
      </div>
    </div>',
    2,
    true,
    NOW(),
    NOW()
  ),
  (
    'delivery',
    'Оплата и доставка',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <div class="space-y-3">
        <div>
          <p class="font-semibold text-foreground mb-2">Стоимость доставки</p>
          <p>Доставка по России осуществляется бесплатно при любой сумме заказа.</p>
        </div>
        <div>
          <p class="font-semibold text-foreground mb-2">Способы доставки</p>
          <div class="space-y-2 ml-3">
            <p><span class="font-medium">CDEK:</span> 1-3 дня в Санкт-Петербурге и Москве, до 7 дней по России</p>
            <p><span class="font-medium">Dostavista:</span> доставка на следующий день в Санкт-Петербурге и Москве</p>
            <p><span class="font-medium">EMS:</span> международная доставка (7+ дней, стоимость 1500 рублей)</p>
          </div>
        </div>
        <div>
          <p class="font-semibold text-foreground mb-2">Способы оплаты</p>
          <p>Мы принимаем платежи через CloudPayments: карты VISA, MasterCard и Мир.</p>
        </div>
      </div>
    </div>',
    3,
    true,
    NOW(),
    NOW()
  ),
  (
    'returns',
    'Возврат',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Сроки и условия возврата</p>
      <p>Вы можете вернуть товар в течение 14 дней с момента получения.</p>
      <p class="font-semibold text-foreground mt-3">Условия возврата</p>
      <div class="space-y-2 ml-3">
        <p>• Товар не должен быть использован</p>
        <p>• Сохранены все бирки и ярлыки</p>
        <p>• Наличие чека или подтверждения покупки</p>
        <p>• Товар в надлежащем состоянии</p>
      </div>
      <p class="font-semibold text-foreground mt-3">Возврат средств</p>
      <p>Возврат денежных средств на ваш счёт осуществляется в течение 10 рабочих дней после получения возвращаемого товара нашей компанией.</p>
    </div>',
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    'size-guide',
    'Гид по размерам',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground mb-3">Таблица размеров</p>
      <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-2 px-2 font-medium text-foreground">Размер</th>
              <th class="text-left py-2 px-2 font-medium text-foreground">Грудь (см)</th>
              <th class="text-left py-2 px-2 font-medium text-foreground">Талия (см)</th>
              <th class="text-left py-2 px-2 font-medium text-foreground">Бёдра (см)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border/50">
              <td class="py-2 px-2 font-medium text-foreground">S</td>
              <td class="py-2 px-2">82-86</td>
              <td class="py-2 px-2">62-66</td>
              <td class="py-2 px-2">88-92</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2 px-2 font-medium text-foreground">M</td>
              <td class="py-2 px-2">86-90</td>
              <td class="py-2 px-2">66-70</td>
              <td class="py-2 px-2">92-96</td>
            </tr>
            <tr>
              <td class="py-2 px-2 font-medium text-foreground">L</td>
              <td class="py-2 px-2">90-94</td>
              <td class="py-2 px-2">70-74</td>
              <td class="py-2 px-2">96-100</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground/80 mt-3">Если вы сомневаетесь в выборе размера, пожалуйста, свяжитесь с нами по электронной почте или телефону.</p>
    </div>',
    5,
    true,
    NOW(),
    NOW()
  ),
  (
    'warranty',
    'Гарантия',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p>ANDO JV гарантирует качество всех своих товаров. Мы уверены в каждой вещи, которую выпускаем, и готовы отстаивать это качество.</p>
      <p class="font-semibold text-foreground">Гарантийный период</p>
      <p>Гарантия качества действует в течение 14 дней с момента получения товара. За этот период вы можете обнаружить любые дефекты изготовления.</p>
      <p class="font-semibold text-foreground mt-3">Гарантия не распространяется на</p>
      <div class="space-y-2 ml-3">
        <p>• Физический износ при нормальном использовании</p>
        <p>• Повреждения, вызванные неправильным уходом</p>
        <p>• Потерю товара при доставке (контактируйте перевозчика)</p>
        <p>• Дефекты, вызванные ремонтом третьих лиц</p>
      </div>
      <p class="text-xs text-muted-foreground/80 mt-3">Если вы обнаружили дефект, пожалуйста, свяжитесь с нами как можно скорее с фотографиями товара и описанием проблемы.</p>
    </div>',
    6,
    true,
    NOW(),
    NOW()
  ),
  (
    'loyalty',
    'Программа лояльности',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Скоро в магазине</p>
      <p>Мы разрабатываем специальную программу лояльности для наших постоянных клиентов. Она будет включать эксклюзивные предложения, ранний доступ к новым коллекциям и специальные скидки.</p>
      <p class="mt-3">Подпишитесь на наш информационный рассылку, чтобы узнать первыми о запуске программы лояльности и других новостях от ANDO JV.</p>
    </div>',
    7,
    true,
    NOW(),
    NOW()
  ),
  (
    'privacy',
    'Политика конфиденциальности',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Раздел в разработке</p>
      <p>Полный текст Политики конфиденциальности находится в процессе разработки. Он будет содержать информацию о том, как мы собираем, используем и защищаем ваши персональные данные.</p>
      <p>Если у вас есть вопросы о конфиденциальности, пожалуйста, свяжитесь с нами по адресу info@andojv.ru</p>
    </div>',
    8,
    true,
    NOW(),
    NOW()
  ),
  (
    'agreement',
    'Пользовательское соглашение',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Раздел в разработке</p>
      <p>Полный текст Пользовательского соглашения находится в процессе разработки. Он определяет правила использования нашего сайта и взаимоотношения между ANDO JV и её клиентами.</p>
      <p>Спасибо за понимание.</p>
    </div>',
    9,
    true,
    NOW(),
    NOW()
  ),
  (
    'offer',
    'Публичная оферта',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Раздел в разработке</p>
      <p>Полный текст Публичной оферты находится в процессе разработки. Этот документ будет содержать условия купли-продажи товаров через интернет-магазин ANDO JV.</p>
      <p>Спасибо за понимание.</p>
    </div>',
    10,
    true,
    NOW(),
    NOW()
  ),
  (
    'pd-consent',
    'Согласие на обработку ПД',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Раздел в разработке</p>
      <p>Полный текст Согласия на обработку персональных данных находится в процессе разработки. Данный документ будет содержать информацию о целях и способах обработки ваших персональных данных в соответствии с законодательством РФ.</p>
      <p>Спасибо за понимание.</p>
    </div>',
    11,
    true,
    NOW(),
    NOW()
  ),
  (
    'newsletter-consent',
    'Согласие на рассылку',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Раздел в разработке</p>
      <p>Полный текст Согласия на рассылку находится в процессе разработки. Подписываясь на нашу рассылку, вы даёте согласие на получение информации о новых коллекциях, специальных предложениях и важных новостях от ANDO JV.</p>
      <p>Спасибо за понимание.</p>
    </div>',
    12,
    true,
    NOW(),
    NOW()
  ),
  (
    'contacts',
    'Контакты',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground mb-3">Свяжитесь с нами</p>
      <div class="space-y-3">
        <div>
          <p class="font-medium text-foreground">Электронная почта</p>
          <p><a href="mailto:info@andojv.ru" class="text-primary hover:underline">info@andojv.ru</a></p>
        </div>
        <div>
          <p class="font-medium text-foreground">Телефон</p>
          <p><a href="tel:+79667533148" class="text-primary hover:underline">+7 (966) 753-31-48</a></p>
        </div>
        <div>
          <p class="font-medium text-foreground">Часы работы</p>
          <p>Пн-Пт: 10:00-19:00 (Московское время)</p>
        </div>
      </div>
      <p class="font-semibold text-foreground mt-4">Юридический адрес</p>
      <p>192522, Санкт-Петербург, ул. Карпинского, д. 32</p>
      <p class="font-semibold text-foreground mt-3">Фактический адрес</p>
      <p>191025, Санкт-Петербург, Невский проспект, д. 148</p>
    </div>',
    13,
    true,
    NOW(),
    NOW()
  ),
  (
    'stores',
    'Магазины',
    '<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p class="font-semibold text-foreground">Где купить ANDO JV</p>
      <p>На данный момент ANDO JV можно приобрести только через наш интернет-магазин с доставкой по России и миру.</p>
      <div class="mt-4 p-3 bg-secondary/30 rounded-lg">
        <p class="font-semibold text-foreground mb-2">Скоро</p>
        <div class="space-y-2">
          <p><span class="font-medium">Санкт-Петербург:</span> Невский проспект, д. 148 — открытие в ближайшее время</p>
          <p><span class="font-medium">Москва:</span> Планируется открытие магазина в 2025 году</p>
        </div>
      </div>
      <p class="mt-3">Следите за обновлениями в наших социальных сетях и на сайте, чтобы узнать точные даты открытия.</p>
    </div>',
    14,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (page_key) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  display_order = EXCLUDED.display_order,
  is_visible = EXCLUDED.is_visible,
  updated_at = NOW();
