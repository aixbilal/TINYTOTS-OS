SET check_function_bodies = false;
CREATE SEQUENCE public.coupons_id_seq;
CREATE SEQUENCE public.products_id_seq;
CREATE SEQUENCE public.sale_items_id_seq;
CREATE SEQUENCE public.sales_id_seq;
CREATE SEQUENCE public.variants_id_seq;
CREATE FUNCTION public.deduct_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE variants
    SET
        stock = stock - NEW.quantity,
        is_low_stock = (stock - NEW.quantity) <= reorder_level
    WHERE id = NEW.variant_id;

    RETURN NEW;
END;
$function$;
CREATE TABLE public.coupons (id bigint DEFAULT nextval('public.coupons_id_seq'::regclass) NOT NULL, code text NOT NULL, discount_type text NOT NULL, value numeric(10,2) NOT NULL, is_active boolean DEFAULT true NOT NULL, expires_at timestamp with time zone, created_at timestamp with time zone DEFAULT now());
ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;
GRANT UPDATE ON SEQUENCE public.coupons_id_seq TO anon;
GRANT UPDATE ON SEQUENCE public.coupons_id_seq TO authenticated;
GRANT UPDATE ON SEQUENCE public.coupons_id_seq TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check CHECK (discount_type = ANY (ARRAY['percentage'::text, 'flat'::text]));
ALTER TABLE public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.coupons TO anon;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.coupons TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.coupons TO service_role;
CREATE TABLE public.products (id bigint DEFAULT nextval('public.products_id_seq'::regclass) NOT NULL, name text NOT NULL, sku text NOT NULL, description text, brand text, category text, created_at timestamp with time zone DEFAULT now(), is_active boolean DEFAULT true NOT NULL);
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
GRANT UPDATE ON SEQUENCE public.products_id_seq TO anon;
GRANT UPDATE ON SEQUENCE public.products_id_seq TO authenticated;
GRANT UPDATE ON SEQUENCE public.products_id_seq TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products TO anon;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products TO service_role;
CREATE INDEX idx_products_sku ON public.products (sku);
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING ((is_active = true));
CREATE TABLE public.sale_items (id bigint DEFAULT nextval('public.sale_items_id_seq'::regclass) NOT NULL, sale_id bigint NOT NULL, variant_id bigint NOT NULL, quantity integer NOT NULL, unit_price numeric(10,2) NOT NULL, line_total numeric(10,2) NOT NULL);
ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;
GRANT UPDATE ON SEQUENCE public.sale_items_id_seq TO anon;
GRANT UPDATE ON SEQUENCE public.sale_items_id_seq TO authenticated;
GRANT UPDATE ON SEQUENCE public.sale_items_id_seq TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_quantity_check CHECK (quantity > 0);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sale_items TO anon;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sale_items TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sale_items TO service_role;
CREATE INDEX idx_sale_items_sale_id ON public.sale_items (sale_id);
CREATE INDEX idx_sale_items_variant_id ON public.sale_items (variant_id);
CREATE TRIGGER trg_deduct_stock AFTER INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.deduct_stock();
CREATE TABLE public.sales (id bigint DEFAULT nextval('public.sales_id_seq'::regclass) NOT NULL, receipt_number text NOT NULL, subtotal numeric(10,2) NOT NULL, discount numeric(10,2) DEFAULT 0, tax numeric(10,2) DEFAULT 0, total numeric(10,2) NOT NULL, status text DEFAULT 'completed'::text NOT NULL, cashier text, created_at timestamp with time zone DEFAULT now());
ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;
GRANT UPDATE ON SEQUENCE public.sales_id_seq TO anon;
GRANT UPDATE ON SEQUENCE public.sales_id_seq TO authenticated;
GRANT UPDATE ON SEQUENCE public.sales_id_seq TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id);
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD CONSTRAINT sales_receipt_number_key UNIQUE (receipt_number);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sales TO anon;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sales TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sales TO service_role;
CREATE INDEX idx_sales_created_at ON public.sales (created_at);
CREATE TABLE public.variants (id bigint DEFAULT nextval('public.variants_id_seq'::regclass) NOT NULL, product_id bigint NOT NULL, color text, size text, price numeric(10,2) NOT NULL, stock integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), reorder_level integer DEFAULT 5 NOT NULL, is_low_stock boolean DEFAULT false NOT NULL);
ALTER SEQUENCE public.variants_id_seq OWNED BY public.variants.id;
GRANT UPDATE ON SEQUENCE public.variants_id_seq TO anon;
GRANT UPDATE ON SEQUENCE public.variants_id_seq TO authenticated;
GRANT UPDATE ON SEQUENCE public.variants_id_seq TO service_role;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ADD CONSTRAINT variants_pkey PRIMARY KEY (id);
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE RESTRICT;
ALTER TABLE public.variants ADD CONSTRAINT variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants TO anon;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants TO service_role;
CREATE INDEX idx_variants_product_id ON public.variants (product_id);
CREATE POLICY "Public can view variants" ON public.variants FOR SELECT USING (true);
