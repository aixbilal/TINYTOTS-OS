-- Blog posts: public can view published posts
CREATE POLICY "Public can view published blog posts" ON public.blog_posts
FOR SELECT USING (is_published = true);

-- Discounts: public can view active, non-expired discounts
CREATE POLICY "Public can view active discounts" ON public.discounts
FOR SELECT USING ((is_active = true) AND ((ends_at IS NULL) OR (ends_at > now())));

-- Customers can view/update their own record only
CREATE POLICY "Customers can view own record" ON public.customers
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can update own record" ON public.customers
FOR UPDATE USING (auth.uid() = auth_user_id);

-- Customers can view their own orders only
CREATE POLICY "Customers can view own orders" ON public.orders
FOR SELECT USING (
  customer_id IN (SELECT customers.id FROM customers WHERE customers.auth_user_id = auth.uid())
);

-- Customers can view their own order items only
CREATE POLICY "Customers can view own order items" ON public.order_items
FOR SELECT USING (
  order_id IN (
    SELECT o.id FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE c.auth_user_id = auth.uid()
  )
);