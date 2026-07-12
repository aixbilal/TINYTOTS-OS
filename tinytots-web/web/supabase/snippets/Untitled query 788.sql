CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT,
    brand TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);