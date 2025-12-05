# Admin Info Pages - Playwright Test

## Overview
Automated test for verifying the admin panel info pages management functionality.

## Test Details

### Test File
- **Main test:** `tests/admin-info-pages.spec.cjs`
- **Runner wrapper:** `tests/run-admin-info-test.cjs`
- **NPM script:** `npm run test:admin-info-pages`

### Test Coverage

The test performs the following steps:

1. **Authentication**
   - Navigates to `/auth`
   - Logs in with admin credentials:
     - Email: khalezov89@gmail.com
     - Password: 123456
   - Verifies successful login

2. **Admin Navigation**
   - Navigates to `/admin/info-pages`
   - Waits for page to load completely

3. **Visual Verification**
   - Takes full-page screenshot of info pages list
   - Saves to: `tests/screenshots/admin-info-pages/01-info-pages-list.png`

4. **Page Count Verification**
   - Attempts to count info pages using multiple selector strategies
   - Expected count: 14 info pages
   - Note: Manual verification via screenshot may be needed

5. **Edit Functionality Test**
   - Searches for "О Бренде" page
   - Clicks edit button
   - Takes screenshot of edit dialog
   - Saves to: `tests/screenshots/admin-info-pages/02-edit-dialog.png`

### Expected Info Pages (14 total)

According to the project requirements (ТЗ - ANDO Site.md):

1. О бренде (About Brand)
2. Сотрудничество (Cooperation)
3. Оплата и доставка (Payment and Delivery)
4. Возврат (Returns)
5. Гид по размерам (Size Guide)
6. Гарантия (Warranty)
7. Программа лояльности (Loyalty Program)
8. Политика конфиденциальности (Privacy Policy)
9. Пользовательское соглашение (User Agreement)
10. Публичная оферта (Public Offer)
11. Согласие на обработку ПД (Personal Data Processing Consent)
12. Согласие на рассылку (Newsletter Consent)
13. Контакты (Contacts)
14. Магазины (Stores)

## Running the Test

### Prerequisites
1. Development server must be running on port 5173 (or configure BASE_URL)
2. Database should have admin user configured
3. Info pages should be populated in the database

### Commands

```bash
# Start dev server (if not already running)
npm run dev

# Run the test (default port 5173)
npm run test:admin-info-pages

# Run with custom port
BASE_URL=http://localhost:8082 node tests/run-admin-info-test.cjs
```

### Test Configuration

The test uses environment variable for base URL:
- **Default:** `http://localhost:5173`
- **Override:** Set `BASE_URL` environment variable

Example in `run-admin-info-test.cjs`:
```javascript
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:8082';
```

## Test Behavior

### Browser Settings
- **Headless:** `false` (visible browser for debugging)
- **Slow Motion:** 500ms (for visual verification)
- **Viewport:** 1920x1080 (desktop resolution)

### Timeouts
- Network idle waits for complete page load
- 1-2 second delays between actions for stability
- 5 second delay before browser closes (for review)

## Output

### Screenshots Directory
```
tests/screenshots/admin-info-pages/
├── 01-info-pages-list.png       # Full list of info pages
├── 02-edit-dialog.png           # Edit dialog for selected page
├── 03-edit-dialog-closeup.png   # Close-up of dialog (if available)
└── error-screenshot.png         # Screenshot on test failure
```

### Console Output
The test provides detailed console output including:
- Step-by-step progress
- Success/warning indicators (✓/⚠/✗)
- URL verification
- Element detection status
- Final test results summary

## Troubleshooting

### Common Issues

**1. Connection Refused Error**
```
✗ ОШИБКА: page.goto: net::ERR_CONNECTION_REFUSED
```
**Solution:** Ensure dev server is running on the correct port

**2. Login Failed**
```
✗ Ошибка входа - все еще на странице авторизации
```
**Solution:** Verify admin credentials in the database

**3. Page Count Mismatch**
```
⚠ Найдено X страниц (ожидалось 14)
```
**Solution:** Check database for missing info pages, run populate script if needed:
```bash
npm run populate-info-pages
```

**4. Edit Button Not Found**
```
⚠ Не удалось найти кнопку редактирования
```
**Solution:** UI may have changed, update selectors in test file

## Test Maintenance

### Updating Selectors
If the UI changes, update the selectors in `admin-info-pages.spec.cjs`:

```javascript
// Page count selectors (line ~70)
const selectors = [
  'table tbody tr',
  '[data-page-item]',
  // Add new selectors as needed
];

// Edit button selectors (line ~110)
const editButtonSelectors = [
  'tr:has-text("О Бренде") button:has-text("Редактировать")',
  // Add new selectors as needed
];
```

### Changing Test Parameters

**Admin Credentials:**
```javascript
await page.fill('input[type="email"]', 'your-email@example.com');
await page.fill('input[type="password"]', 'your-password');
```

**Target Page for Edit Test:**
Change `"О Бренде"` to any other info page title

**Screenshot Settings:**
```javascript
await page.screenshot({
  path: path.join(screenshotsDir, 'custom-name.png'),
  fullPage: true  // or false for viewport only
});
```

## Integration with Testing Protocol

This test follows the testing protocol from the vault:
- Uses Playwright for E2E testing
- Follows existing test patterns in the project
- Provides visual verification via screenshots
- Includes detailed logging for debugging
- Uses slow-motion mode for demonstration

## Related Files

- **Project Requirements:** `C:\sts\projects\vault\Ando\ТЗ - ANDO Site.md`
- **Test Directory:** `C:\Users\Дарья\qq\ando\tests\`
- **Admin Panel:** `src/pages/Admin/InfoPages.tsx` (likely)
- **Info Page Model:** Database table `info_pages`

## Notes

- The test uses `headless: false` to allow visual verification
- Screenshots are automatically saved regardless of pass/fail
- The browser stays open for 5 seconds after test completion
- Automatic page counting may fail if UI structure is different from expected
- Manual verification via screenshots is recommended for first run
