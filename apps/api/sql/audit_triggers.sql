-- =====================================================
-- Sistema de Auditoría Automática PostgreSQL
-- AdminGriffe - Triggers para todas las tablas
-- =====================================================

-- Función genérica de auditoría con firma digital
CREATE OR REPLACE FUNCTION audit_trigger_function() 
RETURNS TRIGGER AS $$
DECLARE
    audit_data JSONB;
    old_data JSONB;
    new_data JSONB;
    primary_key_data JSONB;
    signature_data TEXT;
    table_pk TEXT;
BEGIN
    -- Obtener clave primaria de la tabla
    SELECT string_agg(column_name, ',') INTO table_pk
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND kcu.table_name = TG_TABLE_NAME 
        AND kcu.table_schema = TG_TABLE_SCHEMA;

    -- Preparar datos según operación
    IF (TG_OP = 'DELETE') THEN
        old_data := row_to_json(OLD)::jsonb;
        new_data := NULL;
        primary_key_data := jsonb_build_object('id', OLD.id);
        audit_data := jsonb_build_object(
            'operation', TG_OP,
            'table_name', TG_TABLE_NAME,
            'schema_name', TG_TABLE_SCHEMA,
            'old_data', old_data,
            'new_data', new_data,
            'primary_key', primary_key_data,
            'timestamp', EXTRACT(EPOCH FROM NOW()),
            'user_id', current_setting('app.current_user_id', true),
            'tenant_id', current_setting('app.current_tenant_id', true)
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := row_to_json(OLD)::jsonb;
        new_data := row_to_json(NEW)::jsonb;
        primary_key_data := jsonb_build_object('id', NEW.id);
        audit_data := jsonb_build_object(
            'operation', TG_OP,
            'table_name', TG_TABLE_NAME,
            'schema_name', TG_TABLE_SCHEMA,
            'old_data', old_data,
            'new_data', new_data,
            'primary_key', primary_key_data,
            'timestamp', EXTRACT(EPOCH FROM NOW()),
            'user_id', current_setting('app.current_user_id', true),
            'tenant_id', current_setting('app.current_tenant_id', true)
        );
    ELSIF (TG_OP = 'INSERT') THEN
        old_data := NULL;
        new_data := row_to_json(NEW)::jsonb;
        primary_key_data := jsonb_build_object('id', NEW.id);
        audit_data := jsonb_build_object(
            'operation', TG_OP,
            'table_name', TG_TABLE_NAME,
            'schema_name', TG_TABLE_SCHEMA,
            'old_data', old_data,
            'new_data', new_data,
            'primary_key', primary_key_data,
            'timestamp', EXTRACT(EPOCH FROM NOW()),
            'user_id', current_setting('app.current_user_id', true),
            'tenant_id', current_setting('app.current_tenant_id', true)
        );
    END IF;

    -- Generar firma digital para inmutabilidad
    signature_data := encode(
        hmac(audit_data::text, current_setting('app.audit_secret', true), 'sha256'),
        'hex'
    );

    -- Insertar en audit_log
    INSERT INTO audit_log (
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
        signature,
        tenant_id,
        event_data
    ) VALUES (
        'postgresql',
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        TG_OP,
        primary_key_data,
        old_data,
        new_data,
        current_setting('app.current_user_id', true),
        inet_client_addr(),
        NOW(),
        decode(signature_data, 'hex'),
        current_setting('app.current_tenant_id', true),
        audit_data
    );

    -- Emitir notificación para CDC
    PERFORM pg_notify('audit_event', audit_data::text);

    -- Retornar según operación
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Crear triggers para todas las tablas principales
-- =====================================================

-- Trigger para tabla users
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para tabla tenants
DROP TRIGGER IF EXISTS audit_tenants_trigger ON tenants;
CREATE TRIGGER audit_tenants_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para tabla categories
DROP TRIGGER IF EXISTS audit_categories_trigger ON categories;
CREATE TRIGGER audit_categories_trigger
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para tabla products
DROP TRIGGER IF EXISTS audit_products_trigger ON products;
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para tabla orders
DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;
CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para tabla order_items
DROP TRIGGER IF EXISTS audit_order_items_trigger ON order_items;
CREATE TRIGGER audit_order_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- Función para verificar integridad de auditoría
-- =====================================================

CREATE OR REPLACE FUNCTION verify_audit_integrity(
    p_table_name TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 day',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    audit_id BIGINT,
    table_name TEXT,
    operation TEXT,
    executed_at TIMESTAMPTZ,
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    rec RECORD;
    expected_signature TEXT;
    audit_secret TEXT;
BEGIN
    -- Obtener secret de auditoría
    audit_secret := current_setting('app.audit_secret', true);
    
    FOR rec IN 
        SELECT al.id, al.table_name, al.operation, al.executed_at, 
               al.signature, al.event_data
        FROM audit_log al
        WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
            AND al.executed_at BETWEEN p_start_date AND p_end_date
        ORDER BY al.executed_at
    LOOP
        -- Calcular firma esperada
        expected_signature := encode(
            hmac(rec.event_data::text, audit_secret, 'sha256'),
            'hex'
        );
        
        -- Verificar integridad
        IF encode(rec.signature, 'hex') = expected_signature THEN
            audit_id := rec.id;
            table_name := rec.table_name;
            operation := rec.operation;
            executed_at := rec.executed_at;
            is_valid := TRUE;
            error_message := NULL;
        ELSE
            audit_id := rec.id;
            table_name := rec.table_name;
            operation := rec.operation;
            executed_at := rec.executed_at;
            is_valid := FALSE;
            error_message := 'Signature mismatch - possible tampering detected';
        END IF;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Función para configurar contexto de auditoría
-- =====================================================

CREATE OR REPLACE FUNCTION set_audit_context(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_audit_secret TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id, false);
    PERFORM set_config('app.current_tenant_id', p_tenant_id, false);
    
    IF p_audit_secret IS NOT NULL THEN
        PERFORM set_config('app.audit_secret', p_audit_secret, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Índices para optimizar consultas de auditoría
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_log_table_time 
    ON audit_log (table_name, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_time 
    ON audit_log (tenant_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_time 
    ON audit_log (executed_by, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_operation 
    ON audit_log (operation, executed_at DESC);

-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_audit_log_event_data_gin 
    ON audit_log USING GIN (event_data);

CREATE INDEX IF NOT EXISTS idx_audit_log_primary_key_gin 
    ON audit_log USING GIN (primary_key);

-- =====================================================
-- Comentarios para documentación
-- =====================================================

COMMENT ON FUNCTION audit_trigger_function() IS 
'Función genérica de auditoría que captura todos los cambios en las tablas con firma digital para garantizar inmutabilidad';

COMMENT ON FUNCTION verify_audit_integrity(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Verifica la integridad de los registros de auditoría mediante validación de firmas digitales';

COMMENT ON FUNCTION set_audit_context(TEXT, TEXT, TEXT) IS 
'Configura el contexto de auditoría con user_id, tenant_id y secret para la sesión actual';

-- =====================================================
-- Configuración inicial
-- =====================================================

-- Configurar secret por defecto (cambiar en producción)
SELECT set_config('app.audit_secret', 'default-audit-secret-change-in-production', false);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Sistema de auditoría automática instalado correctamente';
    RAISE NOTICE 'Triggers creados para: users, tenants, categories, products, orders, order_items';
    RAISE NOTICE 'Funciones disponibles: verify_audit_integrity(), set_audit_context()';
    RAISE NOTICE 'IMPORTANTE: Cambiar app.audit_secret en producción';
END $$;