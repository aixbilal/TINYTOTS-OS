-- Seed the real Privacy Policy / Terms content into site_pages, now that
-- the public pages read from this table (previously hardcoded in React).
UPDATE public.site_pages SET content = '<h2>1. Data Collection</h2>
<p>When you shop with TinyTots, we collect the information needed to process your order and keep you updated on it &mdash; your name, phone number, delivery address, and order history. If you create an account, we also store your email and login details securely through our authentication provider.</p>
<h2>2. How We Use It</h2>
<p>Your information is used to fulfill and deliver your orders, send order status updates, respond to your questions and return requests, and improve our product range. We do not sell your personal data to third parties.</p>
<h2>3. Secure Payment</h2>
<p>We support Cash on Delivery, JazzCash, Easypaisa, and card payments. All online payments are processed through our payment partners'' secure, encrypted gateways &mdash; we never store your full card or wallet credentials on our own servers.</p>
<ul>
<li><strong>Cash on Delivery:</strong> pay in cash when your order arrives.</li>
<li><strong>JazzCash / Easypaisa:</strong> pay instantly via mobile wallet.</li>
<li><strong>Card:</strong> Visa/Mastercard accepted via our secure processor.</li>
</ul>
<h2>4. Your Account</h2>
<p>You''re responsible for keeping your login credentials confidential. If you believe someone has accessed your account without permission, please contact us immediately so we can help secure it.</p>
<h2>5. Cookies</h2>
<p>We use essential cookies to keep you signed in and remember your cart. We don''t use third-party advertising trackers.</p>
<h2>6. Contact Us</h2>
<p>Questions about this policy or your data? Reach out anytime through our <a href="/contact">Contact page</a>.</p>', updated_at = now()
WHERE slug = 'privacy-policy' AND content = '<p>Write your Privacy Policy content here from the admin panel.</p>';

UPDATE public.site_pages SET content = '<h2>1. Orders &amp; Pricing</h2>
<p>All prices are listed in PKR and include applicable taxes unless stated otherwise. We reserve the right to correct pricing errors and to cancel orders placed at an incorrect price, with a full refund if payment was already made.</p>
<h2>2. Cash on Delivery Compliance</h2>
<p>For Cash on Delivery orders, please be available at the delivery address to receive your order and complete payment. On some orders we may request a small advance token payment before dispatch to confirm the booking &mdash; this will always be shown clearly at checkout before you confirm your order. Repeated refusal of COD deliveries may result in future orders requiring advance payment.</p>
<h2>3. Delivery</h2>
<p>We aim to prepare every order within 24 hours. Delivery timelines vary by location and courier availability, and are estimates rather than guarantees. You can track any order''s status from <a href="/track-order">Track Order</a>.</p>
<h2>4. Returns &amp; Refunds</h2>
<p>Most items can be returned within 7 days of delivery if unworn, unwashed, and with tags intact. Visit <a href="/account/returns">Returns &amp; Refunds</a> to start a request. Full details are in our <a href="/shipping-returns">Shipping &amp; Returns policy</a>.</p>
<h2>5. Account Conduct</h2>
<p>Creating an account lets you track orders, save addresses, and manage returns. We reserve the right to suspend accounts involved in fraudulent orders, repeated non-collection of COD parcels, or abuse of our return policy.</p>
<h2>6. Governing Law</h2>
<p>These terms are governed by the laws of Pakistan. Any disputes will be subject to the exclusive jurisdiction of the courts in our operating region.</p>', updated_at = now()
WHERE slug = 'terms' AND content = '<p>Write your Terms & Conditions here from the admin panel.</p>';
