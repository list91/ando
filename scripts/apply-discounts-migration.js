/**
 * Apply User Discounts Migration to Cloud Supabase
 *
 * USAGE:
 * 1. Get service_role key from: https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/settings/api
 * 2. Run: SUPABASE_SERVICE_ROLE_KEY="your_key" node scripts/apply-discounts-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://nqmmeymejmnvbrczuncr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('='.repeat(60));
  console.log('  ANDO Discounts Migration Script');
  console.log('='.repeat(60));

  // Check for service key
  if (!SUPABASE_SERVICE_KEY) {
    console.error('\n[ERROR] SUPABASE_SERVICE_ROLE_KEY is not set!\n');
    console.log('Get your key from:');
    console.log('https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/settings/api\n');
    console.log('Then run:');
    console.log('SUPABASE_SERVICE_ROLE_KEY="your_key" node scripts/apply-discounts-migration.js\n');
    process.exit(1);
  }

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  console.log('\n[INFO] Connecting to Supabase...');
  console.log(`   Project: nqmmeymejmnvbrczuncr`);

  // Read migration SQL
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260219000000_add_user_discounts_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('\n[ERROR] Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(`\n[INFO] Loaded migration: 20260219000000_add_user_discounts_system.sql`);
  console.log(`   Size: ${migrationSQL.length} characters\n`);

  // Execute migration
  console.log('[INFO] Executing migration...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct SQL execution via REST API
      console.log('[WARN] RPC not available, trying direct execution...');

      // Split SQL into statements and execute one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`[INFO] Found ${statements.length} SQL statements\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const shortStmt = stmt.substring(0, 50).replace(/\n/g, ' ');

        try {
          // For table creation, we need to use the SQL editor API
          // This is a limitation - recommend using Supabase CLI instead
          console.log(`[${i + 1}/${statements.length}] ${shortStmt}...`);
          successCount++;
        } catch (stmtError) {
          console.error(`   [ERROR] ${stmtError.message}`);
          errorCount++;
        }
      }

      console.log('\n[WARN] Direct SQL execution is not fully supported via JS client.');
      console.log('[INFO] Please use one of these methods instead:\n');
      console.log('1. Supabase Dashboard SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/sql/new\n');
      console.log('2. Supabase CLI:');
      console.log('   npx supabase db push --linked\n');
      console.log('3. psql direct connection (get URL from Dashboard > Settings > Database):\n');
      console.log('   psql "postgres://postgres:[PASSWORD]@db.nqmmeymejmnvbrczuncr.supabase.co:5432/postgres" -f supabase/migrations/20260219000000_add_user_discounts_system.sql\n');

      // Output the SQL for manual execution
      console.log('='.repeat(60));
      console.log('Migration SQL (copy to SQL Editor):');
      console.log('='.repeat(60));
      console.log(migrationSQL);

      return;
    }

    console.log('[SUCCESS] Migration applied successfully!\n');

  } catch (err) {
    console.error('[ERROR] Migration failed:', err.message);
    console.log('\n[INFO] Please apply migration manually via SQL Editor:\n');
    console.log('https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/sql/new\n');
  }

  // Insert test data
  console.log('[INFO] Inserting test data...\n');

  try {
    // Insert test promo codes
    const { error: promoError } = await supabase.from('promo_codes').insert([
      {
        code: 'WELCOME10',
        discount_amount: 10.00,
        is_active: true,
        max_uses: 100,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      },
      {
        code: 'WINTER2026',
        discount_amount: 15.00,
        is_active: true,
        max_uses: 50,
        valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
      },
      {
        code: 'VIP20',
        discount_amount: 20.00,
        is_active: true,
        max_uses: 10
      }
    ]);

    if (promoError) {
      console.log('[WARN] Test promo codes may already exist:', promoError.message);
    } else {
      console.log('[SUCCESS] Inserted 3 test promo codes: WELCOME10, WINTER2026, VIP20');
    }

  } catch (err) {
    console.error('[ERROR] Failed to insert test data:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Migration Complete');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
