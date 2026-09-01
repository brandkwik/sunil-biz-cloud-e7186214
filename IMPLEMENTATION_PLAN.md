# Implementation Plan — SunilDemo

## F. Phases

### PHASE 1 — Shell, design system, settings (P0)
- [x] `src/lib/settings.ts` — typed settings models + defaults (`GeneralSettings`, `TransactionSettings`, `ItemSettings`, `PartySettings`, `InvoicePrintSettings` (regular & thermal), `TaxSettings`, `SecuritySettings`). Persisted in store as `appSettings`, migrated on load.
- [x] `src/lib/entitlements.ts` — `FeatureEntitlementService` registry (`featureId`, `title`, `requiredPlan`, `description`) + `useEntitlement`, `PLAN_RANK`.
- [x] `src/lib/reports-catalog.ts` — categorised report registry with keywords/aliases.
- [x] `src/components/settings-ui.tsx` — `SectionCard`, `AppSectionHeader`, `SettingsRow`, `SettingsToggleRow`, `SettingsDropdownRow`, `SettingsNavigationRow`, `SettingsStepperRow`, `SettingsRadioGroup`, `PremiumBadge`, `NewBadge`, `EmptyState`, `PremiumGate`.
- [x] `AppShell` — bottom nav Home / Dashboard / Items / Menu; header with `BusinessSwitcher`, notifications, settings shortcut.
- [x] `/home`, `/menu`, `/items`, `/settings`, `/settings/$section` (general, transaction, invoice-print, taxes-gst, user-management, transaction-sms, reminders, party, item, multicurrency).

### PHASE 2 — Core billing (P0)
- [x] Items module: list/search/filter/low stock, add/edit (SKU, barcode, category, unit, prices, tax, opening/min stock, wholesale, description, image URL).
- [x] Invoice detail: PDF viewer, Print, Share, Duplicate, Edit, Delete.
- [x] Home quick actions wired to existing flows (sale, purchase, expense, payment in/out, party, item).

### PHASE 3 — Inventory, cash/bank, orders (P1/P2)
- [x] Utilities: Manage Companies (edit/archive), Backup/Restore (last backup), Sync & Share (local state).
- [ ] Sale Order / Purchase Order / Delivery Challan doc kinds.
- [ ] Payment-Out ledger for purchases.

### PHASE 4 — Reports (P1/P2)
- [x] Report catalog screen: search (title/keywords/aliases), favourites (persisted), grouped by category, hint text.
- [x] Existing report views reachable from catalog.
- [ ] Additional views: GSTR-2/3B/9, SAC, TDS/TCS, item category, batch/serial, order reports.

### PHASE 5 — Print, backup, sync (P1/P3)
- [x] Print settings model incl. live invoice preview.
- [x] jsPDF-based invoice PDF (uses print settings: page size, orientation, text size, header fields).
- [ ] Thermal ESC/POS driver hooks.
- [ ] Cloud sync (Lovable Cloud) — hooks exist locally.

## G. Files / folders

```text
src/lib/settings.ts             typed settings models + defaults
src/lib/entitlements.ts         feature entitlement service
src/lib/reports-catalog.ts      report registry (categories, keywords)
src/lib/invoice-pdf.ts          jsPDF invoice renderer
src/lib/store.ts                + appSettings, favoriteReports, sync, backupMeta, updateSettings, ...
src/components/settings-ui.tsx  reusable settings/design-system primitives
src/components/business-switcher.tsx
src/components/promo-banner.tsx
src/components/invoice-preview.tsx
src/components/app-shell.tsx    new nav + header
src/routes/_app.home.tsx
src/routes/_app.menu.tsx
src/routes/_app.items.tsx
src/routes/_app.settings.index.tsx
src/routes/_app.settings.$section.tsx
src/routes/_app.utilities.$section.tsx (companies | backup | sync)
src/routes/_app.reports.tsx     catalog + views
```

## Priority key
P0 = core billing · P1 = accounting/inventory · P2 = advanced business · P3 = optional/premium
