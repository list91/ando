#!/usr/bin/env node
/**
 * Create Test User for E2E Testing
 * Creates a test user for LK-4 migration audit
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const TEST_EMAIL = process.env.TEST_EMAIL || 'test-lk4@test.local';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';
const TEST_NAME = process.env.TEST_NAME || 'LK4 Test User';

async function createTestUser() {
  console.log('Creating test user...');
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log(`  Email: ${TEST_EMAIL}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: TEST_NAME
        }
      })
    });

    const text = await response.text();

    if (!response.ok) {
      if (text.includes('already') || text.includes('exists')) {
        console.log('User already exists - OK');
        return { success: true, existing: true };
      }
      console.error('Error:', response.status, text);
      return { success: false, error: text };
    }

    const data = JSON.parse(text);
    console.log('User created successfully!');
    console.log(`  ID: ${data.id}`);

    return { success: true, user: data };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

createTestUser().then(result => {
  console.log('\n=== Test User Credentials ===');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}`);
  console.log('============================\n');

  if (!result.success) {
    process.exit(1);
  }
});
