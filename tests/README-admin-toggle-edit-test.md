# Admin Panel Toggle & Edit Functionality Test

## Overview

This automated test verifies the admin panel's ability to toggle visibility and edit info pages without affecting delete functionality.

## Test File

`tests/admin-toggle-edit-test.spec.cjs`

## Running the Test

### Option 1: Using npm script

```bash
npm run test:toggle-edit
```

### Option 2: Direct execution

```bash
node tests/admin-toggle-edit-test.spec.cjs
```

### Option 3: With custom BASE_URL

```bash
BASE_URL=http://localhost:8083 node tests/admin-toggle-edit-test.spec.cjs
```

## Test Coverage

### Prerequisites
- Dev server running on http://localhost:5173 (or configured BASE_URL)
- Admin account credentials:
  - Email: khalezov89@gmail.com
  - Password: 123456

### Test Structure

#### TEST 1: Toggle Visibility ✓

**Steps:**
1. Login to admin panel
2. Navigate to `/admin/info-pages`
3. Find "О Бренде" page entry
4. Capture initial visibility state
5. Click toggle switch to change visibility (скрыта ↔ видна)
6. Wait for success toast notification
7. Capture new visibility state
8. Toggle back to original state
9. Verify restoration

**Validates:**
- Toggle switch functionality
- Success toast notifications
- State persistence
- Bidirectional toggle operations

#### TEST 2: Edit Functionality ✓

**Steps:**
1. Click edit button (pencil icon) on "О Бренде" page
2. Capture edit form screenshot
3. Modify title by adding " - TEST"
4. Click Save button
5. Wait for success toast
6. Verify updated title in list
7. Edit again to restore original title
8. Save and confirm restoration

**Validates:**
- Edit button interaction
- Form field population
- Title modification
- Save operation
- Data persistence
- Restoration capability

#### TEST 3: Verify on Public Page ✓

**Steps:**
1. Navigate to `/info` (public page)
2. Capture public page state
3. Click on "О Бренде" section
4. Verify content displays correctly

**Validates:**
- Public page accessibility
- Info section visibility
- Content rendering
- User-facing functionality

## Screenshots

All screenshots are saved to: `tests/screenshots/admin-toggle-edit-test/`

| Screenshot | Description |
|------------|-------------|
| `01-initial-state.png` | Initial admin info pages list |
| `02-before-toggle.png` | State before visibility toggle |
| `03-after-toggle.png` | State after visibility toggle |
| `04-toggle-restored.png` | Toggle restored to original state |
| `05-edit-dialog.png` | Edit form opened |
| `06-title-updated.png` | Title updated with " - TEST" |
| `07-title-restored.png` | Title restored to original |
| `08-public-info-page.png` | Public info page view |
| `09-brand-content-displayed.png` | "О Бренде" content displayed |

## Test Configuration

### Browser Settings
- **Browser:** Chromium (Playwright)
- **Headless:** No (visible UI for debugging)
- **Slow Motion:** 300ms (for visual clarity)
- **Viewport:** 1920x1080

### Timeouts
- Navigation: networkidle
- Element visibility: 1000-3000ms
- Toast notifications: 3000ms
- Page transitions: 1500-2000ms

## Important Notes

### Delete Functionality NOT Tested

**⚠ CRITICAL:** This test explicitly avoids testing delete functionality as requested. Only toggle visibility and edit operations are tested.

### Test Target

- **Target Page:** "О Бренде" (About Brand)
- **Admin Route:** `/admin/info-pages`
- **Public Route:** `/info`

### Selectors Used

The test uses multiple selector strategies for robustness:

1. **Card Selection:**
   - `h3:has-text("О Бренде") >> xpath=ancestor::div[contains(@class, "rounded")]`
   - Text-based h3 lookups with ancestor traversal

2. **Toggle Switch:**
   - `button[role="switch"]`
   - `[role="switch"]`

3. **Edit Button:**
   - `button:has(svg)` (first button with SVG icon)
   - Filters for edit button vs delete button

4. **Form Inputs:**
   - `input#title` (title input field)
   - `button:has-text("Сохранить")` (Save button)

5. **Toast Notifications:**
   - `text=Успешно`
   - `[role="status"]:has-text("Успешно")`

## Troubleshooting

### Common Issues

**Port Conflicts:**
If dev server is not on port 5173, update the BASE_URL in the test file or use environment variable:
```javascript
const BASE_URL = process.env.BASE_URL || 'http://localhost:8083';
```

**Login Failures:**
- Verify admin credentials are correct
- Check if auth endpoints are working
- Ensure database is properly seeded

**Element Not Found:**
- Screenshots are captured on errors to `ERROR-screenshot.png`
- Check console output for detailed selector information
- Verify page structure hasn't changed

**Toast Not Detected:**
- Toast may appear and disappear quickly
- Test continues even if toast isn't detected (non-blocking)

## Technical Details

### Test Framework
- **Playwright:** ^1.56.1
- **Runtime:** Node.js
- **Module Type:** CommonJS (.cjs)

### Page Structure

Based on `src/pages/admin/InfoPages.tsx`:

```
Card
└── CardContent
    └── div (flex container)
        ├── div (content)
        │   ├── h3 (title)
        │   ├── Switch (visibility toggle)
        │   └── p (content preview)
        └── div (buttons)
            ├── Button (Edit icon)
            └── Button (Delete icon - NOT TESTED)
```

### Edit Form Structure

Edit form appears inline at the top of the page:

```
Card
└── CardHeader
    └── CardTitle "Редактировать страницу"
└── CardContent
    ├── Input#page-key (disabled when editing)
    ├── Input#title
    ├── Textarea#content
    ├── Switch (is_visible)
    └── Buttons
        ├── Save button
        └── Cancel button
```

## Success Criteria

✅ All three tests pass without errors
✅ All 9 screenshots captured successfully
✅ Toggle operations complete and restore state
✅ Edit operations preserve data integrity
✅ Public page displays content correctly
✅ No delete operations executed

## Future Enhancements

Potential improvements for future versions:

- [ ] Add data validation tests
- [ ] Test multiple info pages simultaneously
- [ ] Verify database state changes
- [ ] Add content field editing tests
- [ ] Test order/priority changes
- [ ] Add accessibility checks
- [ ] Performance metrics capture
- [ ] Multi-browser testing

## Contact

For issues or questions about this test, refer to the main project documentation or development team.
