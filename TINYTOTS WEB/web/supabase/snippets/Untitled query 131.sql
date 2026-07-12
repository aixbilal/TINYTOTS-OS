CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    cashier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);