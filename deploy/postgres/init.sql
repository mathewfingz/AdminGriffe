-- PostgreSQL Initialization Script for Audit System
-- AdminGriffe - Sistema de Auditoría Integral

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    db_engine VARCHAR(20) NOT NULL CHECK (db_engine IN ('postgres', 'mysql', 'mongodb')),
    schema_name VARCHAR(100),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
    primary_key JSONB,
    diff_old JSONB,
    diff_new JSONB,
    executed_by VARCHAR(100),
    client_ip INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    transaction_id VARCHAR(100),
    executed_at TIMESTAMPTZ DEFAULT now(),
    signature BYTEA, -- Digital signature for immutability
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT audit_log_tenant_time_idx UNIQUE (tenant_id, id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit.audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit.audit_log (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit.audit_log (operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_executed_at ON audit.audit_log (executed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_executed_by ON audit.audit_log (executed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_composite ON audit.audit_log (tenant_id, table_name, executed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_primary_key ON audit.audit_log USING GIN (primary_key);
CREATE INDEX IF NOT EXISTS idx_audit_log_metadata ON audit.audit_log USING GIN (metadata);

-- Create sync status table
CREATE TABLE IF NOT EXISTS audit.sync_status (
    id BIGSERIAL PRIMARY KEY,
    source_engine VARCHAR(20) NOT NULL,
    target_engine VARCHAR(20) NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_sync_position JSONB,
    sync_lag_ms INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'stopped')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create conflict resolution table
CREATE TABLE IF NOT EXISTS audit.sync_conflicts (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    source_engine VARCHAR(20) NOT NULL,
    target_engine VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    primary_key JSONB NOT NULL,
    source_data JSONB,
    target_data JSONB,
    conflict_type VARCHAR(50) NOT NULL,
    resolution_strategy VARCHAR(50),
    resolved_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'manual', 'failed')),
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for sync tables
CREATE INDEX IF NOT EXISTS idx_sync_status_engines ON audit.sync_status (source_engine, target_engine);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_tenant ON audit.sync_conflicts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON audit.sync_conflicts (status);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON audit.sync_conflicts (table_name);

-- Create compliance export table
CREATE TABLE IF NOT EXISTS audit.compliance_exports (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    export_type VARCHAR(50) NOT NULL, -- 'sox', 'gdpr', 'hipaa', etc.
    date_range_start TIMESTAMPTZ NOT NULL,
    date_range_end TIMESTAMPTZ NOT NULL,
    filters JSONB DEFAULT '{}',
    file_path TEXT,
    file_size BIGINT,
    record_count INTEGER,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit.audit_log%ROWTYPE;
    pk_columns TEXT[];
    pk_values JSONB := '{}';
    col_name TEXT;
    old_data JSONB := '{}';
    new_data JSONB := '{}';
BEGIN
    -- Get primary key columns
    SELECT array_agg(a.attname)
    INTO pk_columns
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID AND i.indisprimary;

    -- Build primary key values
    IF pk_columns IS NOT NULL THEN
        FOR col_name IN SELECT unnest(pk_columns) LOOP
            IF TG_OP = 'DELETE' THEN
                pk_values := pk_values || jsonb_build_object(col_name, (to_jsonb(OLD)->>col_name));
            ELSE
                pk_values := pk_values || jsonb_build_object(col_name, (to_jsonb(NEW)->>col_name));
            END IF;
        END LOOP;
    END IF;

    -- Set audit record values
    audit_row.tenant_id := COALESCE(current_setting('app.current_tenant_id', true), 'default');
    audit_row.db_engine := 'postgres';
    audit_row.schema_name := TG_TABLE_SCHEMA;
    audit_row.table_name := TG_TABLE_NAME;
    audit_row.operation := TG_OP;
    audit_row.primary_key := pk_values;
    audit_row.executed_by := COALESCE(current_setting('app.current_user_id', true), session_user);
    audit_row.client_ip := COALESCE(inet_client_addr(), '127.0.0.1');
    audit_row.session_id := COALESCE(current_setting('app.session_id', true), 'unknown');
    audit_row.transaction_id := txid_current()::TEXT;

    -- Set old and new data based on operation
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        audit_row.diff_old := old_data;
        audit_row.diff_new := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
        audit_row.diff_old := NULL;
        audit_row.diff_new := new_data;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        audit_row.diff_old := old_data;
        audit_row.diff_new := new_data;
    END IF;

    -- Insert audit record
    INSERT INTO audit.audit_log (
        tenant_id, db_engine, schema_name, table_name, operation,
        primary_key, diff_old, diff_new, executed_by, client_ip,
        session_id, transaction_id
    ) VALUES (
        audit_row.tenant_id, audit_row.db_engine, audit_row.schema_name,
        audit_row.table_name, audit_row.operation, audit_row.primary_key,
        audit_row.diff_old, audit_row.diff_new, audit_row.executed_by,
        audit_row.client_ip, audit_row.session_id, audit_row.transaction_id
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create business tables for testing
CREATE SCHEMA IF NOT EXISTS business;

-- Users table
CREATE TABLE IF NOT EXISTS business.users (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS business.products (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS business.orders (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
    user_id INTEGER REFERENCES business.users(id),
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMPTZ DEFAULT now(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS business.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES business.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES business.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit triggers for business tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON business.users
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON business.products
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON business.orders
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_order_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON business.order_items
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Create logical replication publication for CDC
CREATE PUBLICATION audit_publication FOR ALL TABLES;

-- Create replication slot for Debezium
SELECT pg_create_logical_replication_slot('debezium_slot', 'pgoutput');

-- Create indexes for business tables
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON business.users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON business.users (email);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON business.products (tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON business.products (category);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON business.orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON business.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON business.orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON business.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON business.order_items (product_id);

-- Insert sample data for testing
INSERT INTO business.users (name, email, password_hash, role) VALUES
('Admin User', 'admin@test.com', crypt('admin123', gen_salt('bf')), 'admin'),
('John Doe', 'john@test.com', crypt('password123', gen_salt('bf')), 'user'),
('Jane Smith', 'jane@test.com', crypt('password123', gen_salt('bf')), 'user'),
('Bob Wilson', 'bob@test.com', crypt('password123', gen_salt('bf')), 'manager')
ON CONFLICT (email) DO NOTHING;

INSERT INTO business.products (name, description, price, category, stock) VALUES
('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', 50),
('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', 200),
('Office Chair', 'Comfortable ergonomic office chair', 299.99, 'Furniture', 25),
('Coffee Mug', 'Ceramic coffee mug with company logo', 12.99, 'Accessories', 100),
('Notebook Set', 'Set of 3 premium notebooks', 24.99, 'Stationery', 75)
ON CONFLICT DO NOTHING;

-- Create views for audit reporting
CREATE OR REPLACE VIEW audit.audit_summary AS
SELECT 
    tenant_id,
    table_name,
    operation,
    COUNT(*) as operation_count,
    DATE_TRUNC('hour', executed_at) as hour_bucket
FROM audit.audit_log
WHERE executed_at >= NOW() - INTERVAL '24 hours'
GROUP BY tenant_id, table_name, operation, DATE_TRUNC('hour', executed_at)
ORDER BY hour_bucket DESC;

CREATE OR REPLACE VIEW audit.sync_health AS
SELECT 
    source_engine,
    target_engine,
    status,
    sync_lag_ms,
    last_sync_at,
    CASE 
        WHEN last_sync_at < NOW() - INTERVAL '5 minutes' THEN 'stale'
        WHEN sync_lag_ms > 1000 THEN 'lagging'
        WHEN status = 'error' THEN 'error'
        ELSE 'healthy'
    END as health_status
FROM audit.sync_status;

-- Grant permissions
GRANT USAGE ON SCHEMA audit TO audit_user;
GRANT USAGE ON SCHEMA business TO audit_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO audit_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA business TO audit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO audit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA business TO audit_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO audit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA business GRANT ALL ON TABLES TO audit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON SEQUENCES TO audit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA business GRANT ALL ON SEQUENCES TO audit_user;

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION audit.set_tenant_context(tenant_id TEXT, user_id TEXT DEFAULT NULL, session_id TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id, false);
    IF user_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', user_id, false);
    END IF;
    IF session_id IS NOT NULL THEN
        PERFORM set_config('app.session_id', session_id, false);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get audit trail for a specific record
CREATE OR REPLACE FUNCTION audit.get_audit_trail(
    p_table_name TEXT,
    p_primary_key JSONB
)
RETURNS TABLE (
    id BIGINT,
    operation VARCHAR(10),
    diff_old JSONB,
    diff_new JSONB,
    executed_by VARCHAR(100),
    executed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.operation,
        al.diff_old,
        al.diff_new,
        al.executed_by,
        al.executed_at
    FROM audit.audit_log al
    WHERE al.table_name = p_table_name
    AND al.primary_key = p_primary_key
    ORDER BY al.executed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for audit statistics
CREATE OR REPLACE FUNCTION audit.get_audit_statistics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    table_name VARCHAR(100),
    operation VARCHAR(10),
    count BIGINT,
    avg_per_hour NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.table_name,
        al.operation,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / EXTRACT(EPOCH FROM (p_end_date - p_start_date)) * 3600, 2) as avg_per_hour
    FROM audit.audit_log al
    WHERE al.executed_at BETWEEN p_start_date AND p_end_date
    GROUP BY al.table_name, al.operation
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;