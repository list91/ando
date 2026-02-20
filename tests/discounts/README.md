# Тесты системы персональных скидок

## Обзор

Данная директория содержит E2E тесты для системы персональных скидок проекта Ando.

### Структура тестов

```
tests/discounts/
├── user-discounts.spec.ts    # E2E тесты пользовательских сценариев
├── admin-discounts.spec.ts   # E2E тесты админ-панели
└── README.md                  # Этот файл

src/lib/__tests__/
└── discount.test.ts           # Unit тесты утилит для работы со скидками

src/hooks/__tests__/
└── useUserDiscounts.test.ts   # Unit тесты React hooks

src/components/__tests__/
└── DiscountCard.test.tsx      # Компонентные тесты DiscountCard
```

## Запуск тестов

### Unit тесты (Vitest)

```bash
# Запустить все unit тесты
npm test

# Запустить с покрытием
npm run test:coverage

# Запустить в watch режиме
npm test -- --watch

# Запустить только тесты скидок
npm test -- discount
```

### E2E тесты (Playwright)

```bash
# Запустить все E2E тесты скидок
npx playwright test tests/discounts/

# Запустить только пользовательские сценарии
npx playwright test tests/discounts/user-discounts.spec.ts

# Запустить только админские тесты
npx playwright test tests/discounts/admin-discounts.spec.ts

# Запустить в UI режиме
npx playwright test --ui

# Запустить с headed browser (видимый браузер)
npx playwright test tests/discounts/ --headed
```

## Сценарии тестирования

### Пользовательские сценарии (user-discounts.spec.ts)

1. **auto-discount-5-percent** - Автоматическая скидка 5% при регистрации
2. **discount-in-cart** - Применение скидки в корзине
3. **mobile-discounts-responsive** - Адаптивность на мобильных устройствах
4. **admin-assign-discount** - Админ назначает скидку, пользователь видит
5. **discount-card-displays-correctly** - Корректное отображение DiscountCard
6. **empty-discounts-state** - Отображение пустого состояния

### Админские сценарии (admin-discounts.spec.ts)

1. **admin-create-discount** - Создание скидки
2. **admin-edit-discount** - Редактирование скидки
3. **admin-delete-discount** - Удаление скидки с подтверждением
4. **admin-filters** - Фильтрация скидок (тип, статус)
5. **admin-bulk-actions** - Массовые операции
6. **admin-search-discounts** - Поиск скидок
7. **non-admin-cannot-access** - Проверка доступа (только админы)

## Переменные окружения

Для E2E тестов необходимо настроить `.env`:

```env
BASE_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!@#
SUPABASE_ANON_KEY=your_anon_key
```

## Предварительные требования

### Для E2E тестов

1. **Запущенный dev-сервер**:
   ```bash
   npm run dev
   ```

2. **База данных с тестовыми данными**:
   - Пользователь: `test@example.com` / `Test123!@#`
   - Админ: `admin@example.com` / `Admin123!@#`
   - Хотя бы 1 скидка в таблице `user_discounts`
   - Хотя бы 1 товар в каталоге

3. **Playwright установлен**:
   ```bash
   npx playwright install
   ```

### Для unit тестов

Не требуется — все зависимости моки, тесты изолированы.

## Отчёты

### Playwright HTML отчёт

После запуска E2E тестов:

```bash
npx playwright show-report
```

### Vitest coverage отчёт

После запуска с `--coverage`:

```bash
# Откроется в браузере
open coverage/index.html
```

## Известные ограничения

1. **E2E тесты зависят от данных в БД** — если нет пользователей/скидок, некоторые тесты будут пропущены (⚠️ warnings)
2. **Мобильные тесты требуют скриншоты** — создаются в `tests/screenshots/`
3. **Некоторые UI элементы могут отличаться** — тесты проверяют несколько селекторов (data-testid, class, text)

## CI/CD

Для запуска в CI (GitHub Actions):

```yaml
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: |
    npm run dev &
    npx playwright test tests/discounts/
  env:
    BASE_URL: http://localhost:5173
```

## Покрытие

Целевые метрики покрытия:

- **Утилиты (lib/discount.ts)**: 95%+
- **Hooks (useUserDiscounts.ts)**: 90%+
- **Компоненты (DiscountCard.tsx)**: 85%+

## Отладка

### Дебаг E2E тестов

```bash
# Пауза перед каждым действием
npx playwright test --debug

# Замедленный режим
npx playwright test --slow-mo=1000

# Сохранить trace
npx playwright test --trace on
```

### Дебаг unit тестов

```bash
# Vitest UI
npm test -- --ui

# Один тест
npm test -- -t "should calculate correct discounted price"
```

## Добавление новых тестов

### Новый E2E сценарий

1. Открыть `user-discounts.spec.ts` или `admin-discounts.spec.ts`
2. Добавить `test()` в соответствующий `describe` блок
3. Следовать паттерну: Arrange → Act → Assert

### Новый unit тест

1. Открыть соответствующий файл в `__tests__/`
2. Добавить `it()` в соответствующий `describe` блок
3. Использовать mock factories для данных

## Поддержка

При возникновении проблем:

1. Проверить логи: `npx playwright test --reporter=list`
2. Проверить скриншоты: `tests/screenshots/`
3. Проверить trace: `npx playwright show-trace trace.zip`

## Примеры

### Запустить конкретный тест

```bash
# E2E
npx playwright test -g "auto-discount-5-percent"

# Unit
npm test -- -t "calculateDiscountedPrice"
```

### Параллельный запуск

```bash
# E2E (по умолчанию параллельно)
npx playwright test tests/discounts/ --workers=4

# Unit (по умолчанию параллельно)
npm test
```
