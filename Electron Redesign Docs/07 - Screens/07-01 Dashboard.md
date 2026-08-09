# Dashboard

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-01 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 9: Dashboard System Specification |
| Last Updated | 2026-08-09 |

## Purpose
The Dashboard is the daily operational headquarters of TinyTots OS. It answers three questions: what happened, what needs attention, and what should be done next.

## Scope
Defines dashboard structure, KPIs, charts, inventory health, actions, activity, alerts, loading/empty states, personalization, role-aware visibility, and performance expectations.

## Screen Architecture
```text
Greeting
↓
Today's KPIs
↓
Revenue Chart
↓
Inventory Health
↓
Quick Actions
↓
Activity Feed
↓
Alerts
```

## Information Hierarchy
The most important business metrics appear above the fold. The dashboard should remain calm even with substantial data and should not become a reporting screen.

## Primary Widgets
- Greeting
- Hero KPI
- KPI Grid: Orders, Products, AOV, Profit
- Revenue Chart
- Inventory Health
- AI Insights
- Recommendations
- Quick Actions
- Top Products
- Category Chart
- Weekly Comparison
- Goal Progress
- Recent Activity
- Alerts
- Status Bar

The redesign limits the dashboard to no more than 10 major widgets at one time.

## Role Behavior
- Administrator: full dashboard.
- Manager: business metrics.
- Cashier: today's sales, recent receipts, and Quick POS.
- Viewer: read-only access.

## States
### Loading State
Use skeletons matching cards, charts, tables, and activity. Layout must not jump.

### Empty State
For new stores, show a welcome/setup checklist including Add First Product, Configure Printer, Create Category, Open POS, and Import Inventory.

### Error State
Use the global error architecture defined by Phase 06.

## Interactions
Widgets may be collapsed, expanded, hidden, or pinned. Moving widgets is a future capability.

## Performance
Dashboard target: under 500ms. Charts are lazy loaded and widgets render independently.

## Implementation Notes
Dashboard consumes Phase 05 design-system rules and Phase 06 shell/global systems. Business logic and data retrieval remain outside presentational widgets.

## TODO
- Verify current dashboard implementation against repository.
- Verify exact current KPI data sources.
- Verify AI Insights implementation status.
- Verify role-specific rendering.

## Related Documents
- Phase 05 — Design System
- Phase 06 — Application Shell
- 07-02 POS.md
- 07-12 Performance.md
- 07-13 Goals.md
- 07-14 Reports.md

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
