#!/bin/bash
# Import backup data to production Supabase

BACKUP_DIR="C:/sts/projects/vault/projects/Ando/backups"
PROD_URL="http://83.166.246.253"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Import categories first (products depend on them)
echo "Importing categories..."
curl -s -X POST "${PROD_URL}/rest/v1/categories" \
  -H "apikey: ${API_KEY}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d @"${BACKUP_DIR}/categories.json"

echo ""
echo "Importing products..."
curl -s -X POST "${PROD_URL}/rest/v1/products" \
  -H "apikey: ${API_KEY}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d @"${BACKUP_DIR}/products.json"

echo ""
echo "Done!"
