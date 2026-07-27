-- Link a complaint (return/report) to the voucher issued for it, and record
-- which refund method the admin chose. Needed so "mark as Refunded via
-- voucher" can actually create a voucher instead of just relabeling status.
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS refund_method text,
  ADD COLUMN IF NOT EXISTS voucher_id bigint REFERENCES public.vouchers(id);

ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_refund_method_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_refund_method_check
  CHECK (refund_method IS NULL OR refund_method = ANY (ARRAY['voucher', 'original_payment', 'bank_transfer']));

-- Vouchers need a source value distinct from 'referral' so the Referrals
-- page can filter to referral-only vouchers.
ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_source_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_source_check
  CHECK (source = ANY (ARRAY['referral', 'signup', 'return_refund']));

-- Newsletter signups from the footer form.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id bigserial PRIMARY KEY,
    email text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Admin-selected product IDs for the homepage "Trending Now" section.
-- NULL/empty means fall back to the default (most recent) products.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS trending_product_ids bigint[] DEFAULT '{}';
