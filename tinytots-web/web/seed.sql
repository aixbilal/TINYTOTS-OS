SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict aCROzSwQWsnsJdyhSKji45x8c0vLuoutGsSVsmU9DQZGhVpXF8p7UOcqvLo2bJe

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "name", "sku", "description", "brand", "category", "created_at", "is_active") VALUES
	(1, 'Milk Bottle', 'MB-001', NULL, NULL, NULL, '2026-07-01 09:50:47.877721+00', true),
	(2, 'Test Product', 'TEST-001', NULL, NULL, NULL, '2026-07-01 10:00:55.283065+00', true),
	(4, 'Classic White T-Shirt', 'TSH-001', 'Basic cotton white t-shirt', 'TinyTots', 'Tops', '2026-07-01 11:35:18.209917+00', true),
	(5, 'Black Hoodie', 'HOD-002', 'Warm black hoodie', 'TinyTots', 'Outerwear', '2026-07-01 11:35:18.209917+00', true),
	(6, 'Blue Denim Jeans', 'JNS-003', 'Slim fit blue jeans', 'TinyTots', 'Bottoms', '2026-07-01 11:35:18.209917+00', true),
	(7, 'Cotton Polo Shirt', 'POL-004', 'Breathable polo shirt', 'TinyTots', 'Tops', '2026-07-01 11:35:18.209917+00', true),
	(8, 'Graphic Tee Naruto', 'TEE-005', 'Anime graphic t-shirt', 'TinyTots', 'Tops', '2026-07-01 11:35:18.209917+00', true),
	(9, 'Slim Fit Chinos', 'CHN-006', 'Formal slim chinos', 'TinyTots', 'Bottoms', '2026-07-01 11:35:18.209917+00', true),
	(10, 'Winter Jacket Puffer', 'JKT-007', 'Heavy winter jacket', 'TinyTots', 'Outerwear', '2026-07-01 11:35:18.209917+00', true),
	(11, 'Summer Shorts Grey', 'SRT-008', 'Light summer shorts', 'TinyTots', 'Bottoms', '2026-07-01 11:35:18.209917+00', true),
	(12, 'Formal White Shirt', 'SHR-009', 'Office formal shirt', 'TinyTots', 'Formal', '2026-07-01 11:35:18.209917+00', true),
	(13, 'Black Leather Jacket', 'LTH-010', 'Premium leather jacket', 'TinyTots', 'Outerwear', '2026-07-01 11:35:18.209917+00', true),
	(14, 'Oversized Hoodie Grey', 'HOD-011', 'Oversized street hoodie', 'TinyTots', 'Outerwear', '2026-07-01 11:35:18.209917+00', true),
	(15, 'Plain Black T-Shirt', 'TSH-012', 'Basic black tee', 'TinyTots', 'Tops', '2026-07-01 11:35:18.209917+00', true),
	(16, 'Ripped Jeans Blue', 'JNS-013', 'Distressed jeans style', 'TinyTots', 'Bottoms', '2026-07-01 11:35:18.209917+00', true),
	(17, 'Sports Jersey Red', 'SPT-014', 'Football sports jersey', 'TinyTots', 'Sportswear', '2026-07-01 11:35:18.209917+00', true),
	(18, 'Gym Tank Top', 'TNK-015', 'Workout tank top', 'TinyTots', 'Sportswear', '2026-07-01 11:35:18.209917+00', true),
	(19, 'Cargo Pants Olive', 'CRG-016', 'Military style cargo pants', 'TinyTots', 'Bottoms', '2026-07-01 11:35:18.209917+00', true),
	(20, 'Striped Polo Shirt', 'POL-017', 'Striped casual polo', 'TinyTots', 'Tops', '2026-07-01 11:35:18.209917+00', true),
	(21, 'Denim Jacket Blue', 'JKT-018', 'Classic denim jacket', 'TinyTots', 'Outerwear', '2026-07-01 11:35:18.209917+00', true),
	(22, 'Linen Summer Shirt', 'SHR-019', 'Light linen shirt', 'TinyTots', 'Formal', '2026-07-01 11:35:18.209917+00', true),
	(23, 'Running Shorts Black', 'SRT-020', 'Athletic running shorts', 'TinyTots', 'Sportswear', '2026-07-01 11:35:18.209917+00', true);


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sales" ("id", "receipt_number", "subtotal", "discount", "tax", "total", "status", "cashier", "created_at") VALUES
	(1, 'R-1001', 500.00, 0.00, 0.00, 500.00, 'completed', NULL, '2026-07-01 10:24:57.482221+00'),
	(2, 'R-1002', 250.00, 0.00, 0.00, 250.00, 'completed', NULL, '2026-07-01 10:26:53.349957+00');


--
-- Data for Name: variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."variants" ("id", "product_id", "color", "size", "price", "stock", "created_at", "reorder_level") VALUES
	(4, 1, NULL, NULL, 250.00, 10, '2026-07-01 10:02:21.102898+00', 5),
	(5, 1, NULL, NULL, 300.00, 20, '2026-07-01 10:10:16.324758+00', 5),
	(3, 1, NULL, NULL, 299.99, 9, '2026-07-01 09:51:02.867831+00', 5),
	(6, 1, 'Black', 'S', 1923.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(7, 1, 'Black', 'M', 1297.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(8, 1, 'Black', 'L', 2449.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(9, 1, 'White', 'S', 3570.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(10, 1, 'White', 'M', 2243.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(11, 1, 'White', 'L', 2009.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(12, 1, 'Blue', 'S', 2446.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(13, 1, 'Blue', 'M', 2272.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(14, 1, 'Blue', 'L', 3405.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(15, 2, 'Black', 'S', 3610.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(16, 2, 'Black', 'M', 1676.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(17, 2, 'Black', 'L', 3993.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(18, 2, 'White', 'S', 1554.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(19, 2, 'White', 'M', 2444.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(20, 2, 'White', 'L', 3750.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(21, 2, 'Blue', 'S', 2104.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(22, 2, 'Blue', 'M', 3290.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(23, 2, 'Blue', 'L', 1543.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(24, 4, 'Black', 'S', 1320.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(25, 4, 'Black', 'M', 3569.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(26, 4, 'Black', 'L', 3757.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(27, 4, 'White', 'S', 2253.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(28, 4, 'White', 'M', 2632.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(29, 4, 'White', 'L', 2792.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(30, 4, 'Blue', 'S', 3501.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(31, 4, 'Blue', 'M', 2144.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(32, 4, 'Blue', 'L', 1779.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(33, 5, 'Black', 'S', 1785.00, 15, '2026-07-01 11:37:36.261035+00', 5),
	(34, 5, 'Black', 'M', 2504.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(35, 5, 'Black', 'L', 2923.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(36, 5, 'White', 'S', 2073.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(37, 5, 'White', 'M', 2539.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(38, 5, 'White', 'L', 1179.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(39, 5, 'Blue', 'S', 2031.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(40, 5, 'Blue', 'M', 3833.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(41, 5, 'Blue', 'L', 3701.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(42, 6, 'Black', 'S', 1628.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(43, 6, 'Black', 'M', 2767.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(44, 6, 'Black', 'L', 1799.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(45, 6, 'White', 'S', 2365.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(46, 6, 'White', 'M', 2107.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(47, 6, 'White', 'L', 1044.00, 18, '2026-07-01 11:37:36.261035+00', 5),
	(48, 6, 'Blue', 'S', 3561.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(49, 6, 'Blue', 'M', 1393.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(50, 6, 'Blue', 'L', 1092.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(51, 7, 'Black', 'S', 2117.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(52, 7, 'Black', 'M', 3696.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(53, 7, 'Black', 'L', 2553.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(54, 7, 'White', 'S', 1174.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(55, 7, 'White', 'M', 3653.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(56, 7, 'White', 'L', 3319.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(57, 7, 'Blue', 'S', 1690.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(58, 7, 'Blue', 'M', 3694.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(59, 7, 'Blue', 'L', 3962.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(60, 8, 'Black', 'S', 1073.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(61, 8, 'Black', 'M', 1476.00, 15, '2026-07-01 11:37:36.261035+00', 5),
	(62, 8, 'Black', 'L', 1169.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(63, 8, 'White', 'S', 2243.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(64, 8, 'White', 'M', 1410.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(65, 8, 'White', 'L', 1364.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(66, 8, 'Blue', 'S', 2689.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(67, 8, 'Blue', 'M', 3848.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(68, 8, 'Blue', 'L', 3261.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(69, 9, 'Black', 'S', 1808.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(70, 9, 'Black', 'M', 3480.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(71, 9, 'Black', 'L', 3222.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(72, 9, 'White', 'S', 1546.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(73, 9, 'White', 'M', 1839.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(74, 9, 'White', 'L', 2489.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(75, 9, 'Blue', 'S', 3538.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(76, 9, 'Blue', 'M', 1652.00, 18, '2026-07-01 11:37:36.261035+00', 5),
	(77, 9, 'Blue', 'L', 2142.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(78, 10, 'Black', 'S', 2865.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(79, 10, 'Black', 'M', 2080.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(80, 10, 'Black', 'L', 2652.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(81, 10, 'White', 'S', 1920.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(82, 10, 'White', 'M', 2689.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(83, 10, 'White', 'L', 3196.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(84, 10, 'Blue', 'S', 2041.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(85, 10, 'Blue', 'M', 3327.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(86, 10, 'Blue', 'L', 1571.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(87, 11, 'Black', 'S', 3760.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(88, 11, 'Black', 'M', 2919.00, 15, '2026-07-01 11:37:36.261035+00', 5),
	(89, 11, 'Black', 'L', 1987.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(90, 11, 'White', 'S', 2079.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(91, 11, 'White', 'M', 2821.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(92, 11, 'White', 'L', 2072.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(93, 11, 'Blue', 'S', 1291.00, 18, '2026-07-01 11:37:36.261035+00', 5),
	(94, 11, 'Blue', 'M', 1017.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(95, 11, 'Blue', 'L', 3115.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(96, 12, 'Black', 'S', 2761.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(97, 12, 'Black', 'M', 2138.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(98, 12, 'Black', 'L', 1751.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(99, 12, 'White', 'S', 3475.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(100, 12, 'White', 'M', 3463.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(101, 12, 'White', 'L', 3259.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(102, 12, 'Blue', 'S', 2369.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(103, 12, 'Blue', 'M', 3381.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(104, 12, 'Blue', 'L', 1667.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(105, 13, 'Black', 'S', 1037.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(106, 13, 'Black', 'M', 1942.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(107, 13, 'Black', 'L', 2734.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(108, 13, 'White', 'S', 1972.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(109, 13, 'White', 'M', 1067.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(110, 13, 'White', 'L', 3447.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(111, 13, 'Blue', 'S', 2653.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(112, 13, 'Blue', 'M', 1771.00, 18, '2026-07-01 11:37:36.261035+00', 5),
	(113, 13, 'Blue', 'L', 2859.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(114, 14, 'Black', 'S', 2155.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(115, 14, 'Black', 'M', 1046.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(116, 14, 'Black', 'L', 3177.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(117, 14, 'White', 'S', 2711.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(118, 14, 'White', 'M', 1404.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(119, 14, 'White', 'L', 1609.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(120, 14, 'Blue', 'S', 3547.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(121, 14, 'Blue', 'M', 3928.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(122, 14, 'Blue', 'L', 3593.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(123, 15, 'Black', 'S', 3332.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(124, 15, 'Black', 'M', 2431.00, 15, '2026-07-01 11:37:36.261035+00', 5),
	(125, 15, 'Black', 'L', 2035.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(126, 15, 'White', 'S', 2005.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(127, 15, 'White', 'M', 2817.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(128, 15, 'White', 'L', 3158.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(129, 15, 'Blue', 'S', 3079.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(130, 15, 'Blue', 'M', 1808.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(131, 15, 'Blue', 'L', 1009.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(132, 16, 'Black', 'S', 1158.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(133, 16, 'Black', 'M', 1241.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(134, 16, 'Black', 'L', 1770.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(135, 16, 'White', 'S', 1622.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(136, 16, 'White', 'M', 2176.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(137, 16, 'White', 'L', 3487.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(138, 16, 'Blue', 'S', 3916.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(139, 16, 'Blue', 'M', 3156.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(140, 16, 'Blue', 'L', 2681.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(141, 17, 'Black', 'S', 3307.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(142, 17, 'Black', 'M', 1988.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(143, 17, 'Black', 'L', 1188.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(144, 17, 'White', 'S', 2352.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(145, 17, 'White', 'M', 3727.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(146, 17, 'White', 'L', 1729.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(147, 17, 'Blue', 'S', 1380.00, 24, '2026-07-01 11:37:36.261035+00', 5),
	(148, 17, 'Blue', 'M', 3999.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(149, 17, 'Blue', 'L', 3376.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(150, 18, 'Black', 'S', 2149.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(151, 18, 'Black', 'M', 1834.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(152, 18, 'Black', 'L', 2772.00, 18, '2026-07-01 11:37:36.261035+00', 5),
	(153, 18, 'White', 'S', 1035.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(154, 18, 'White', 'M', 1705.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(155, 18, 'White', 'L', 3156.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(156, 18, 'Blue', 'S', 2915.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(157, 18, 'Blue', 'M', 1322.00, 7, '2026-07-01 11:37:36.261035+00', 5),
	(158, 18, 'Blue', 'L', 2735.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(159, 19, 'Black', 'S', 2556.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(160, 19, 'Black', 'M', 3103.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(161, 19, 'Black', 'L', 3331.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(162, 19, 'White', 'S', 2654.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(163, 19, 'White', 'M', 2679.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(164, 19, 'White', 'L', 1896.00, 11, '2026-07-01 11:37:36.261035+00', 5),
	(165, 19, 'Blue', 'S', 2585.00, 15, '2026-07-01 11:37:36.261035+00', 5),
	(166, 19, 'Blue', 'M', 3643.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(167, 19, 'Blue', 'L', 2533.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(168, 20, 'Black', 'S', 3729.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(169, 20, 'Black', 'M', 3716.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(170, 20, 'Black', 'L', 2629.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(171, 20, 'White', 'S', 1971.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(172, 20, 'White', 'M', 2882.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(173, 20, 'White', 'L', 3270.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(174, 20, 'Blue', 'S', 2555.00, 15, '2026-07-01 11:37:36.261035+00', 5),
	(175, 20, 'Blue', 'M', 3135.00, 19, '2026-07-01 11:37:36.261035+00', 5),
	(176, 20, 'Blue', 'L', 3896.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(177, 21, 'Black', 'S', 1996.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(178, 21, 'Black', 'M', 1079.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(179, 21, 'Black', 'L', 2932.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(180, 21, 'White', 'S', 3385.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(181, 21, 'White', 'M', 2934.00, 17, '2026-07-01 11:37:36.261035+00', 5),
	(182, 21, 'White', 'L', 2991.00, 21, '2026-07-01 11:37:36.261035+00', 5),
	(183, 21, 'Blue', 'S', 1548.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(184, 21, 'Blue', 'M', 3074.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(185, 21, 'Blue', 'L', 3753.00, 22, '2026-07-01 11:37:36.261035+00', 5),
	(186, 22, 'Black', 'S', 1817.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(187, 22, 'Black', 'M', 1515.00, 16, '2026-07-01 11:37:36.261035+00', 5),
	(188, 22, 'Black', 'L', 2106.00, 20, '2026-07-01 11:37:36.261035+00', 5),
	(189, 22, 'White', 'S', 1994.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(190, 22, 'White', 'M', 3521.00, 6, '2026-07-01 11:37:36.261035+00', 5),
	(191, 22, 'White', 'L', 3119.00, 12, '2026-07-01 11:37:36.261035+00', 5),
	(192, 22, 'Blue', 'S', 3903.00, 9, '2026-07-01 11:37:36.261035+00', 5),
	(193, 22, 'Blue', 'M', 1643.00, 23, '2026-07-01 11:37:36.261035+00', 5),
	(194, 22, 'Blue', 'L', 3255.00, 18, '2026-07-01 11:37:36.261035+00', 5),
	(195, 23, 'Black', 'S', 3989.00, 14, '2026-07-01 11:37:36.261035+00', 5),
	(196, 23, 'Black', 'M', 3828.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(197, 23, 'Black', 'L', 3203.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(198, 23, 'White', 'S', 3006.00, 10, '2026-07-01 11:37:36.261035+00', 5),
	(199, 23, 'White', 'M', 1267.00, 13, '2026-07-01 11:37:36.261035+00', 5),
	(200, 23, 'White', 'L', 3191.00, 5, '2026-07-01 11:37:36.261035+00', 5),
	(201, 23, 'Blue', 'S', 2826.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(202, 23, 'Blue', 'M', 1488.00, 8, '2026-07-01 11:37:36.261035+00', 5),
	(203, 23, 'Blue', 'L', 3617.00, 10, '2026-07-01 11:37:36.261035+00', 5);


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sale_items" ("id", "sale_id", "variant_id", "quantity", "unit_price", "line_total") VALUES
	(3, 2, 3, 1, 250.00, 250.00);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."coupons_id_seq"', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."products_id_seq"', 23, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."sale_items_id_seq"', 3, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."sales_id_seq"', 2, true);


--
-- Name: variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."variants_id_seq"', 203, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict aCROzSwQWsnsJdyhSKji45x8c0vLuoutGsSVsmU9DQZGhVpXF8p7UOcqvLo2bJe

RESET ALL;
