-- Admins can view their own admin_users record (needed to check their role client-side)
CREATE POLICY "Admins can view own record" ON public.admin_users
FOR SELECT USING (auth.uid() = auth_user_id);