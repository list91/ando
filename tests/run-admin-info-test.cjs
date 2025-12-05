// Wrapper script to run admin info pages test with custom BASE_URL
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:8082';
require('./admin-info-pages.spec.cjs');
