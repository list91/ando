# Scripts

This directory contains utility scripts for managing the ANDO JV project.

## populate-info-pages.mjs

Script to populate the `info_pages` table in Supabase with all 14 info page records.

### Prerequisites

You need to add the Supabase service role key to your `.env` file. The service role key is required because it bypasses Row Level Security (RLS) policies, allowing the script to insert data directly into the database.

### Setup

1. Get your service role key from Supabase:
   - Go to your Supabase project: https://supabase.com/dashboard/project/REDACTED_PROJECT_ID
   - Navigate to Settings > API
   - Copy the `service_role` key (NOT the `anon` key)
   - **IMPORTANT**: Keep this key secret! Never commit it to git or share it publicly.

2. Add the service role key to your `.env` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Usage

Run the script using npm:

```bash
npm run populate-info-pages
```

### What it does

The script will:
1. Connect to your Supabase database using the service role key
2. Upsert all 14 info page records into the `info_pages` table
3. If a record with the same `page_key` already exists, it will be updated
4. Display the results in the console

### Info Pages Included

The script populates the following pages:

1. **brand** - About the Brand (О Бренде)
2. **cooperation** - Cooperation (Сотрудничество)
3. **delivery** - Payment and Delivery (Оплата и доставка)
4. **returns** - Returns (Возврат)
5. **size-guide** - Size Guide (Гид по размерам)
6. **warranty** - Warranty (Гарантия)
7. **loyalty** - Loyalty Program (Программа лояльности)
8. **privacy** - Privacy Policy (Политика конфиденциальности)
9. **agreement** - User Agreement (Пользовательское соглашение)
10. **offer** - Public Offer (Публичная оферта)
11. **pd-consent** - Personal Data Consent (Согласие на обработку ПД)
12. **newsletter-consent** - Newsletter Consent (Согласие на рассылку)
13. **contacts** - Contacts (Контакты)
14. **stores** - Stores (Магазины)

### Troubleshooting

**Error: "new row violates row-level security policy"**
- This means you're using the anon key instead of the service role key
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in your `.env` file

**Error: "Missing Supabase credentials"**
- Check that your `.env` file exists and contains the required variables
- Make sure you're running the script from the project root directory

### Security Note

The service role key should NEVER be:
- Committed to version control (it's already in `.gitignore`)
- Used in frontend code
- Shared publicly or with untrusted parties

It should ONLY be used in:
- Backend services
- Admin scripts (like this one)
- Secure server environments
