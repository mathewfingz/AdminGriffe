-- PostgreSQL initialization script for Sync Worker
-- This script sets up the necessary tables and configurations for CDC

-- Enable logical replication
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

-- Create extension for logical decoding
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sync metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_db VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    last_sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_db, table_name)
);

-- Create sync conflicts table
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    primary_key JSONB NOT NULL,
    conflict_events JSONB NOT NULL,
    resolution_strategy VARCHAR(20),
    winner_event_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sample tables for testing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    order_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_data JSONB;
BEGIN
    -- Prepare audit data
    audit_data := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000,
        'transaction_id', txid_current()
    );

    IF (TG_OP = 'DELETE') THEN
        audit_data := audit_data || jsonb_build_object(
            'old_data', row_to_json(OLD),
            'primary_key', jsonb_build_object('id', OLD.id)
        );
        
        -- Notify logical replication
        PERFORM pg_notify('audit_changes', audit_data::text);
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        audit_data := audit_data || jsonb_build_object(
            'old_data', row_to_json(OLD),
            'new_data', row_to_json(NEW),
            'primary_key', jsonb_build_object('id', NEW.id)
        );
        
        PERFORM pg_notify('audit_changes', audit_data::text);
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        audit_data := audit_data || jsonb_build_object(
            'new_data', row_to_json(NEW),
            'primary_key', jsonb_build_object('id', NEW.id)
        );
        
        PERFORM pg_notify('audit_changes', audit_data::text);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for sample tables
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_products_trigger ON products;
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;
CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create logical replication slot for CDC
SELECT pg_create_logical_replication_slot('audit_slot', 'wal2json');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_metadata_source_table ON sync_metadata(source_db, table_name);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON sync_conflicts(table_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Insert sample data
INSERT INTO users (email, name, status, metadata) VALUES
    ('john.doe@example.com', 'John Doe', 'active', '{"role": "admin", "preferences": {"theme": "dark"}}'),
    ('jane.smith@example.com', 'Jane Smith', 'active', '{"role": "user", "preferences": {"theme": "light"}}'),
    ('bob.wilson@example.com', 'Bob Wilson', 'inactive', '{"role": "user", "last_login": "2024-01-15"}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, price, category, tags, is_active) VALUES
    ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', ARRAY['laptop', 'computer', 'professional'], true),
    ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', ARRAY['mouse', 'wireless', 'ergonomic'], true),
    ('Coffee Mug', 'Ceramic coffee mug with logo', 12.99, 'Office', ARRAY['mug', 'coffee', 'ceramic'], true)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO audit_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO audit_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO audit_user;

-- Grant replication permissions
ALTER USER audit_user REPLICATION;

COMMIT;