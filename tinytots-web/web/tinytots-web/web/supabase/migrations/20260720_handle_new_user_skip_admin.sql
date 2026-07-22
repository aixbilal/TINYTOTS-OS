CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip customer record creation for admin/staff-created accounts
    IF (NEW.raw_user_meta_data->>'is_admin_created')::boolean IS TRUE THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.customers (auth_user_id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;