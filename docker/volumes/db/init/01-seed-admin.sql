-- ============================================================================
-- ANDO Admin User Placeholder
-- Admin user will be created via GoTrue API after services start
-- ============================================================================

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Note: The handle_new_user() trigger will create profile and assign 'user' role
-- Admin role will be assigned via create-admin script after signup

DO $$
BEGIN
  RAISE NOTICE '=== Database initialized ===';
  RAISE NOTICE 'Run: npm run create-admin after services start';
  RAISE NOTICE '============================';
END $$;
