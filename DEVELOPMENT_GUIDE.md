# Руководство по локальной разработке ANDO JV

## Содержание
1. [Требования](#требования)
2. [Первоначальная настройка](#первоначальная-настройка)
3. [Запуск локального сервера](#запуск-локального-сервера)
4. [Работа с кодом](#работа-с-кодом)
5. [Тестирование изменений](#тестирование-изменений)
6. [E2E тестирование](#e2e-тестирование)
7. [Сборка проекта](#сборка-проекта)
8. [Деплой на продакшен](#деплой-на-продакшен)

---

## Требования

- **Node.js** v18+ (рекомендуется v20+)
- **npm** v9+ или **bun**
- Текстовый редактор (VS Code, Cursor и т.д.)

Проверить версии:
```bash
node -v
npm -v
```

---

## Первоначальная настройка

### 1. Перейти в папку проекта
```bash
cd C:/Users/Дарья/qq/ando
```

### 2. Установить зависимости
```bash
npm install
```

### 3. Проверить наличие .env файла
Файл `.env` должен содержать:
```env
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="..."

# FTP Deploy Configuration (для деплоя)
FTP_HOST="..."
FTP_USER="..."
FTP_PASSWORD="..."
FTP_PORT=21
FTP_REMOTE_PATH="/www/andojv.com/"
```

---

## Запуск локального сервера

### Основная команда
```bash
npm run dev
```

### Что происходит:
- Запускается Vite dev server
- Сайт доступен по адресу: **http://localhost:8080**
- Включен Hot Module Replacement (HMR) - изменения применяются мгновенно без перезагрузки
- PWA работает в dev-режиме

### Остановка сервера
Нажать `Ctrl+C` в терминале

---

## Работа с кодом

### Структура проекта
```
C:/Users/Дарья/qq/ando/
├── src/
│   ├── components/     # React компоненты
│   │   ├── ui/         # UI компоненты (shadcn/ui)
│   │   ├── CookieBanner.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── pages/          # Страницы приложения
│   │   ├── Info.tsx    # Страница "Инфо"
│   │   ├── Catalog.tsx
│   │   └── ...
│   ├── hooks/          # React хуки
│   ├── contexts/       # React контексты
│   ├── lib/            # Утилиты
│   └── App.tsx         # Главный компонент
├── public/             # Статические файлы
├── tests/              # E2E тесты
├── screenshots/        # Скриншоты тестов
├── .env                # Переменные окружения
├── package.json        # Зависимости и скрипты
└── vite.config.ts      # Конфигурация Vite
```

### Основные файлы для редактирования

| Задача | Файл |
|--------|------|
| Cookie баннер | `src/components/CookieBanner.tsx` |
| Страница "Инфо" | `src/pages/Info.tsx` |
| Боковое меню | `src/components/AppSidebar.tsx` |
| Подвал сайта | `src/components/Footer.tsx` |
| Роутинг | `src/App.tsx` |

### Пример: добавление новой секции в Info

1. Открыть `src/pages/Info.tsx`
2. Найти список секций:
```tsx
const sections = [
  { key: 'delivery', label: 'Доставка' },
  { key: 'returns', label: 'Возврат' },
  // добавить новую секцию здесь
];
```
3. Добавить обработчик для новой секции в JSX

---

## Тестирование изменений

### Локальная проверка в браузере

1. Запустить dev-сервер: `npm run dev`
2. Открыть http://localhost:8080
3. Проверить изменения
4. При необходимости очистить localStorage в DevTools:
   - F12 → Application → Local Storage → localhost:8080 → Очистить

### Проверка конкретных страниц

| Страница | URL |
|----------|-----|
| Главная | http://localhost:8080/ |
| Каталог | http://localhost:8080/catalog |
| Инфо (доставка) | http://localhost:8080/info?section=delivery |
| Инфо (соглашение) | http://localhost:8080/info?section=agreement |
| Инфо (политика) | http://localhost:8080/info?section=privacy |

### Проверка Cookie баннера

Cookie баннер показывается только если в localStorage нет `cookie-consent`.

**Сбросить Cookie баннер:**
1. Открыть DevTools (F12)
2. Application → Local Storage → http://localhost:8080
3. Удалить ключ `cookie-consent`
4. Обновить страницу

---

## E2E тестирование

### Установка Playwright (если не установлен)
```bash
npm install --save-dev playwright
npx playwright install chromium
```

### Запуск E2E теста
```bash
npm run test:e2e
```

### Что делает тест `tests/cookie-privacy-link.spec.cjs`:
1. Открывает сайт (по умолчанию http://andojv.com)
2. Находит Cookie баннер
3. Кликает на ссылку "политикой конфиденциальности"
4. Проверяет, что открылась правильная страница
5. Сохраняет скриншоты в `screenshots/`

### Тестирование локальной версии

Изменить URL в тесте:
```javascript
// tests/cookie-privacy-link.spec.cjs
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
```

### Запуск теста с headless=true (без окна браузера)

Изменить в тесте:
```javascript
const browser = await chromium.launch({
  headless: true,  // было false
  slowMo: 0        // было 500
});
```

### Просмотр скриншотов
```bash
ls screenshots/
```
Скриншоты:
- `01-homepage-with-cookie-banner.png` - главная со всплывающим баннером
- `02-cookie-banner-closeup.png` - крупный план баннера
- `03-after-privacy-link-click.png` - страница после клика
- `04-agreement-section-closeup.png` - секция соглашения

---

## Сборка проекта

### Создать production сборку
```bash
npm run build
```

### Результат:
- Папка `dist/` содержит готовые к деплою файлы
- Оптимизированный JavaScript и CSS
- PWA Service Worker

### Предпросмотр production сборки
```bash
npm run preview
```
Сайт будет доступен на http://localhost:4173

### Проверка сборки перед деплоем
```bash
npm run build && npm run preview
```

---

## Деплой на продакшен

### Команда деплоя
```bash
npm run deploy
```

### Что происходит:
1. Выполняется `npm run build` (сборка)
2. Файлы из `dist/` загружаются по FTP на сервер

### Конфигурация деплоя
Настройки FTP хранятся в `.env`:
```env
FTP_HOST="REDACTED_FTP_HOST"
FTP_USER="..."
FTP_PASSWORD="..."
FTP_PORT=21
FTP_REMOTE_PATH="/www/andojv.com/"
```

### Продакшен URL
После деплоя сайт доступен на: **http://andojv.com**

---

## Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запустить dev-сервер |
| `npm run build` | Собрать проект |
| `npm run preview` | Предпросмотр сборки |
| `npm run deploy` | Деплой на продакшен |
| `npm run test:e2e` | Запустить E2E тесты |
| `npm run lint` | Проверить код ESLint |

---

## Типичный рабочий процесс

```
1. Запустить dev-сервер:     npm run dev
2. Внести изменения в код
3. Проверить в браузере:     http://localhost:8080
4. (Опционально) E2E тест:   npm run test:e2e
5. Собрать и проверить:      npm run build && npm run preview
6. Деплой:                   npm run deploy
7. Проверить на проде:       http://andojv.com
```
