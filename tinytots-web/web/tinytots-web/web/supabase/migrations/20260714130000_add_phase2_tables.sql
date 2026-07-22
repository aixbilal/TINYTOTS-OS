-- ============ ADMIN USERS / ROLES ============
CREATE TABLE public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'order_manager'::text, 'support'::text, 'inventory_only'::text])),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============ DISCOUNTS ============
CREATE TABLE public.discounts (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['flat'::text, 'percentage'::text])),
    value numeric(10,2) NOT NULL,
    applies_to text NOT NULL CHECK (applies_to = ANY (ARRAY['single_product'::text, 'product_set'::text])),
    product_ids bigint[] NOT NULL DEFAULT '{}',
    starts_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- ============ REFERRALS ============
CREATE TABLE public.referrals (
    id bigserial PRIMARY KEY,
    referrer_customer_id bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    referee_customer_id bigint REFERENCES public.customers(id) ON DELETE SET NULL,
    referral_code text NOT NULL UNIQUE,
    reward_triggered boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ============ VOUCHERS ============
CREATE TABLE public.vouchers (
    id bigserial PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL DEFAULT 100,
    is_used boolean NOT NULL DEFAULT false,
    source text NOT NULL DEFAULT 'referral',
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- ============ BLOG POSTS ============
CREATE TABLE public.blog_posts (
    id bigserial PRIMARY KEY,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text NOT NULL,
    author text,
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- ============ BLOG COMPLAINTS ============
CREATE TABLE public.blog_complaints (
    id bigserial PRIMARY KEY,
    blog_post_id bigint NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    reporter_name text,
    reporter_email text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text])),
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blog_complaints ENABLE ROW LEVEL SECURITY;

-- ============ POS TRANSACTIONS (offline-first Electron sync) ============
CREATE TABLE public.pos_transactions (
    id bigserial PRIMARY KEY,
    local_transaction_id text NOT NULL UNIQUE,
    sale_id bigint REFERENCES public.sales(id) ON DELETE SET NULL,
    synced boolean NOT NULL DEFAULT false,
    synced_at timestamptz,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;