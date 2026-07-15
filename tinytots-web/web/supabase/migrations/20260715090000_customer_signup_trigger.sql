-- ============ Make phone required on customers ============
ALTER TABLE public.customers
ALTER COLUMN phone SET NOT NULL;

-- ============ Auto-create customer profile on signup ============
-- When someone signs up via Supabase Auth, this automatically inserts
-- a matching row into public.customers, pulling full_name and phone
-- from the signup metadata (passed in from the signup form).
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.customers (auth_user_id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();