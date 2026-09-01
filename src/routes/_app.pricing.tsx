import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Crown, Gem, Hourglass, Shield, Smartphone, Monitor } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useStore, actions, formatINR, type PlanId, type BillingCycle, type PlanDevice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pricing")({
  head: () => ({
    meta: [
      { title: "Plans & Pricing — SunilDemo Billing" },
      { name: "description", content: "Compare SunilDemo Silver, Gold and Diamond billing plans, choose mobile or desktop and renew your subscription." },
      { property: "og:title", content: "Plans & Pricing — SunilDemo Billing" },
      { property: "og:description", content: "Compare SunilDemo Silver, Gold and Diamond billing plans and renew your subscription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  id: Exclude<PlanId, "free">;
  name: string;
  icon: typeof Crown;
  tone: string;
  mrp: { mobile: number; desktop: number };
  price: { mobile: number; desktop: number };
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "silver",
    name: "Silver",
    icon: Shield,
    tone: "text-muted-foreground",
    mrp: { mobile: 1199, desktop: 1999 },
    price: { mobile: 664.05, desktop: 1299 },
    features: [
      "Sync data across devices",
      "Create multiple companies (3 companies)",
      "Remove advertisement on invoices",
      "Set multiple pricing for items",
      "Unlimited invoices & quotations",
      "GST reports & e-mail sharing",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    icon: Crown,
    tone: "text-warning",
    mrp: { mobile: 1399, desktop: 2499 },
    price: { mobile: 795.56, desktop: 1699 },
    features: [
      "Everything in Silver",
      "Unlimited companies",
      "Multi-user access with roles",
      "Invoice print themes & custom logo",
      "Automatic WhatsApp payment reminders",
      "Priority chat support",
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: Gem,
    tone: "text-brand",
    mrp: { mobile: 2499, desktop: 3999 },
    price: { mobile: 1499, desktop: 2499 },
    features: [
      "Everything in Gold",
      "Loyalty points & marketing campaigns",
      "Multi-currency invoicing",
      "Advanced reports (Balance Sheet, Cash Flow)",
      "Automatic cloud backup",
      "Dedicated account manager",
    ],
  },
];

const CYCLES: { id: BillingCycle; label: string; years: number; off: number }[] = [
  { id: "1y", label: "1 Year", years: 1, off: 0 },
  { id: "2y", label: "2 Years", years: 2, off: 10 },
  { id: "3y", label: "3 Years", years: 3, off: 20 },
];

const PAY_METHODS = ["UPI", "Card", "Net Banking", "Wallet"] as const;

function money(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PricingPage() {
  const sub = useStore((s) => s.subscription);
  const [device, setDevice] = useState<PlanDevice>(sub.device);
  const [cycle, setCycle] = useState<BillingCycle>(sub.cycle);
  const [selected, setSelected] = useState<Plan["id"]>(sub.plan === "free" ? "silver" : (sub.plan as Plan["id"]));
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [method, setMethod] = useState<(typeof PAY_METHODS)[number]>("UPI");
  const [paying, setPaying] = useState(false);

  const cycleDef = CYCLES.find((c) => c.id === cycle)!;

  const priceFor = (plan: Plan) => {
    const yearly = plan.price[device];
    const gross = yearly * cycleDef.years;
    const total = gross * (1 - cycleDef.off / 100);
    return { total, perMonth: total / (cycleDef.years * 12), mrp: plan.mrp[device] * cycleDef.years };
  };

  const daysLeft = useMemo(() => {
    const ms = new Date(sub.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 864e5));
  }, [sub.expiresAt]);

  const activePlan = PLANS.find((p) => p.id === sub.plan);
  const expiringSoon = sub.plan !== "free" && daysLeft <= 7;

  const confirmPay = () => {
    if (!checkout) return;
    setPaying(true);
    const amount = priceFor(checkout).total;
    setTimeout(() => {
      actions.subscribePlan({ plan: checkout.id, cycle, device, amount });
      setPaying(false);
      setCheckout(null);
      toast.success(`${checkout.name} plan activated via ${method}`);
    }, 700);
  };

  return (
    <AppShell title="Plans & Pricing">
      <div className="space-y-4 pb-8">
        {/* Status banner */}
        {sub.plan === "free" ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <p className="font-semibold">You are on the Free plan</p>
            <p className="text-muted-foreground">Trial ends in {daysLeft} days. Upgrade to unlock sync, multi-company and advanced reports.</p>
          </div>
        ) : (
          <div className={cn("rounded-xl border p-4 text-sm", expiringSoon ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10")}>
            <p className="flex items-center gap-2 font-semibold">
              <Hourglass className="h-4 w-4" />
              {expiringSoon
                ? `Tick-Tock! Your ${activePlan?.name} plan is expiring in next ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew Now!`
                : `${activePlan?.name} plan active — ${daysLeft} days remaining`}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground">Auto-renew</span>
              <Switch checked={sub.autoRenew} onCheckedChange={(v) => actions.setAutoRenew(v)} />
            </div>
          </div>
        )}

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-muted p-1">
            {([["mobile", Smartphone], ["desktop", Monitor]] as const).map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
                  device === d ? "bg-card text-brand shadow-sm" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {d}
              </button>
            ))}
          </div>
          <div className="flex rounded-full bg-muted p-1">
            {CYCLES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  cycle === c.id ? "bg-card text-brand shadow-sm" : "text-muted-foreground",
                )}
              >
                {c.label}
                {c.off > 0 && <span className="ml-1 text-[10px] font-bold text-success">-{c.off}%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const { total, perMonth, mrp } = priceFor(plan);
            const isSelected = selected === plan.id;
            const isCurrent = sub.plan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={cn(
                  "w-full rounded-2xl border-2 bg-card p-4 text-left transition",
                  isSelected ? "border-brand shadow-lg shadow-brand/10" : "border-border hover:border-brand/40",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("grid h-8 w-8 place-items-center rounded-full bg-muted", plan.tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-display text-lg font-bold">{plan.name}</span>
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full border-2",
                      isSelected ? "border-success bg-success text-success-foreground" : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground line-through">{formatINR(mrp)}</span>
                  <span className="font-display text-3xl font-bold">{money(total)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Only {money(perMonth)} per month</p>

                {isSelected && (
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-2 text-sm font-semibold">{plan.name} Features</p>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Billing history */}
        {sub.history.length > 0 && (
          <div className="rounded-2xl border bg-card p-4">
            <p className="mb-2 font-display text-sm font-bold">Billing history</p>
            <ul className="divide-y">
              {sub.history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium capitalize">{h.plan} · {h.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.date).toLocaleDateString("en-IN")} · {CYCLES.find((c) => c.id === h.cycle)?.label}
                    </p>
                  </div>
                  <span className="font-semibold">{money(h.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sub.plan !== "free" && (
          <Button variant="ghost" className="w-full text-destructive" onClick={() => { actions.cancelPlan(); toast.success("Subscription cancelled"); }}>
            Cancel subscription
          </Button>
        )}

        <div className="h-16" />
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t bg-card/95 p-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-md items-center gap-3 md:max-w-3xl">
          <div className="hidden flex-1 md:block">
            <p className="text-xs text-muted-foreground">Total payable</p>
            <p className="font-display text-lg font-bold">{money(priceFor(PLANS.find((p) => p.id === selected)!).total)}</p>
          </div>
          <Button
            className="h-12 flex-1 rounded-full text-base font-semibold"
            onClick={() => setCheckout(PLANS.find((p) => p.id === selected)!)}
          >
            {sub.plan === selected ? `Renew ${PLANS.find((p) => p.id === selected)!.name}` : `Buy ${PLANS.find((p) => p.id === selected)!.name}`}
          </Button>
        </div>
      </div>

      <Dialog open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout — {checkout?.name}</DialogTitle>
            <DialogDescription>
              {checkout && `${cycleDef.label} · ${device} · ${money(priceFor(checkout).total)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {PAY_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium transition",
                  method === m ? "border-brand bg-accent text-accent-foreground" : "hover:bg-muted",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full" disabled={paying} onClick={confirmPay}>
              {paying ? "Processing…" : `Pay ${checkout ? money(priceFor(checkout).total) : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
