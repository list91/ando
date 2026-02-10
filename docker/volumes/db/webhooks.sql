-- Webhooks and triggers schema
-- Required for Supabase database webhooks functionality

-- Create supabase_functions schema
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Grant permissions
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA supabase_functions TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA supabase_functions TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA supabase_functions TO postgres, service_role;

-- Create hooks table
CREATE TABLE IF NOT EXISTS supabase_functions.hooks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hook_table_id int NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);

-- Create migrations table
CREATE TABLE IF NOT EXISTS supabase_functions.migrations (
    version text PRIMARY KEY,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);

-- HTTP extension for webhooks (if available)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'http extension not available, webhooks will have limited functionality';
END
$$;

-- pg_net extension for async HTTP (if available)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension not available, async webhooks will not work';
END
$$;

-- Function to invoke edge functions
CREATE OR REPLACE FUNCTION supabase_functions.http_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = supabase_functions
AS $$
DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms int DEFAULT 5000;
BEGIN
    IF TG_ARGV[2] IS NOT NULL THEN
        headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NOT NULL THEN
        params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NOT NULL THEN
        timeout_ms = TG_ARGV[4]::int;
    END IF;

    CASE TG_OP
        WHEN 'INSERT' THEN
            payload = jsonb_build_object(
                'type', 'INSERT',
                'table', TG_TABLE_NAME,
                'schema', TG_TABLE_SCHEMA,
                'record', row_to_json(NEW)::jsonb,
                'old_record', null
            );
        WHEN 'UPDATE' THEN
            payload = jsonb_build_object(
                'type', 'UPDATE',
                'table', TG_TABLE_NAME,
                'schema', TG_TABLE_SCHEMA,
                'record', row_to_json(NEW)::jsonb,
                'old_record', row_to_json(OLD)::jsonb
            );
        WHEN 'DELETE' THEN
            payload = jsonb_build_object(
                'type', 'DELETE',
                'table', TG_TABLE_NAME,
                'schema', TG_TABLE_SCHEMA,
                'record', null,
                'old_record', row_to_json(OLD)::jsonb
            );
    END CASE;

    -- Try to use pg_net for async request
    BEGIN
        SELECT net.http_post(
            url := url,
            headers := headers,
            body := payload::text,
            timeout_milliseconds := timeout_ms
        ) INTO request_id;

        INSERT INTO supabase_functions.hooks (hook_table_id, hook_name, request_id)
        VALUES (TG_RELID, TG_NAME, request_id);
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: just log the hook attempt
        INSERT INTO supabase_functions.hooks (hook_table_id, hook_name)
        VALUES (TG_RELID, TG_NAME);
    END;

    RETURN NEW;
END;
$$;

-- Revoke execute from public, grant to service_role only
REVOKE ALL ON FUNCTION supabase_functions.http_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION supabase_functions.http_request() TO service_role;
