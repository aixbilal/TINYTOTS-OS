CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    variant_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    line_total NUMERIC(10,2) NOT NULL,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

    FOREIGN KEY (variant_id)
        REFERENCES variants(id)
        ON DELETE RESTRICT
);