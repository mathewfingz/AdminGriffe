-- MySQL Initialization Script for Audit System
-- AdminGriffe - Sistema de Auditoría Integral

-- Create audit database and user
CREATE DATABASE IF NOT EXISTS audit_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE audit_mysql;

-- Create audit tables
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    db_engine VARCHAR(20) NOT NULL DEFAULT 'mysql',
    schema_name VARCHAR(100),
    table_name VARCHAR(100) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') NOT NULL,
    primary_key JSON,
    diff_old JSON,
    diff_new JSON,
    executed_by VARCHAR(100),
    client_ip VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    transaction_id VARCHAR(100),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signature VARBINARY(256), -- Digital signature for immutability
    metadata JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_table_name (table_name),
    INDEX idx_operation (operation),
    INDEX idx_executed_at (executed_at),
    INDEX idx_executed_by (executed_by),
    INDEX idx_composite (tenant_id, table_name, executed_at)
) ENGINE=InnoDB;

-- Create sync status table
CREATE TABLE IF NOT EXISTS sync_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_engine VARCHAR(20) NOT NULL,
    target_engine VARCHAR(20) NOT NULL,
    last_sync_at TIMESTAMP NULL,
    last_sync_position JSON,
    sync_lag_ms INT DEFAULT 0,
    status ENUM('active', 'paused', 'error', 'stopped') DEFAULT 'active',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_engines (source_engine, target_engine)
) ENGINE=InnoDB;

-- Create conflict resolution table
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    source_engine VARCHAR(20) NOT NULL,
    target_engine VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    primary_key JSON NOT NULL,
    source_data JSON,
    target_data JSON,
    conflict_type VARCHAR(50) NOT NULL,
    resolution_strategy VARCHAR(50),
    resolved_data JSON,
    status ENUM('pending', 'resolved', 'manual', 'failed') DEFAULT 'pending',
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON DEFAULT '{}',
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_table_name (table_name)
) ENGINE=InnoDB;

-- Create business tables for testing
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'default',
    user_id INT,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Create audit trigger procedure
DELIMITER $$

CREATE PROCEDURE CreateAuditTrigger(IN table_name VARCHAR(100))
BEGIN
    SET @sql = CONCAT('
        CREATE TRIGGER audit_', table_name, '_insert
        AFTER INSERT ON ', table_name, '
        FOR EACH ROW
        BEGIN
            INSERT INTO audit_log (
                tenant_id, db_engine, schema_name, table_name, operation,
                primary_key, diff_new, executed_by, client_ip, session_id
            ) VALUES (
                COALESCE(@current_tenant_id, ''default''),
                ''mysql'',
                DATABASE(),
                ''', table_name, ''',
                ''INSERT'',
                JSON_OBJECT(''id'', NEW.id),
                JSON_OBJECT(', GetColumnList(table_name, 'NEW'), '),
                COALESCE(@current_user_id, USER()),
                COALESCE(@client_ip, ''127.0.0.1''),
                COALESCE(@session_id, CONNECTION_ID())
            );
        END
    ');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    SET @sql = CONCAT('
        CREATE TRIGGER audit_', table_name, '_update
        AFTER UPDATE ON ', table_name, '
        FOR EACH ROW
        BEGIN
            INSERT INTO audit_log (
                tenant_id, db_engine, schema_name, table_name, operation,
                primary_key, diff_old, diff_new, executed_by, client_ip, session_id
            ) VALUES (
                COALESCE(@current_tenant_id, ''default''),
                ''mysql'',
                DATABASE(),
                ''', table_name, ''',
                ''UPDATE'',
                JSON_OBJECT(''id'', NEW.id),
                JSON_OBJECT(', GetColumnList(table_name, 'OLD'), '),
                JSON_OBJECT(', GetColumnList(table_name, 'NEW'), '),
                COALESCE(@current_user_id, USER()),
                COALESCE(@client_ip, ''127.0.0.1''),
                COALESCE(@session_id, CONNECTION_ID())
            );
        END
    ');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    SET @sql = CONCAT('
        CREATE TRIGGER audit_', table_name, '_delete
        AFTER DELETE ON ', table_name, '
        FOR EACH ROW
        BEGIN
            INSERT INTO audit_log (
                tenant_id, db_engine, schema_name, table_name, operation,
                primary_key, diff_old, executed_by, client_ip, session_id
            ) VALUES (
                COALESCE(@current_tenant_id, ''default''),
                ''mysql'',
                DATABASE(),
                ''', table_name, ''',
                ''DELETE'',
                JSON_OBJECT(''id'', OLD.id),
                JSON_OBJECT(', GetColumnList(table_name, 'OLD'), '),
                COALESCE(@current_user_id, USER()),
                COALESCE(@client_ip, ''127.0.0.1''),
                COALESCE(@session_id, CONNECTION_ID())
            );
        END
    ');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

CREATE FUNCTION GetColumnList(table_name VARCHAR(100), prefix VARCHAR(10))
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE col_name VARCHAR(100);
    DECLARE column_list TEXT DEFAULT '';
    DECLARE cur CURSOR FOR 
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = table_name
        AND COLUMN_NAME != 'id';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO col_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        IF column_list != '' THEN
            SET column_list = CONCAT(column_list, ', ');
        END IF;
        
        SET column_list = CONCAT(column_list, '''', col_name, ''', ', prefix, '.', col_name);
    END LOOP;
    CLOSE cur;
    
    RETURN column_list;
END$$

DELIMITER ;

-- Create audit triggers for business tables
CALL CreateAuditTrigger('users');
CALL CreateAuditTrigger('products');
CALL CreateAuditTrigger('orders');
CALL CreateAuditTrigger('order_items');

-- Insert sample data for testing
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@test.com', SHA2('admin123', 256), 'admin'),
('John Doe', 'john@test.com', SHA2('password123', 256), 'user'),
('Jane Smith', 'jane@test.com', SHA2('password123', 256), 'user'),
('Bob Wilson', 'bob@test.com', SHA2('password123', 256), 'manager');

INSERT IGNORE INTO products (name, description, price, category, stock) VALUES
('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', 50),
('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', 200),
('Office Chair', 'Comfortable ergonomic office chair', 299.99, 'Furniture', 25),
('Coffee Mug', 'Ceramic coffee mug with company logo', 12.99, 'Accessories', 100),
('Notebook Set', 'Set of 3 premium notebooks', 24.99, 'Stationery', 75);

-- Create views for audit reporting
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    tenant_id,
    table_name,
    operation,
    COUNT(*) as operation_count,
    DATE_FORMAT(executed_at, '%Y-%m-%d %H:00:00') as hour_bucket
FROM audit_log
WHERE executed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY tenant_id, table_name, operation, hour_bucket
ORDER BY hour_bucket DESC;

CREATE OR REPLACE VIEW sync_health AS
SELECT 
    source_engine,
    target_engine,
    status,
    sync_lag_ms,
    last_sync_at,
    CASE 
        WHEN last_sync_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'stale'
        WHEN sync_lag_ms > 1000 THEN 'lagging'
        WHEN status = 'error' THEN 'error'
        ELSE 'healthy'
    END as health_status
FROM sync_status;

-- Create stored procedures for audit operations
DELIMITER $$

CREATE PROCEDURE GetAuditTrail(
    IN p_table_name VARCHAR(100),
    IN p_primary_key JSON
)
BEGIN
    SELECT 
        id,
        operation,
        diff_old,
        diff_new,
        executed_by,
        executed_at
    FROM audit_log
    WHERE table_name = p_table_name
    AND JSON_EXTRACT(primary_key, '$.id') = JSON_EXTRACT(p_primary_key, '$.id')
    ORDER BY executed_at DESC;
END$$

CREATE PROCEDURE GetAuditStatistics(
    IN p_start_date TIMESTAMP,
    IN p_end_date TIMESTAMP
)
BEGIN
    SELECT 
        table_name,
        operation,
        COUNT(*) as count,
        ROUND(COUNT(*) / (TIMESTAMPDIFF(SECOND, p_start_date, p_end_date) / 3600), 2) as avg_per_hour
    FROM audit_log
    WHERE executed_at BETWEEN p_start_date AND p_end_date
    GROUP BY table_name, operation
    ORDER BY count DESC;
END$$

CREATE PROCEDURE SetTenantContext(
    IN p_tenant_id VARCHAR(50),
    IN p_user_id VARCHAR(100),
    IN p_session_id VARCHAR(100)
)
BEGIN
    SET @current_tenant_id = p_tenant_id;
    SET @current_user_id = p_user_id;
    SET @session_id = p_session_id;
END$$

DELIMITER ;

-- Create user for Debezium CDC
CREATE USER IF NOT EXISTS 'debezium'@'%' IDENTIFIED BY 'debezium_password';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'debezium'@'%';
GRANT ALL PRIVILEGES ON audit_mysql.* TO 'debezium'@'%';

-- Grant permissions to audit_user
GRANT ALL PRIVILEGES ON audit_mysql.* TO 'audit_user'@'%';

FLUSH PRIVILEGES;