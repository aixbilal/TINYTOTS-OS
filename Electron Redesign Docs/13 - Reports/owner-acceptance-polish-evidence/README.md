# Owner Acceptance Polish — screenshot evidence

Runtime screenshots for this pass must be captured on an operator machine, not in
the build/CI environment used for the code changes. Reason: the Electron app
needs the local backend (`localhost:3000`) talking to the **production** Supabase
project, and `POST /api/login` + the non-embedded cron/recovery path both write
to production (employee-login notifications, missed-report recovery,
WhatsApp/email). The functional-freeze rules for this pass explicitly forbid
production writes merely for testing, so the app was not launched here.

## Capture steps (operator machine)

```
cd tinytots-app/electron-app
npm install
npm run start        # vite dev + electron
# log in as an admin
```

Resize the Electron window and capture PNGs into this folder:

| File | Screen | Notes |
|---|---|---|
| `dashboard.png` | Dashboard | greeting hero + semantic KPI row + open lists |
| `pos.png` | POS | cart column set apart by tone, not outline; checkout dominant |
| `receipts.png` | Receipts | borderless filter row + open table + selected rail + detail |
| `staff.png` | Staff & Access | metric tiles (Total / Admins / Cashiers) + avatar rows |
| `profile.png` | Profile | identity, account rows, greeting preference + preview |
| `printer.png` | Printer Settings | three-state status tint block |
| `notifications.png` | Notifications | New / Earlier groups, no Close footer, truthful actions |
| `login.png` | Login | ~42% brand image + open sign-in region |
| `inventory-verification.png` | Inventory | confirm composition unchanged (locked) |
| `low-stock-verification.png` | Low Stock | confirm composition unchanged (locked) |

Priority viewport: **1366×768**. Also spot-check **1280×720** and **1920×1080**.

## What was verified here (without launching the app)

- `npm run build` — PASS (pre-existing >500 kB chunk warning only).
- Targeted ESLint on every changed file — 0 new findings. Two pre-existing
  baseline errors remain (`NotificationBell` `load()` in effect; `POS`
  `Date.now()` purity) — both fire identically on the pre-pass `HEAD` and are
  out of scope per the pass rules.
- Static review of every changed control path (auth, checkout, offline queue,
  scanner/F2, notification actions, printer discovery, user CRUD) — no
  behavioural change; see `../ELECTRON-OWNER-ACCEPTANCE-POLISH.md`.
