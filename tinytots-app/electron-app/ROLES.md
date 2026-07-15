# TinyTots Admin Role & Permission Model

**Authentication Strategy:** **Option A** (Supabase Auth)
`admin_users.auth_user_id` links directly to Supabase Auth (`auth.users`). Users will log in via Supabase Auth email/password, and the application will query `admin_users` to check their role and enforce UI/API gating.

## Role Permission Matrix

| Role | Products/Inventory | Orders | Coupons/Referrals | Complaints | Team Management |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **admin** | Full Access | Full Access | Full Access | Full Access | Full Access |
| **order_manager** | Read-only | Full Access | Read-only | Read/Update | None |
| **support** | Read-only | Read-only | None | Full Access | None |
| **inventory_only**| Full Access | None | None | None | None |

## Next Steps (Phase 2)
* **RLS Policies:** Use this matrix to write Row-Level Security (RLS) policies in PostgreSQL.
* **UI Gating:** Use the active admin's role to show/hide navigation links and action buttons in the admin dashboard.
