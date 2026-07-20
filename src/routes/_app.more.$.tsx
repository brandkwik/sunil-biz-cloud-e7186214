import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, formatINR } from "@/lib/store";
import {
  Landmark, Coins, ScrollText, HandCoins, Building2, RefreshCw,
  ShoppingCart, Star, Settings as SettingsIcon, Receipt, Printer,
  Percent, Package, Globe, Plus, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/more/$")({
  component: MorePage,
});

type SectionDef = {
  title: string;
  subtitle: string;
  icon: any;
  kind: "accounts" | "list" | "settings";
  seed?: Array<{ name: string; meta?: string; amount?: number }>;
  toggles?: Array<{ label: string; hint?: string; on?: boolean }>;
};

const SECTIONS: Record<string, SectionDef> = {
  "cash-bank/bank-accounts": {
    title: "Bank Accounts", subtitle: "Manage your bank accounts and balances", icon: Landmark, kind: "accounts",
    seed: [
      { name: "HDFC Current A/C", meta: "•••• 4521", amount: 145200 },
      { name: "ICICI Savings", meta: "•••• 8912", amount: 58900 },
    ],
  },
  "cash-bank/cash-in-hand": {
    title: "Cash in Hand", subtitle: "Track your cash balance", icon: Coins, kind: "accounts",
    seed: [{ name: "Cash Drawer", meta: "Physical cash", amount: 24500 }],
  },
  "cash-bank/cheques": {
    title: "Cheques", subtitle: "Deposited & pending cheques", icon: ScrollText, kind: "list",
    seed: [
      { name: "Ravi Traders", meta: "CHQ #234561 · Pending", amount: 12500 },
      { name: "Metro Supplies", meta: "CHQ #001127 · Cleared", amount: 4200 },
    ],
  },
  "cash-bank/loan-accounts": {
    title: "Loan Accounts", subtitle: "Business loans & EMIs", icon: HandCoins, kind: "accounts",
    seed: [{ name: "HDFC Business Loan", meta: "EMI ₹18,500 · 24 months left", amount: -444000 }],
  },
  "business/purchase": {
    title: "Purchase", subtitle: "Purchase bills from vendors", icon: ShoppingCart, kind: "list",
    seed: [
      { name: "Metro Supplies", meta: "PUR-0012 · 12 Jul", amount: 18400 },
      { name: "PrintKart", meta: "PUR-0011 · 05 Jul", amount: 3200 },
    ],
  },
  "business/loyalty-points": {
    title: "Loyalty Points", subtitle: "Reward returning customers", icon: Star, kind: "settings",
    toggles: [
      { label: "Enable loyalty program", hint: "Earn 1 point per ₹100 spent", on: true },
      { label: "Auto-apply points at checkout", on: false },
    ],
  },
  "utilities/companies": {
    title: "Companies", subtitle: "Switch between businesses", icon: Building2, kind: "accounts",
    seed: [
      { name: "SunilDemo Traders", meta: "Active · GSTIN 07ABCDE1234F1Z5" },
      { name: "SunilDemo Retail", meta: "Inactive" },
    ],
  },
  "utilities/updates": {
    title: "Check for Updates", subtitle: "App version & release notes", icon: RefreshCw, kind: "settings",
    toggles: [
      { label: "Auto-check for updates", on: true },
      { label: "Beta channel", on: false },
    ],
  },
  "settings/general": {
    title: "General Settings", subtitle: "Business preferences", icon: SettingsIcon, kind: "settings",
    toggles: [
      { label: "Enable passcode lock", on: false },
      { label: "Backup daily to cloud", on: true },
      { label: "Sound & haptics", on: true },
    ],
  },
  "settings/transactions": {
    title: "Transaction Settings", subtitle: "Defaults for invoices, bills & entries", icon: Receipt, kind: "settings",
    toggles: [
      { label: "Auto-generate invoice number", on: true },
      { label: "Round off totals", on: true },
      { label: "Show due date on invoice", on: true },
      { label: "Enable discount per item", on: false },
    ],
  },
  "settings/invoice-print": {
    title: "Invoice Print", subtitle: "Themes, size & branding", icon: Printer, kind: "settings",
    toggles: [
      { label: "Print on thermal (58mm)", on: false },
      { label: "Include company logo", on: true },
      { label: "Show terms & conditions", on: true },
      { label: "Show signature line", on: true },
    ],
  },
  "settings/taxes-gst": {
    title: "Taxes & GST", subtitle: "GST rates, HSN codes & compliance", icon: Percent, kind: "settings",
    toggles: [
      { label: "Enable GST", on: true },
      { label: "Enable TCS", on: false },
      { label: "Enable TDS", on: false },
      { label: "Composition scheme", on: false },
    ],
  },
  "settings/item": {
    title: "Item Settings", subtitle: "Product / service defaults", icon: Package, kind: "settings",
    toggles: [
      { label: "Enable barcode scanner", on: true },
      { label: "Track stock quantity", on: true },
      { label: "Enable item categories", on: true },
      { label: "Enable units (Pcs, Kg, Ltr...)", on: true },
    ],
  },
  "settings/multicurrency": {
    title: "Multi-currency", subtitle: "Invoice in multiple currencies", icon: Globe, kind: "settings",
    toggles: [
      { label: "Enable multi-currency", on: false },
      { label: "Auto-fetch exchange rates", on: false },
    ],
  },
};

function MorePage() {
  const params = Route.useParams();
  const path = (params as any)._splat as string;
  const parties = useStore((s) => s.parties);

  const section = SECTIONS[path];

  if (!section) {
    return (
      <AppShell title="Coming soon">
        <div className="card-elevated rounded-2xl p-8 text-center">
          <p className="font-display text-lg font-bold">Section not found</p>
          <p className="mt-1 text-sm text-muted-foreground">Open the menu and pick a section.</p>
        </div>
      </AppShell>
    );
  }

  const Icon = section.icon;

  return (
    <AppShell title={section.title}>
      <div className="space-y-4 pb-8">
        <section className="card-elevated rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">{section.title}</p>
              <p className="text-xs text-muted-foreground">{section.subtitle}</p>
            </div>
          </div>
        </section>

        {section.kind === "accounts" && (
          <section className="space-y-3">
            {section.seed?.map((s, i) => (
              <div key={i} className="card-elevated flex items-center justify-between rounded-2xl p-4">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  {s.meta && <p className="mt-0.5 text-xs text-muted-foreground">{s.meta}</p>}
                </div>
                {typeof s.amount === "number" && (
                  <p className={`font-display font-bold ${s.amount < 0 ? "text-destructive" : "text-foreground"}`}>
                    {formatINR(s.amount)}
                  </p>
                )}
              </div>
            ))}
            <Button
              onClick={() => toast.success(`Add ${section.title.split(" ")[0]} — demo`)}
              className="brand-gradient w-full font-semibold text-white"
            >
              <Plus className="mr-1 h-4 w-4" /> Add {section.title.replace(/s$/, "")}
            </Button>
          </section>
        )}

        {section.kind === "list" && (
          <section className="card-elevated divide-y overflow-hidden rounded-2xl">
            {section.seed?.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.name}</p>
                  {s.meta && <p className="mt-0.5 text-xs text-muted-foreground">{s.meta}</p>}
                </div>
                {typeof s.amount === "number" && (
                  <p className="font-display font-bold">{formatINR(s.amount)}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {section.kind === "settings" && (
          <section className="card-elevated divide-y overflow-hidden rounded-2xl">
            {section.toggles?.map((t, i) => (
              <label key={i} className="flex cursor-pointer items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.label}</p>
                  {t.hint && <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>}
                </div>
                <ToggleStub defaultOn={!!t.on} />
              </label>
            ))}
          </section>
        )}

        {path === "settings/item" && (
          <section className="card-elevated rounded-2xl p-4">
            <p className="mb-2 font-display text-sm font-bold">Suggested categories</p>
            <div className="flex flex-wrap gap-2">
              {["General", "Electronics", "Groceries", "Apparel", "Services", "Raw material"].map((c) => (
                <span key={c} className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{c}</span>
              ))}
            </div>
            <p className="mb-2 mt-4 font-display text-sm font-bold">Default units</p>
            <div className="flex flex-wrap gap-2">
              {["Pcs", "Kg", "Gm", "Ltr", "Ml", "Box", "Dozen", "Hour"].map((u) => (
                <span key={u} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{u}</span>
              ))}
            </div>
          </section>
        )}

        {path === "business/loyalty-points" && (
          <section className="card-elevated rounded-2xl p-4">
            <p className="mb-3 font-display text-sm font-bold">Top customers by points</p>
            <ul className="space-y-2">
              {parties.filter((p) => p.type === "customer").slice(0, 5).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-brand">{(5 - i) * 120} pts</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {path === "utilities/updates" && (
          <section className="card-elevated rounded-2xl p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <p className="mt-2 font-display text-lg font-bold">You're up to date</p>
            <p className="text-xs text-muted-foreground">SunilDemo v1.2.0 · Released 15 Jul 2026</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function ToggleStub({ defaultOn }: { defaultOn: boolean }) {
  return (
    <span className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${defaultOn ? "bg-brand" : "bg-muted"}`}>
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${defaultOn ? "translate-x-5" : ""}`} />
    </span>
  );
}
