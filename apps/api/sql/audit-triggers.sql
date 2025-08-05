-- Audit Triggers for PostgreSQL
-- This file creates the audit infrastructure for tracking all database changes

-- Enable pgcrypto extension for digital signatures
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    db_engine TEXT NOT NULL DEFAULT 'PostgreSQL',
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    primary_key JSONB,
    diff_old JSONB,
    diff_new JSONB,
    executed_by TEXT,
    client_ip INET,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    signature BYTEA, -- Digital signature for immutability
    tenant_id UUID,
    session_id TEXT,
    application_name TEXT,
    transaction_id BIGINT DEFAULT txid_current(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_executed_at ON audit_log(executed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_executed_by ON audit_log(executed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_transaction_id ON audit_log(transaction_id);

-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_log%ROWTYPE;
    include_values BOOLEAN = TRUE;
    log_diffs BOOLEAN = TRUE;
    h_old JSONB;
    h_new JSONB;
    excluded_cols TEXT[] = ARRAY[]::TEXT[];
BEGIN
    -- Check if auditing is enabled for this table
    IF TG_ARGV[0] IS NOT NULL THEN
        excluded_cols = string_to_array(TG_ARGV[0], ',');
    END IF;

    -- Initialize audit record
    audit_row = ROW(
        nextval('audit_log_id_seq'), -- id
        'PostgreSQL', -- db_engine
        TG_TABLE_SCHEMA::TEXT, -- schema_name
        TG_TABLE_NAME::TEXT, -- table_name
        TG_OP::TEXT, -- operation
        NULL, -- primary_key (will be set below)
        NULL, -- diff_old (will be set below)
        NULL, -- diff_new (will be set below)
        session_user::TEXT, -- executed_by
        inet_client_addr(), -- client_ip
        NOW(), -- executed_at
        NULL, -- signature (will be set below)
        COALESCE(current_setting('app.current_tenant_id', TRUE)::UUID, NULL), -- tenant_id
        current_setting('application_name', TRUE), -- session_id
        current_setting('application_name', TRUE), -- application_name
        txid_current(), -- transaction_id
        NOW(), -- created_at
        NOW() -- updated_at
    );

    -- Handle different operations
    IF TG_OP = 'UPDATE' THEN
        -- Get primary key from NEW record
        audit_row.primary_key = to_jsonb(NEW) - excluded_cols;
        
        -- Calculate differences
        h_old = to_jsonb(OLD) - excluded_cols;
        h_new = to_jsonb(NEW) - excluded_cols;
        
        audit_row.diff_old = h_old;
        audit_row.diff_new = h_new;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Get primary key from OLD record
        audit_row.primary_key = to_jsonb(OLD) - excluded_cols;
        audit_row.diff_old = to_jsonb(OLD) - excluded_cols;
        audit_row.diff_new = NULL;
        
    ELSIF TG_OP = 'INSERT' THEN
        -- Get primary key from NEW record
        audit_row.primary_key = to_jsonb(NEW) - excluded_cols;
        audit_row.diff_old = NULL;
        audit_row.diff_new = to_jsonb(NEW) - excluded_cols;
    END IF;

    -- Generate digital signature for immutability
    -- This creates a hash of the audit data for integrity verification
    audit_row.signature = digest(
        concat(
            audit_row.db_engine,
            audit_row.schema_name,
            audit_row.table_name,
            audit_row.operation,
            COALESCE(audit_row.primary_key::TEXT, ''),
            COALESCE(audit_row.diff_old::TEXT, ''),
            COALESCE(audit_row.diff_new::TEXT, ''),
            audit_row.executed_by,
            audit_row.executed_at::TEXT,
            audit_row.transaction_id::TEXT
        ),
        'sha256'
    );

    -- Insert audit record
    INSERT INTO audit_log VALUES (audit_row.*);

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the original operation
        RAISE WARNING 'Audit trigger failed: %', SQLERRM;
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit trigger for a table
CREATE OR REPLACE FUNCTION create_audit_trigger(target_table TEXT, excluded_cols TEXT DEFAULT '')
RETURNS VOID AS $$
DECLARE
    trigger_name TEXT;
BEGIN
    trigger_name = 'audit_trigger_' || replace(target_table, '.', '_');
    
    EXECUTE format('
        CREATE TRIGGER %I
        AFTER INSERT OR UPDATE OR DELETE ON %s
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_function(%L)',
        trigger_name, target_table, excluded_cols
    );
    
    RAISE NOTICE 'Created audit trigger % for table %', trigger_name, target_table;
END;
$$ LANGUAGE plpgsql;

-- Function to remove audit trigger from a table
CREATE OR REPLACE FUNCTION remove_audit_trigger(target_table TEXT)
RETURNS VOID AS $$
DECLARE
    trigger_name TEXT;
BEGIN
    trigger_name = 'audit_trigger_' || replace(target_table, '.', '_');
    
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, target_table);
    
    RAISE NOTICE 'Removed audit trigger % from table %', trigger_name, target_table;
END;
$$ LANGUAGE plpgsql;

-- Function to verify audit integrity
CREATE OR REPLACE FUNCTION verify_audit_integrity(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 day',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    audit_id BIGINT,
    is_valid BOOLEAN,
    expected_signature BYTEA,
    actual_signature BYTEA
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.signature = digest(
            concat(
                a.db_engine,
                a.schema_name,
                a.table_name,
                a.operation,
                COALESCE(a.primary_key::TEXT, ''),
                COALESCE(a.diff_old::TEXT, ''),
                COALESCE(a.diff_new::TEXT, ''),
                a.executed_by,
                a.executed_at::TEXT,
                a.transaction_id::TEXT
            ),
            'sha256'
        ) as is_valid,
        digest(
            concat(
                a.db_engine,
                a.schema_name,
                a.table_name,
                a.operation,
                COALESCE(a.primary_key::TEXT, ''),
                COALESCE(a.diff_old::TEXT, ''),
                COALESCE(a.diff_new::TEXT, ''),
                a.executed_by,
                a.executed_at::TEXT,
                a.transaction_id::TEXT
            ),
            'sha256'
        ) as expected_signature,
        a.signature as actual_signature
    FROM audit_log a
    WHERE a.executed_at BETWEEN start_date AND end_date
    ORDER BY a.id;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for existing tables
-- Note: Add your tables here as needed
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Get all user tables (excluding system tables and audit_log itself)
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'audit_log'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'information_schema%'
    LOOP
        -- Create audit trigger for each table
        PERFORM create_audit_trigger(
            table_record.schemaname || '.' || table_record.tablename,
            'created_at,updated_at' -- Exclude timestamp columns from auditing
        );
    END LOOP;
END $$;

-- Create a view for easier audit log querying
CREATE OR REPLACE VIEW audit_trail AS
SELECT 
    id,
    db_engine,
    schema_name,
    table_name,
    operation,
    primary_key,
    diff_old,
    diff_new,
    executed_by,
    client_ip,
    executed_at,
    tenant_id,
    session_id,
    application_name,
    transaction_id,
    CASE 
        WHEN operation = 'INSERT' THEN 'Created'
        WHEN operation = 'UPDATE' THEN 'Modified'
        WHEN operation = 'DELETE' THEN 'Deleted'
        ELSE operation
    END as action_description,
    CASE 
        WHEN diff_old IS NOT NULL AND diff_new IS NOT NULL THEN
            (SELECT jsonb_object_agg(key, value) 
             FROM jsonb_each(diff_new) 
             WHERE value != COALESCE((diff_old->key), 'null'::jsonb))
        ELSE NULL
    END as changes_only
FROM audit_log
ORDER BY executed_at DESC;

-- Grant permissions
GRANT SELECT ON audit_log TO PUBLIC;
GRANT SELECT ON audit_trail TO PUBLIC;

-- Create RLS policies for audit_log if RLS is enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'audit_log' AND c.relrowsecurity = true
    ) THEN
        -- Enable RLS on audit_log
        ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for tenant isolation
        CREATE POLICY audit_tenant_isolation ON audit_log
            FOR ALL TO PUBLIC
            USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', TRUE)::UUID, tenant_id));
    END IF;
END $$;

-- Log successful initialization
INSERT INTO audit_log (
    db_engine, schema_name, table_name, operation, 
    executed_by, executed_at, diff_new
) VALUES (
    'PostgreSQL', 'public', 'audit_system', 'INITIALIZE',
    'system', NOW(), 
    '{"message": "Audit system initialized successfully", "version": "1.0.0"}'::jsonb
);

RAISE NOTICE 'Audit system initialized successfully';