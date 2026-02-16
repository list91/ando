# Bug Fixes Verification Test

Автоматизированный тест для проверки двух критических исправлений багов в проекте Ando.

## Файл теста

`tests/screenshot-tests/verify-bugfixes.mjs`

## Что проверяется

### Test 1: Zoom Magnifier (Лупа увеличения)

**Проблема:** Лупа должна УВЕЛИЧИВАТЬ (zoom IN) изображение, а не уменьшать.

**Проверка:**
- Открывает страницу продукта: http://localhost:8080/product/t-shirts2
- Наводит курсор на изображение продукта
- Проверяет появление magnifier overlay
- Извлекает значение `background-size` из inline стилей
- **Критерий успеха:** background-size должен быть > 1.5x от размера контейнера
- **Ожидаемый результат:** 2.5x увеличение (zoomLevel = 2.5)

**Результат теста:**
```
✓ PASS: Zoom IN confirmed (2.50x zoom)
Background-size: 1440px (контейнер: 576px)
```

### Test 2: Sidebar Alignment (Выравнивание сайдбара)

**Проблема:** Логотип и вертикальный текст должны быть центрированы по горизонтали.

**Проверка:**
- Открывает главную страницу: http://localhost:8080/
- Проверяет CSS классы и стили элементов сайдбара
- **Критерий успеха:**
  - Logo container имеет класс `justify-center`
  - Vertical text parent имеет класс `items-center`

**Результат теста:**
```
✓ PASS: Center alignment confirmed via CSS classes
Logo: flex justify-center
Vertical text parent: flex flex-col items-center
```

## Запуск теста

```bash
cd C:\sts\projects\ando
node tests/screenshot-tests/verify-bugfixes.mjs
```

## Вывод

Тест создаёт:
- **Скриншоты:** `tests/screenshots-output/bugfix-verification/`
  - `zoom-before-hover.png` - продукт до наведения
  - `zoom-with-magnifier.png` - продукт с активной лупой
  - `sidebar-full-page.png` - главная страница полностью
  - `sidebar-area.png` - только область сайдбара (200px)

- **JSON отчёт:** `test-results.json`
  - Timestamp выполнения
  - Статус каждого теста (PASS/FAIL/MANUAL_CHECK)
  - Детальные наблюдения
  - Пути к скриншотам
  - Ошибки (если есть)

## Статусы тестов

- `PASS` - тест прошёл успешно
- `FAIL` - тест не прошёл
- `PARTIAL_PASS` - частичный успех (требует внимания)
- `VISUAL_PASS` - визуально корректно, но автопроверка не сработала
- `MANUAL_CHECK` - требуется ручная проверка скриншотов
- `ERROR` - произошла ошибка при выполнении

## Технические детали

### Селекторы

**Zoom test:**
- Product image: `img[loading="eager"]`
- Magnifier overlay: `div.pointer-events-none.rounded-full`

**Sidebar test:**
- Sidebar container: `aside.w-[200px]`
- Logo link: `aside a[aria-label*="главную"]`
- Vertical text image: `img[alt*="FEEL THE MOMENT"]`

### Таймауты

- Page load: `domcontentloaded` (не `networkidle` для скорости)
- Initial wait: 2000ms для загрузки изображений
- Magnifier wait: 2000ms для появления
- Mouse hover stabilization: 300ms

### Viewport

Desktop: 1920x1080 (для проверки desktop-only функций)

## Результат последнего прогона

```
✓ ALL TESTS PASSED - Bug fixes verified!

Test 1: Zoom Magnifier Enhancement - PASS
  ✓ Magnifier zooms IN (2.50x enlargement)

Test 2: Sidebar Center Alignment - PASS
  ✓ Center alignment confirmed via CSS classes
```

## Интеграция в CI/CD

Тест можно добавить в pipeline:

```json
{
  "scripts": {
    "test:bugfixes": "node tests/screenshot-tests/verify-bugfixes.mjs"
  }
}
```

Перед запуском убедитесь, что:
1. Dev-сервер запущен на порту 8080
2. База данных Supabase доступна
3. Есть тестовый продукт с ID `t-shirts2`
