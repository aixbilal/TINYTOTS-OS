


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."checkout_transaction"("p_sale_id" "uuid", "p_items" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    item jsonb;
    v_stock int;
BEGIN

    -- Loop through cart items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP

        -- Get current stock
        SELECT stock INTO v_stock
        FROM variants
        WHERE id = (item->>'variant_id')::uuid
        FOR UPDATE;

        -- Stock validation
        IF v_stock IS NULL THEN
            RAISE EXCEPTION 'Variant not found';
        END IF;

        IF v_stock < (item->>'quantity')::int THEN
            RAISE EXCEPTION 'Insufficient stock for variant %', item->>'variant_id';
        END IF;

        -- Deduct stock
        UPDATE variants
        SET stock = stock - (item->>'quantity')::int,
            is_low_stock = (stock - (item->>'quantity')::int) <= reorder_level
        WHERE id = (item->>'variant_id')::uuid;

        -- Insert sale item
        INSERT INTO sale_items (sale_id, variant_id, quantity, price)
        VALUES (
            p_sale_id,
            (item->>'variant_id')::uuid,
            (item->>'quantity')::int,
            (item->>'price')::numeric
        );

    END LOOP;

END;
$$;


ALTER FUNCTION "public"."checkout_transaction"("p_sale_id" "uuid", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_stock"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE variants
    SET
        stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."deduct_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_stock_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."deduct_stock_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_summary"("p_report_date" "date") RETURNS TABLE("report_date" "date", "gross_revenue" numeric, "net_profit" numeric, "atv" numeric, "total_items_sold" bigint, "total_transactions" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_report_date,

        COALESCE(SUM(si.line_total), 0) AS gross_revenue,

        COALESCE(
            SUM(
                si.line_total - (v.cost_price * si.quantity)
            ),
            0
        ) AS net_profit,

        COALESCE(
            SUM(si.line_total) /
            NULLIF(COUNT(DISTINCT s.id), 0),
            0
        ) AS atv,

        COALESCE(SUM(si.quantity), 0) AS total_items_sold,

        COUNT(DISTINCT s.id) AS total_transactions

    FROM sales s
    LEFT JOIN sale_items si
        ON s.id = si.sale_id
    LEFT JOIN variants v
        ON si.variant_id = v.id

    WHERE s.created_at::DATE = p_report_date;
END;
$$;


ALTER FUNCTION "public"."get_daily_summary"("p_report_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_customer_orders_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET orders_count = orders_count + 1
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_customer_orders_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_stock_on_cancel"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
        UPDATE public.variants v
        SET stock = v.stock + oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id AND v.id = oi.variant_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."restore_stock_on_cancel"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."conversation_state" (
    "phone_number" "text" NOT NULL,
    "step" "text" NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "needs_human" boolean DEFAULT false
);


ALTER TABLE "public"."conversation_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "discount_type" "text" NOT NULL,
    "value" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coupons_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percentage'::"text", 'flat'::"text"])))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."coupons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."coupons_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."coupons_id_seq" OWNED BY "public"."coupons"."id";



CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" bigint NOT NULL,
    "auth_user_id" "uuid",
    "full_name" "text",
    "phone" "text",
    "email" "text",
    "orders_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


ALTER TABLE "public"."customers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_type" "text" DEFAULT 'monthly_sales'::"text" NOT NULL,
    "target_amount" numeric NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified" boolean DEFAULT false
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "target_role" "text",
    "target_username" "text",
    "action_label" "text",
    "action_type" "text",
    "action_payload" "jsonb",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_category_check" CHECK (("category" = ANY (ARRAY['inventory'::"text", 'sales'::"text", 'employee'::"text", 'system'::"text", 'goal'::"text"]))),
    CONSTRAINT "notifications_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'warning'::"text", 'success'::"text", 'info'::"text"]))),
    CONSTRAINT "notifications_target_role_check" CHECK (("target_role" = ANY (ARRAY['admin'::"text", 'cashier'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "variant_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "line_total" numeric(10,2) NOT NULL,
    "unit_cost_price" numeric(10,2),
    "line_gross_profit" numeric(10,2) GENERATED ALWAYS AS ((("unit_price" - COALESCE("unit_cost_price", (0)::numeric)) * ("quantity")::numeric)) STORED,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


ALTER TABLE "public"."order_items" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."order_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "order_number" "text" NOT NULL,
    "customer_id" bigint,
    "guest_name" "text",
    "guest_phone" "text",
    "shipping_address" "text" NOT NULL,
    "shipping_city" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "payment_method" "text" NOT NULL,
    "cod_tier" "text",
    "cod_token_amount" numeric(10,2) DEFAULT 0,
    "cod_token_paid" boolean DEFAULT false NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "delivery_fee" numeric(10,2) DEFAULT 0 NOT NULL,
    "discount_total" numeric(10,2) DEFAULT 0 NOT NULL,
    "total" numeric(10,2) NOT NULL,
    "coupon_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_cod_tier_check" CHECK (("cod_tier" = ANY (ARRAY['none'::"text", 'full_cod'::"text", 'token_percent'::"text", 'token_flat'::"text"]))),
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['jazzcash'::"text", 'easypaisa'::"text", 'card'::"text", 'cod'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'processing'::"text", 'shipped'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


ALTER TABLE "public"."orders" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text" NOT NULL,
    "description" "text",
    "brand" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true NOT NULL,
    "hsn_code" "text",
    "unit" "text" DEFAULT 'Pcs'::"text",
    "image_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "public_code" "text",
    "gender" "text",
    "age_bracket" "text",
    "supplier_id" "text",
    "aging_flagged" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cost_price" numeric(10,2) DEFAULT 0,
    "selling_price" numeric(10,2) DEFAULT 0
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE "public"."profiles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."report_history" (
    "report_date" "date" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "emailed_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "error_message" "text",
    "retry_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "report_history_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."report_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" bigint NOT NULL,
    "sale_id" bigint NOT NULL,
    "variant_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "line_total" numeric(10,2) NOT NULL,
    CONSTRAINT "sale_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sale_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sale_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sale_items_id_seq" OWNED BY "public"."sale_items"."id";



CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" bigint NOT NULL,
    "receipt_number" "text" NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "discount" numeric(10,2) DEFAULT 0,
    "tax" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "cashier" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_method" "text" DEFAULT 'Cash'::"text",
    "notes" "text",
    "source" "text" DEFAULT 'in_store'::"text",
    "customer_phone" "text",
    "fulfillment_type" "text",
    "delivery_address" "text",
    "client_sale_id" "text"
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_id_seq" OWNED BY "public"."sales"."id";



CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" bigint NOT NULL,
    "daily_goal" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


ALTER TABLE "public"."settings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "username" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'cashier'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."variants" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "color" "text",
    "size" "text",
    "price" numeric(10,2) NOT NULL,
    "stock" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reorder_level" integer DEFAULT 5 NOT NULL,
    "sku" "text",
    "status" "text" DEFAULT 'active'::"text",
    "cost_price" numeric DEFAULT 0,
    "public_code" "text",
    "discount_percent" numeric(5,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "price_positive" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "stock_non_negative" CHECK (("stock" >= 0)),
    CONSTRAINT "variants_discount_percent_check" CHECK ((("discount_percent" >= (0)::numeric) AND ("discount_percent" <= (100)::numeric)))
);


ALTER TABLE "public"."variants" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."variants_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."variants_id_seq" OWNED BY "public"."variants"."id";



ALTER TABLE ONLY "public"."coupons" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."coupons_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sale_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sale_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."variants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."variants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."conversation_state"
    ADD CONSTRAINT "conversation_state_pkey" PRIMARY KEY ("phone_number");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_public_code_unique" UNIQUE ("public_code");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_history"
    ADD CONSTRAINT "report_history_pkey" PRIMARY KEY ("report_date");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_client_sale_id_key" UNIQUE ("client_sale_id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_receipt_number_key" UNIQUE ("receipt_number");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_public_code_key" UNIQUE ("public_code");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_sku_key" UNIQUE ("sku");



CREATE INDEX "idx_customers_auth_user_id" ON "public"."customers" USING "btree" ("auth_user_id");



CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");



CREATE INDEX "idx_goals_period" ON "public"."goals" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_variant_id" ON "public"."order_items" USING "btree" ("variant_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "idx_sale_items_sale_id" ON "public"."sale_items" USING "btree" ("sale_id");



CREATE INDEX "idx_sale_items_variant_id" ON "public"."sale_items" USING "btree" ("variant_id");



CREATE INDEX "idx_sales_created_at" ON "public"."sales" USING "btree" ("created_at");



CREATE INDEX "idx_variants_product_id" ON "public"."variants" USING "btree" ("product_id");



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE OR REPLACE TRIGGER "trg_deduct_stock" AFTER INSERT ON "public"."sale_items" FOR EACH ROW EXECUTE FUNCTION "public"."deduct_stock"();



CREATE OR REPLACE TRIGGER "trg_deduct_stock_order" AFTER INSERT ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."deduct_stock_order"();



CREATE OR REPLACE TRIGGER "trg_increment_customer_orders_count" AFTER INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."increment_customer_orders_count"();



CREATE OR REPLACE TRIGGER "trg_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_restore_stock_on_cancel" AFTER UPDATE OF "status" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."restore_stock_on_cancel"();



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_coupon_code_fkey" FOREIGN KEY ("coupon_code") REFERENCES "public"."coupons"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



CREATE POLICY "Customers can update own record" ON "public"."customers" FOR UPDATE USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "Customers can view own order items" ON "public"."order_items" FOR SELECT USING (("order_id" IN ( SELECT "o"."id"
   FROM ("public"."orders" "o"
     JOIN "public"."customers" "c" ON (("c"."id" = "o"."customer_id")))
  WHERE ("c"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Customers can view own orders" ON "public"."orders" FOR SELECT USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Customers can view own record" ON "public"."customers" FOR SELECT USING (("auth"."uid"() = "auth_user_id"));



ALTER TABLE "public"."conversation_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_products" ON "public"."products" FOR INSERT WITH CHECK (true);



CREATE POLICY "insert_variants" ON "public"."variants" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_insert" ON "public"."products" FOR INSERT WITH CHECK (true);



CREATE POLICY "products_select" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "products_update" ON "public"."products" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "variants_insert" ON "public"."variants" FOR INSERT WITH CHECK (true);



CREATE POLICY "variants_select" ON "public"."variants" FOR SELECT USING (true);



CREATE POLICY "variants_update" ON "public"."variants" FOR UPDATE USING (true) WITH CHECK (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."checkout_transaction"("p_sale_id" "uuid", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."checkout_transaction"("p_sale_id" "uuid", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkout_transaction"("p_sale_id" "uuid", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_stock"() TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_stock"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_stock"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_stock_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_stock_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_stock_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_report_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_report_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_report_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_customer_orders_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_customer_orders_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_customer_orders_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_stock_on_cancel"() TO "anon";
GRANT ALL ON FUNCTION "public"."restore_stock_on_cancel"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_stock_on_cancel"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."conversation_state" TO "anon";
GRANT ALL ON TABLE "public"."conversation_state" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_state" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."coupons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."coupons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."coupons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."report_history" TO "anon";
GRANT ALL ON TABLE "public"."report_history" TO "authenticated";
GRANT ALL ON TABLE "public"."report_history" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sale_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sale_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sale_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."variants" TO "anon";
GRANT ALL ON TABLE "public"."variants" TO "authenticated";
GRANT ALL ON TABLE "public"."variants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."variants_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































