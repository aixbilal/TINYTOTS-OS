CREATE TABLE variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    color TEXT,
    size TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);