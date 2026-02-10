-- Realtime schema and configuration
-- Required for Supabase Realtime service

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant permissions
GRANT USAGE ON SCHEMA _realtime TO postgres, supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO postgres, supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _realtime TO postgres, supabase_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA _realtime TO postgres, supabase_admin;

-- Create realtime admin role permissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
        GRANT USAGE ON SCHEMA _realtime TO supabase_realtime_admin;
        GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO supabase_realtime_admin;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA _realtime TO supabase_realtime_admin;
        GRANT ALL ON ALL ROUTINES IN SCHEMA _realtime TO supabase_realtime_admin;
    END IF;
END
$$;

-- Enable replication for realtime
ALTER SYSTEM SET wal_level = 'logical';

-- Create publication for realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- Alter publication to include all tables
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete, truncate');

-- Realtime subscription tracking table
CREATE TABLE IF NOT EXISTS _realtime.subscription (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters jsonb DEFAULT '[]'::jsonb NOT NULL,
    claims jsonb NOT NULL,
    claims_role text GENERATED ALWAYS AS (claims ->> 'role') STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT subscription_check CHECK (char_length(claims_role) > 0)
);

-- Remove invalid constraint if exists and create correct one
ALTER TABLE _realtime.subscription DROP CONSTRAINT IF EXISTS subscription_check;
ALTER TABLE _realtime.subscription ADD CONSTRAINT subscription_check CHECK (char_length(claims_role) > 0);

-- Create index
CREATE INDEX IF NOT EXISTS ix_realtime_subscription_entity ON _realtime.subscription (entity);

-- Grant access
GRANT ALL ON _realtime.subscription TO postgres, supabase_admin;

-- Function to broadcast changes
CREATE OR REPLACE FUNCTION _realtime.broadcast_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_notify(
        'realtime:broadcast',
        json_build_object(
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'type', TG_OP,
            'record', row_to_json(NEW),
            'old_record', row_to_json(OLD)
        )::text
    );
    RETURN NEW;
END;
$$;
