#!/usr/bin/env node

/**
 * Runner script for admin toggle and edit test
 *
 * Usage:
 *   node tests/run-toggle-edit-test.cjs
 *   npm run test:toggle-edit
 */

const { spawn } = require('child_process');
const path = require('path');

const testFile = path.join(__dirname, 'admin-toggle-edit-test.spec.cjs');

console.log('===========================================');
console.log('ADMIN TOGGLE & EDIT FUNCTIONALITY TEST');
console.log('===========================================\n');
console.log('Starting test execution...\n');

const testProcess = spawn('node', [testFile], {
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ Test execution completed successfully');
  } else {
    console.log(`\n✗ Test execution failed with code ${code}`);
  }
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('\n✗ Failed to start test:', error.message);
  process.exit(1);
});
