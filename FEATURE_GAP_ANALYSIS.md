# Feature Gap Analysis — SunilDemo Billing / Inventory / Accounting

## A. Existing architecture assessment

| Layer | Current state | Assessment |
|---|---|---|
| Framework | TanStack Start v1 (React 19, Vite 7, Tailwind v4, shadcn) | Keep. Mobile-first shell already exists (`src/components/app-shell.tsx`). |
| Routing | `src/routes/_app.*` behind a localStorage session guard (`_app.tsx`) | Keep. Add `/home`, `/items`, `/menu`, `/settings/*`, `/utilities/*`. |
| State | Single external store `src/lib/store.ts` (`useSyncExternalStore`, localStorage `sunildemo:v2`) with `actions` | Acts as repository + service layer in one file. Acceptable for offline-first local storage; split into `src/lib/domain/*` as it grows. |
| Entities | Party, Item, StockMove, InvoiceDoc (invoice/proforma/quotation/estimate/credit_note), Payment, Purchase (bill/debit_note), Expense, OtherIncome, BankAccount, BankTxn, CashEntry, Cheque, LoanAccount, Company, Subscription, Business | Good coverage. Missing: `businessId` scoping, SaleOrder / PurchaseOrder / DeliveryChallan, Warehouse, ExpenseCategory, Unit, Tax master, Transaction ledger, settings models, FeatureEntitlement, BackupMetadata. |
| Settings | `settings.toggles: Record<string, boolean>` (flat booleans) | Violates requirement 26. Replace with typed models (`GeneralSettings`, `TransactionSettings`, `ItemSettings`, `PartySettings`, `InvoicePrintSettings`, `TaxSettings`, `SecuritySettings`) in `src/lib/settings.ts`. |
| Premium | Subscription state exists; no gating | Add `FeatureEntitlementService` (`src/lib/entitlements.ts`) with feature registry + `useEntitlement`. |
| Reports | 15+ working reports in a tab strip (`_app.reports.tsx`) | Works but not searchable / favourite-able / categorised. Add report catalog + favourites. |
| Printing | None (no PDF, no print, no share) | Add PDF generation (jsPDF), in-app PDF viewer, `window.print`, Web Share. |
| Navigation | Bottom nav Home/Invoices/Parties/Expenses/Reports; hamburger drawer | Replace with Home / Dashboard / Items / Menu + header business switcher, notifications, settings shortcut. |

## B. Gap table

| Existing feature | Required feature | Current implementation | Missing components | Recommended implementation | Files | Priority |
|---|---|---|---|---|---|---|
| Bottom nav (5 tabs) | Home, Dashboard, Items, Menu | `app-shell.tsx` NAV | Items & Menu tabs, header switcher, settings shortcut | Rework `AppShell`; add `BusinessSwitcher` | `app-shell.tsx`, `_app.home.tsx`, `_app.items.tsx`, `_app.menu.tsx` | P0 |
| Hamburger drawer | Menu screen with sections + expandable rows | Sheet in `AppShell` | Expandable Sale/Purchase groups, Online Store, utilities, Others, version | `_app.menu.tsx` with `SectionCard` + `Collapsible` | `_app.menu.tsx` | P0 |
| Flat toggles | Centralised settings models | `settings.toggles` | Typed models, per-section screens, persistence, search | `src/lib/settings.ts`, `actions.updateSettings` | `store.ts`, `settings.ts`, `_app.settings.*` | P0 |
| — | Settings main screen w/ search, badges | none | `SettingsNavigationRow`, `PremiumBadge`, `NewBadge`, search | `_app.settings.index.tsx` | P0 |
| Partial General settings | Application / Security / Multi-firm / Godown / Backup / More transactions | 3 toggles | Language, currency, decimals, date format, theme, feature toggles | `_app.settings.$section.tsx` (general) | P0 |
| Partial Transaction settings | Header / Items table / Tax & totals / More / GST / Prefixes | 4 toggles | Barcode type, round-off config, share-as, prefixes per firm | same (transaction) | P0 |
| Partial Item settings | Item type, barcode, POS default, stock, mfg, units, category, party rate, wholesale | 4 toggles | Premium lock, radios | same (item) | P1 |
| Partial Print settings | Regular/Thermal tabs, theme, text size, page size, orientation, header fields, live preview | 4 toggles | Full model + `InvoicePreview` | same (invoice-print), `invoice-preview.tsx` | P1 |
| — | Party settings | none | GSTIN, grouping, additional fields, shipping, loyalty | same (party) | P1 |
| — | User management, Transaction SMS, Reminders | none | local models + screens | same | P2 |
| Subscription state | FeatureEntitlementService + premium gating | `subscription.plan` | registry, hook, upgrade dialog | `entitlements.ts`, `PremiumGate` | P0 |
| Report tabs | Searchable, categorised, favourite reports | tab strip | catalog, favourites persisted, search w/ aliases | `reports-catalog.ts`, `_app.reports.tsx` | P1 |
| Existing reports (P&L, BS, CF, GST, ageing…) | GSTR-2/3B/9, SAC, TDS/TCS, item category, batch/serial, order reports, loan statement | subset present | additional report views | `_app.reports.tsx` | P2 |
| Dashboard (basic KPIs) | Today's / financial / inventory cards + trends + date filters | 4 KPIs | filters, charts, inventory cards | `_app.dashboard.tsx` | P1 |
| — | Home overview + quick actions + banner | none | `PromoBanner`, quick-action grid | `_app.home.tsx` | P0 |
| Items master (inline in `/more/settings/item`) | Items tab with search/filters/low stock, add/edit form incl. wholesale, description, image | partial | full screen + form | `_app.items.tsx` | P0 |
| Parties | Credit limit/period, group, shipping, custom fields | name/phone/type | extended form | `store.ts` Party type, `_app.parties.tsx` | P1 |
| Invoice flow | Save & Print, Share, PDF, Duplicate, Edit, Delete; additional charges, round off | save/convert/pay/return/delete | PDF viewer, share, print, duplicate, edit | `invoice-pdf.ts`, `_app.invoices.$id.tsx` | P0 |
| Purchase | Payment Out, PO, purchase order reports | bill/debit note | PO type, payment-out ledger | `store.ts`, purchase screen | P2 |
| — | Sale Order, Delivery Challan | none | doc kinds `sale_order`, `challan` | `store.ts` | P2 |
| Companies | Manage Companies (create/switch/edit/archive) | add/activate/delete | edit, archive | `_app.utilities.companies.tsx` | P1 |
| Backup export/import | Backup/Restore w/ last-backup date | export/import JSON | metadata + screen | `_app.utilities.backup.tsx` | P1 |
| — | Sync & Share status | none | local sync model (enabled, accountId, lastSyncAt) | `_app.utilities.sync.tsx` | P2 |
| — | Online store | none | local product visibility + orders model | P3 | P3 |

## C. Entity design (target)

All business records carry `businessId` (active company). UUID via `crypto.randomUUID()`.

```text
Business ──< Party, Item, ItemCategory, Unit, Tax, Warehouse
Business ──< InvoiceDoc(kind: invoice|proforma|quotation|estimate|credit_note|sale_order|challan) ──< LineItem
Business ──< Purchase(kind: bill|debit_note|purchase_order) ──< LineItem
InvoiceDoc ──< Payment (payment-in)          Purchase ──< Payment (payment-out)
Business ──< Expense (category), OtherIncome
Business ──< BankAccount ──< BankTxn ; CashEntry ; Cheque ; LoanAccount
Item ──< StockMove (from invoice / purchase / return / adjustment / transfer)
Business ── AppSettings {general, transaction, item, party, print{regular,thermal}, tax, security}
User ── Subscription ── FeatureEntitlement (derived, not stored)
Business ── BackupMetadata, SyncState
```

## D. Feature dependency map

```text
Sale Invoice ─► Party.balance ─► Receivables report / Party statement
             ─► StockMove ─► Item.stock ─► Stock reports / Low stock
             ─► Payment ─► CashEntry | BankTxn ─► Cash & Bank report / Cashflow
             ─► Sales report ─► P&L ─► Balance sheet ─► Dashboard
Purchase     ─► Party.balance (payable) ─► StockMove(+) ─► Payment-out ─► Cash/Bank
Expense      ─► Cash/Bank ─► Expense reports ─► P&L
Credit/Debit note ─► reverse of the above
Settings.transaction ─► invoice numbering, round-off, tax mode, prefixes
Settings.print ─► PDF / print rendering
Subscription ─► FeatureEntitlementService ─► premium rows/badges everywhere
```

## E. Missing feature report (summary)

P0 missing: 4-tab nav, Menu screen, Settings hub + General/Transaction, typed settings, entitlement service, Home, Items tab, PDF/print/share.
P1 missing: Item/Party/Print settings, report catalog + favourites + search, dashboard filters/charts, party extended fields, companies management, backup metadata.
P2 missing: Sale/Purchase orders, challans, payment-out ledger, user mgmt, SMS, reminders, sync, extra GST/TDS/TCS/batch reports.
P3 missing: Online store, referral, desktop app links, thermal printer hardware.
