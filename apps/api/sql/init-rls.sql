-- =============================================
-- GRIFFE MULTI-TENANT DATABASE INITIALIZATION
-- Row Level Security (RLS) Configuration
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database user for the application
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'griffe_app') THEN
        CREATE ROLE griffe_app WITH LOGIN PASSWORD 'griffe_app_password';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE griffe_db TO griffe_app;
GRANT USAGE ON SCHEMA public TO griffe_app;
GRANT CREATE ON SCHEMA public TO griffe_app;

-- Function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUDIT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
DECLARE
    tenant_id TEXT;
    user_id TEXT;
    user_email TEXT;
    old_values JSONB;
    new_values JSONB;
BEGIN
    -- Get tenant context
    tenant_id := current_setting('app.current_tenant_id', true);
    user_id := current_setting('app.current_user_id', true);
    user_email := current_setting('app.current_user_email', true);
    
    -- Skip if no tenant context (system operations)
    IF tenant_id IS NULL OR tenant_id = '' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Prepare values based on operation
    IF TG_OP = 'DELETE' THEN
        old_values := to_jsonb(OLD);
        new_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSE -- INSERT
        old_values := NULL;
        new_values := to_jsonb(NEW);
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_logs (
        id,
        "tenantId",
        "tableName",
        operation,
        "recordId",
        "oldValues",
        "newValues",
        "userId",
        "userEmail",
        "ipAddress",
        "userAgent",
        "createdAt"
    ) VALUES (
        gen_random_uuid()::TEXT,
        tenant_id,
        TG_TABLE_NAME,
        TG_OP,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (OLD.id)::TEXT
            ELSE (NEW.id)::TEXT
        END,
        old_values,
        new_values,
        user_id,
        user_email,
        current_setting('app.client_ip', true),
        current_setting('app.user_agent', true),
        NOW()
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENABLE RLS ON TABLES (will be applied after migration)
-- =============================================

-- Note: These commands will be executed after Prisma migration
-- They are here for reference and manual execution if needed

/*
-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
CREATE POLICY tenant_isolation ON tenants
    FOR ALL
    TO griffe_app
    USING (id = current_tenant_id());

-- RLS Policies for users table
CREATE POLICY user_tenant_isolation ON users
    FOR ALL
    TO griffe_app
    USING ("tenantId" = current_tenant_id());

-- RLS Policies for categories table
CREATE POLICY category_tenant_isolation ON categories
    FOR ALL
    TO griffe_app
    USING ("tenantId" = current_tenant_id());

-- RLS Policies for products table
CREATE POLICY product_tenant_isolation ON products
    FOR ALL
    TO griffe_app
    USING ("tenantId" = current_tenant_id());

-- RLS Policies for orders table
CREATE POLICY order_tenant_isolation ON orders
    FOR ALL
    TO griffe_app
    USING ("tenantId" = current_tenant_id());

-- RLS Policies for order_items table (through order relationship)
CREATE POLICY order_item_tenant_isolation ON order_items
    FOR ALL
    TO griffe_app
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items."orderId" 
        AND orders."tenantId" = current_tenant_id()
    ));

-- RLS Policies for audit_logs table
CREATE POLICY audit_log_tenant_isolation ON audit_logs
    FOR ALL
    TO griffe_app
    USING ("tenantId" = current_tenant_id());

-- Create audit triggers for all tables
CREATE TRIGGER audit_trigger_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_categories
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_orders
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_trigger_order_items
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
*/

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO griffe_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO griffe_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO griffe_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO griffe_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO griffe_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO griffe_app;