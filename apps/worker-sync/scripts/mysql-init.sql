-- MySQL initialization script for Sync Worker
-- This script sets up the necessary tables and configurations for CDC

-- Enable binary logging for CDC
SET GLOBAL log_bin = ON;
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL binlog_row_image = 'FULL';

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sync_db;
USE sync_db;

-- Create sync metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    source_db VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    last_sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_source_table (source_db, table_name)
);

-- Create sync conflicts table
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    table_name VARCHAR(100) NOT NULL,
    primary_key JSON NOT NULL,
    conflict_events JSON NOT NULL,
    resolution_strategy VARCHAR(20),
    winner_event_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sample tables for testing
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    order_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    primary_key JSON NOT NULL,
    old_data JSON,
    new_data JSON,
    timestamp TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    transaction_id BIGINT,
    user VARCHAR(100),
    INDEX idx_table_timestamp (table_name, timestamp),
    INDEX idx_operation (operation),
    INDEX idx_timestamp (timestamp)
);

-- Create audit trigger for users table
DELIMITER $$

CREATE TRIGGER audit_users_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, new_data, transaction_id, user)
    VALUES (
        'users',
        'INSERT',
        JSON_OBJECT('id', NEW.id),
        JSON_OBJECT(
            'id', NEW.id,
            'email', NEW.email,
            'name', NEW.name,
            'status', NEW.status,
            'metadata', NEW.metadata,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

CREATE TRIGGER audit_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, old_data, new_data, transaction_id, user)
    VALUES (
        'users',
        'UPDATE',
        JSON_OBJECT('id', NEW.id),
        JSON_OBJECT(
            'id', OLD.id,
            'email', OLD.email,
            'name', OLD.name,
            'status', OLD.status,
            'metadata', OLD.metadata,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'email', NEW.email,
            'name', NEW.name,
            'status', NEW.status,
            'metadata', NEW.metadata,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

CREATE TRIGGER audit_users_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, old_data, transaction_id, user)
    VALUES (
        'users',
        'DELETE',
        JSON_OBJECT('id', OLD.id),
        JSON_OBJECT(
            'id', OLD.id,
            'email', OLD.email,
            'name', OLD.name,
            'status', OLD.status,
            'metadata', OLD.metadata,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

-- Create audit triggers for products table
CREATE TRIGGER audit_products_insert
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, new_data, transaction_id, user)
    VALUES (
        'products',
        'INSERT',
        JSON_OBJECT('id', NEW.id),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'description', NEW.description,
            'price', NEW.price,
            'category', NEW.category,
            'tags', NEW.tags,
            'is_active', NEW.is_active,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

CREATE TRIGGER audit_products_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, old_data, new_data, transaction_id, user)
    VALUES (
        'products',
        'UPDATE',
        JSON_OBJECT('id', NEW.id),
        JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'description', OLD.description,
            'price', OLD.price,
            'category', OLD.category,
            'tags', OLD.tags,
            'is_active', OLD.is_active,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'description', NEW.description,
            'price', NEW.price,
            'category', NEW.category,
            'tags', NEW.tags,
            'is_active', NEW.is_active,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

CREATE TRIGGER audit_products_delete
AFTER DELETE ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, old_data, transaction_id, user)
    VALUES (
        'products',
        'DELETE',
        JSON_OBJECT('id', OLD.id),
        JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'description', OLD.description,
            'price', OLD.price,
            'category', OLD.category,
            'tags', OLD.tags,
            'is_active', OLD.is_active,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

-- Create audit triggers for orders table
CREATE TRIGGER audit_orders_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, new_data, transaction_id, user)
    VALUES (
        'orders',
        'INSERT',
        JSON_OBJECT('id', NEW.id),
        JSON_OBJECT(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'total_amount', NEW.total_amount,
            'status', NEW.status,
            'order_data', NEW.order_data,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

CREATE TRIGGER audit_orders_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, old_data, new_data, transaction_id, user)
    VALUES (
        'orders',
        'UPDATE',
        JSON_OBJECT('id', NEW.id),
        JSON_OBJECT(
            'id', OLD.id,
            'user_id', OLD.user_id,
            'total_amount', OLD.total_amount,
            'status', OLD.status,
            'order_data', OLD.order_data,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'total_amount', NEW.total_amount,
            'status', NEW.status,
            'order_data', NEW.order_data,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

CREATE TRIGGER audit_orders_delete
AFTER DELETE ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, primary_key, old_data, transaction_id, user)
    VALUES (
        'orders',
        'DELETE',
        JSON_OBJECT('id', OLD.id),
        JSON_OBJECT(
            'id', OLD.id,
            'user_id', OLD.user_id,
            'total_amount', OLD.total_amount,
            'status', OLD.status,
            'order_data', OLD.order_data,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        CONNECTION_ID(),
        USER()
    );
END$$

DELIMITER ;

-- Create indexes for performance
CREATE INDEX idx_sync_metadata_source_table ON sync_metadata(source_db, table_name);
CREATE INDEX idx_sync_conflicts_status ON sync_conflicts(status);
CREATE INDEX idx_sync_conflicts_table ON sync_conflicts(table_name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Insert sample data
INSERT IGNORE INTO users (email, name, status, metadata) VALUES
    ('john.doe@example.com', 'John Doe', 'active', '{"role": "admin", "preferences": {"theme": "dark"}}'),
    ('jane.smith@example.com', 'Jane Smith', 'active', '{"role": "user", "preferences": {"theme": "light"}}'),
    ('bob.wilson@example.com', 'Bob Wilson', 'inactive', '{"role": "user", "last_login": "2024-01-15"}');

INSERT IGNORE INTO products (name, description, price, category, tags, is_active) VALUES
    ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', '["laptop", "computer", "professional"]', true),
    ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', '["mouse", "wireless", "ergonomic"]', true),
    ('Coffee Mug', 'Ceramic coffee mug with logo', 12.99, 'Office', '["mug", "coffee", "ceramic"]', true);

-- Create user for replication
CREATE USER IF NOT EXISTS 'debezium'@'%' IDENTIFIED BY 'debezium_password';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'debezium'@'%';
GRANT ALL PRIVILEGES ON sync_db.* TO 'debezium'@'%';

FLUSH PRIVILEGES;