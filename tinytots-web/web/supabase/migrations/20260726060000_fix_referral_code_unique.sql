ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS referrals_referee_customer_unique
  ON public.referrals (referee_customer_id)
  WHERE referee_customer_id IS NOT NULL;
