CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_customer_id bigint;
    new_referral_code text;
    signup_voucher_amount numeric;
BEGIN
    IF (NEW.raw_user_meta_data->>'is_admin_created')::boolean IS TRUE THEN
        RETURN NEW;
    END IF;

    new_referral_code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));

    INSERT INTO public.customers (auth_user_id, email, full_name, phone, referral_code)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        new_referral_code
    )
    RETURNING id INTO new_customer_id;

    -- Pull the signup voucher amount from app_settings instead of a hardcoded value,
    -- falling back to 200 if the setting row is ever missing.
    SELECT COALESCE(
        (SELECT value::numeric FROM public.app_settings WHERE key = 'signup_voucher_amount'),
        200
    ) INTO signup_voucher_amount;

    INSERT INTO public.vouchers (customer_id, amount, is_used, source, expires_at)
    VALUES (new_customer_id, signup_voucher_amount, false, 'signup', now() + interval '30 days');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;