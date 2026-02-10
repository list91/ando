-- JWT functions for Supabase
-- Required for authentication

-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install pgjwt extension
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin, service_role;

-- Set search path
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Function to get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- Function to get current user role from JWT
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

-- Function to get current user email from JWT
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

-- Function to get JWT claims
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  )
$$;
