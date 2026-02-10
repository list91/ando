#!/usr/bin/env node
/**
 * Create Admin User via Supabase GoTrue API
 *
 * Usage: npm run create-admin
 *
 * Creates admin user with credentials from docker/.env:
 *   ADMIN_EMAIL=admin@ando.local
 *   ADMIN_PASSWORD=Admin123!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Load environment from docker/.env
function loadEnv() {
  const envPath = path.join(projectRoot, 'docker', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return env;
}

async function createAdmin() {
  const env = loadEnv();

  const SUPABASE_URL = env.API_EXTERNAL_URL || 'http://localhost:8000';
  const SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY;
  const ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@ando.local';
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'Admin123!';

  console.log('Creating admin user...');
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log(`  Email: ${ADMIN_EMAIL}`);

  try {
    // Step 1: Create user via GoTrue Admin API
    const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Administrator'
        }
      })
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.text();
      if (error.includes('already been registered') || error.includes('already exists')) {
        console.log('User already exists, proceeding to assign admin role...');
      } else {
        throw new Error(`Signup failed: ${signupResponse.status} ${error}`);
      }
    } else {
      const userData = await signupResponse.json();
      console.log(`User created with ID: ${userData.id}`);
    }

    // Step 2: Get user ID
    const usersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=email.eq.${encodeURIComponent(ADMIN_EMAIL)}`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });

    if (!usersResponse.ok) {
      // Try alternate endpoint
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_by_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ email: ADMIN_EMAIL })
      });
    }

    // Step 3: Assign admin role via PostgREST
    // First get user from profiles
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(ADMIN_EMAIL)}&select=id`,
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY
        }
      }
    );

    let userId = null;
    if (profileResponse.ok) {
      const profiles = await profileResponse.json();
      if (profiles.length > 0) {
        userId = profiles[0].id;
      }
    }

    if (!userId) {
      // Wait a bit for trigger to create profile
      console.log('Waiting for profile to be created...');
      await new Promise(r => setTimeout(r, 2000));

      const retryResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(ADMIN_EMAIL)}&select=id`,
        {
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
          }
        }
      );

      if (retryResponse.ok) {
        const profiles = await retryResponse.json();
        if (profiles.length > 0) {
          userId = profiles[0].id;
        }
      }
    }

    if (!userId) {
      console.error('Could not find user ID. Check if user was created properly.');
      process.exit(1);
    }

    console.log(`Found user ID: ${userId}`);

    // Step 4: Insert admin role
    const roleResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        role: 'admin'
      })
    });

    if (!roleResponse.ok) {
      const error = await roleResponse.text();
      if (error.includes('duplicate key') || error.includes('already exists')) {
        console.log('Admin role already assigned.');
      } else {
        console.warn(`Warning: Could not assign admin role: ${error}`);
      }
    } else {
      console.log('Admin role assigned successfully!');
    }

    console.log('');
    console.log('=== Admin user ready ===');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('========================');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
