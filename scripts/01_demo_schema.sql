-- Demo schema for VisualDB-3D
-- Simulates an e-commerce + auth system

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS shop;
CREATE SCHEMA IF NOT EXISTS inventory;

-- AUTH
CREATE TABLE auth.users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE auth.user_roles (
    user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES auth.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE auth.sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    INT REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHOP
CREATE TABLE shop.categories (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    parent_id INT REFERENCES shop.categories(id)
);

CREATE TABLE shop.products (
    id          SERIAL PRIMARY KEY,
    sku         VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL,
    category_id INT REFERENCES shop.categories(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shop.orders (
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES auth.users(id),
    status     VARCHAR(30) DEFAULT 'pending',
    total      NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shop.order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INT REFERENCES shop.orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES shop.products(id),
    quantity   INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE shop.addresses (
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES auth.users(id) ON DELETE CASCADE,
    street     TEXT,
    city       VARCHAR(100),
    country    VARCHAR(60),
    zip        VARCHAR(20)
);

-- INVENTORY
CREATE TABLE inventory.warehouses (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100),
    location TEXT
);

CREATE TABLE inventory.stock (
    id           SERIAL PRIMARY KEY,
    product_id   INT REFERENCES shop.products(id),
    warehouse_id INT REFERENCES inventory.warehouses(id),
    quantity     INT NOT NULL DEFAULT 0,
    UNIQUE (product_id, warehouse_id)
);

CREATE TABLE inventory.movements (
    id           SERIAL PRIMARY KEY,
    product_id   INT REFERENCES shop.products(id),
    warehouse_id INT REFERENCES inventory.warehouses(id),
    delta        INT NOT NULL,
    reason       VARCHAR(100),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Seed minimal data
INSERT INTO auth.roles (name) VALUES ('admin'), ('customer'), ('staff');
INSERT INTO inventory.warehouses (name, location) VALUES
    ('Main', 'New York'),
    ('West', 'Los Angeles');
