#!/usr/bin/env node
/**
 * ANDO JV Data Import Script
 *
 * Imports CSV backup data into local Supabase instance.
 *
 * Usage:
 *   node scripts/import-data.mjs
 *
 * Prerequisites:
 *   - Local Supabase running (docker compose up)
 *   - CSV files in vault/projects/Ando/backups/dump-lovable/
 *
 * Environment:
 *   - Reads from docker/.env for Supabase credentials
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  supabaseUrl: 'http://localhost:8000',
  csvDir: path.resolve(projectRoot, '../vault/projects/Ando/backups/dump-lovable'),
  envPath: path.resolve(projectRoot, 'docker/.env'),
};

// Import order matters due to foreign key constraints
const IMPORT_ORDER = [
  { file: 'categories-export', table: 'categories' },
  { file: 'products-export', table: 'products' },
  { file: 'product_images-export', table: 'product_images' },
  { file: 'colors-export', table: 'colors' },
  { file: 'hero_slides-export', table: 'hero_slides' },
  { file: 'about_page-export', table: 'about_page' },
  { file: 'info_pages-export', table: 'info_pages' },
  { file: 'lookbook_seasons-export', table: 'lookbook_seasons' },
  { file: 'lookbook_images-export', table: 'lookbook_images' },
  { file: 'site_settings-export', table: 'site_settings' },
  // User-related tables (optional, may have FK issues)
  // { file: 'profiles-export', table: 'profiles' },
  // { file: 'user_roles-export', table: 'user_roles' },
  // { file: 'orders-export', table: 'orders' },
  // { file: 'order_items-export', table: 'order_items' },
  // { file: 'favorites-export', table: 'favorites' },
];

/**
 * Read .env file and parse it
 */
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }
  return env;
}

/**
 * Find CSV file matching the pattern
 */
function findCsvFile(csvDir, filePattern) {
  if (!fs.existsSync(csvDir)) {
    throw new Error(`CSV directory not found: ${csvDir}`);
  }
  const files = fs.readdirSync(csvDir);
  const match = files.find(f => f.startsWith(filePattern) && f.endsWith('.csv'));
  if (!match) {
    return null;
  }
  return path.join(csvDir, match);
}

/**
 * Read and parse CSV file
 */
function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false, // Don't auto-cast dates, keep as strings
  });
  return records;
}

/**
 * Transform record values for Supabase
 */
function transformRecord(record, table) {
  const transformed = {};

  for (const [key, value] of Object.entries(record)) {
    // Skip empty values
    if (value === '' || value === null || value === undefined) {
      continue;
    }

    // Handle arrays (PostgreSQL format: {value1,value2})
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      try {
        // Check if it's a JSONB object
        if (value.startsWith('{"') || value.startsWith('{\"')) {
          transformed[key] = JSON.parse(value);
        } else {
          // PostgreSQL array format
          const arrayContent = value.slice(1, -1);
          if (arrayContent === '') {
            transformed[key] = [];
          } else {
            transformed[key] = arrayContent.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          }
        }
      } catch {
        transformed[key] = value;
      }
    }
    // Handle JSON objects
    else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        transformed[key] = JSON.parse(value);
      } catch {
        transformed[key] = value;
      }
    }
    // Handle booleans
    else if (value === 'true' || value === 't') {
      transformed[key] = true;
    }
    else if (value === 'false' || value === 'f') {
      transformed[key] = false;
    }
    else {
      transformed[key] = value;
    }
  }

  return transformed;
}

/**
 * Import data into Supabase via REST API
 */
async function importToSupabase(table, records, serviceKey) {
  const url = `${CONFIG.supabaseUrl}/rest/v1/${table}`;

  // Use upsert to handle existing data
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to import ${table}: ${response.status} ${error}`);
  }

  return records.length;
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('ANDO JV Data Import');
  console.log('='.repeat(60));

  // Load environment
  console.log('\n[1/4] Loading environment...');
  const env = loadEnv(CONFIG.envPath);
  const serviceKey = env.SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SERVICE_ROLE_KEY not found in environment');
  }
  console.log('  Environment loaded from:', CONFIG.envPath);

  // Check Supabase connection
  console.log('\n[2/4] Checking Supabase connection...');
  try {
    const healthCheck = await fetch(`${CONFIG.supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
      },
    });
    if (!healthCheck.ok) {
      throw new Error(`Health check failed: ${healthCheck.status}`);
    }
    console.log('  Supabase is running at:', CONFIG.supabaseUrl);
  } catch (error) {
    console.error('  ERROR: Cannot connect to Supabase');
    console.error('  Make sure to run: docker compose up -d');
    throw error;
  }

  // Find and validate CSV files
  console.log('\n[3/4] Scanning CSV files...');
  console.log('  Directory:', CONFIG.csvDir);

  const importTasks = [];
  for (const { file, table } of IMPORT_ORDER) {
    const csvPath = findCsvFile(CONFIG.csvDir, file);
    if (csvPath) {
      const records = readCsv(csvPath);
      importTasks.push({ table, csvPath, records });
      console.log(`  Found: ${path.basename(csvPath)} (${records.length} records)`);
    } else {
      console.log(`  Skip: ${file} (not found)`);
    }
  }

  if (importTasks.length === 0) {
    console.log('\nNo CSV files to import.');
    return;
  }

  // Import data
  console.log('\n[4/4] Importing data...');
  let totalImported = 0;
  let errors = [];

  for (const { table, csvPath, records } of importTasks) {
    try {
      const transformedRecords = records.map(r => transformRecord(r, table));
      const count = await importToSupabase(table, transformedRecords, serviceKey);
      console.log(`  OK: ${table} - ${count} records imported`);
      totalImported += count;
    } catch (error) {
      console.log(`  FAIL: ${table} - ${error.message}`);
      errors.push({ table, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total records imported: ${totalImported}`);
  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const { table, error } of errors) {
      console.log(`  - ${table}: ${error}`);
    }
  }
  console.log('\nTo access Supabase Studio: http://localhost:3001');
  console.log('To access API: http://localhost:8000');
}

// Run
main().catch(error => {
  console.error('\nFATAL ERROR:', error.message);
  process.exit(1);
});
