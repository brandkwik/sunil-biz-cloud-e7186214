import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  useStore, actions, formatINR, bankBalance, cashBalance,
  type BankAccount, type Cheque, type LoanAccount, type Purchase, type Company,
} from "@/lib/store";
import {
  Landmark, Coins, ScrollText, HandCoins, Building2, RefreshCw,
  ShoppingCart, Star, Settings as SettingsIcon, Receipt, Printer,
  Percent, Package, Globe, Plus, CheckCircle2, Trash2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";

export const Route = createFileRoute("/_app/more/$")({
  component: MorePage,
});

const TITLES: Record<string, { title: string; subtitle: string; icon: any }> = {
  "cash-bank/bank-accounts": { title: "Bank Accounts", subtitle: "Manage bank accounts and transactions", icon: Landmark },
  "cash-bank/cash-in-hand": { title: "Cash in Hand", subtitle: "Track cash inflows and outflows", icon: Coins },
  "cash-bank/cheques": { title: "Cheques", subtitle: "Track received and issued cheques", icon: ScrollText },
  "cash-bank/loan-accounts": { title: "Loan Accounts", subtitle: "Business loans and EMIs", icon: HandCoins },
  "business/purchase": { title: "Purchase", subtitle: "Purchase bills from vendors", icon: ShoppingCart },
  "business/loyalty-points": { title: "Loyalty Points", subtitle: "Rewards from customer sales", icon: Star },
  "utilities/companies": { title: "Companies", subtitle: "Switch between businesses", icon: Building2 },
  "utilities/updates": { title: "Check for Updates", subtitle: "App version & release notes", icon: RefreshCw },
  "settings/general": { title: "General Settings", subtitle: "Business preferences", icon: SettingsIcon },
  "settings/transactions": { title: "Transaction Settings", subtitle: "Defaults for invoices & entries", icon: Receipt },
  "settings/invoice-print": { title: "Invoice Print", subtitle: "Themes, size & branding", icon: Printer },
  "settings/taxes-gst": { title: "Taxes & GST", subtitle: "GST rates and compliance", icon: Percent },
  "settings/item": { title: "Item Settings", subtitle: "Product / service defaults", icon: Package },
  "settings/multicurrency": { title: "Multi-currency", subtitle: "Invoice in multiple currencies", icon: Globe },
};

function MorePage() {
  const params = Route.useParams();
  const path = (params as any)._splat as string;
  const meta = TITLES[path];

  if (!meta) {
    return (
      <AppShell title="Not found">
        <div className="card-elevated rounded-2xl p-8 text-center">
          <p className="font-display text-lg font-bold">Section not found</p>
          <p className="mt-1 text-sm text-muted-foreground">Open the menu and pick a section.</p>
        </div>
      </AppShell>
    );
  }

  const Icon = meta.icon;

  return (
    <AppShell title={meta.title}>
      <div className="space-y-4 pb-8">
        <section className="card-elevated rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">{meta.title}</p>
              <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
            </div>
          </div>
        </section>

        {path === "cash-bank/bank-accounts" && <BankAccountsView />}
        {path === "cash-bank/cash-in-hand" && <CashView />}
        {path === "cash-bank/cheques" && <ChequesView />}
        {path === "cash-bank/loan-accounts" && <LoansView />}
        {path === "business/purchase" && <PurchaseView />}
        {path === "business/loyalty-points" && <LoyaltyView />}
        {path === "utilities/companies" && <CompaniesView />}
        {path === "utilities/updates" && <UpdatesView />}

        {path === "settings/general" && (
          <SettingsGroup
            keys={[
              ["app.passcode", "Enable passcode lock"],
              ["app.backup", "Backup daily to cloud"],
              ["app.sounds", "Sound & haptics"],
            ]}
          />
        )}
        {path === "settings/transactions" && (
          <SettingsGroup
            keys={[
              ["invoice.autoNumber", "Auto-generate invoice number"],
              ["invoice.roundOff", "Round off totals"],
              ["invoice.dueDate", "Show due date on invoice"],
              ["invoice.perItemDiscount", "Enable discount per item"],
            ]}
          />
        )}
        {path === "settings/invoice-print" && (
          <SettingsGroup
            keys={[
              ["print.thermal58", "Print on thermal (58mm)"],
              ["print.logo", "Include company logo"],
              ["print.terms", "Show terms & conditions"],
              ["print.signature", "Show signature line"],
            ]}
          />
        )}
        {path === "settings/taxes-gst" && (
          <SettingsGroup
            keys={[
              ["gst.enabled", "Enable GST"],
              ["tax.tcs", "Enable TCS"],
              ["tax.tds", "Enable TDS"],
              ["tax.composition", "Composition scheme"],
            ]}
          />
        )}
        {path === "settings/item" && <ItemSettingsView />}
        {path === "settings/multicurrency" && <MultiCurrencyView />}
      </div>
    </AppShell>
  );
}

/* ---------- Reusable pieces ---------- */

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-elevated rounded-2xl p-8 text-center">
      <p className="font-display text-sm font-bold">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DialogForm({
  trigger, title, description, children, onSubmit, submitLabel = "Save",
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => boolean | void;
  submitLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="brand-gradient text-white"
            onClick={() => {
              const ok = onSubmit();
              if (ok !== false) setOpen(false);
            }}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${on ? "bg-brand" : "bg-muted"}`}
      aria-pressed={on}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

function SettingsGroup({ keys }: { keys: Array<[string, string]> }) {
  const toggles = useStore((s) => s.settings.toggles);
  return (
    <section className="card-elevated divide-y overflow-hidden rounded-2xl">
      {keys.map(([k, label]) => (
        <div key={k} className="flex items-center justify-between gap-3 p-4">
          <p className="text-sm font-semibold">{label}</p>
          <Toggle on={!!toggles[k]} onClick={() => actions.toggleSetting(k)} />
        </div>
      ))}
    </section>
  );
}

/* ---------- Bank Accounts ---------- */

function BankAccountsView() {
  const banks = useStore((s) => s.bankAccounts);
  const s = useStore((st) => st);

  const [name, setName] = useState("");
  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [opening, setOpening] = useState("0");

  const reset = () => { setName(""); setAcct(""); setIfsc(""); setOpening("0"); };

  return (
    <>
      <DialogForm
        trigger={<Button className="brand-gradient w-full font-semibold text-white"><Plus className="mr-1 h-4 w-4" /> Add Bank Account</Button>}
        title="Add Bank Account"
        onSubmit={() => {
          if (!name.trim() || !acct.trim()) { toast.error("Name and account number required"); return false; }
          actions.addBank({ name: name.trim(), accountNumber: acct.trim(), ifsc: ifsc.trim() || undefined, openingBalance: Number(opening) || 0 });
          toast.success("Bank account added");
          reset();
        }}
      >
        <div><Label>Account name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="HDFC Current" /></div>
        <div><Label>Account number</Label><Input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="XXXX XXXX 4521" /></div>
        <div><Label>IFSC</Label><Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="HDFC0000123" /></div>
        <div><Label>Opening balance</Label><Input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} /></div>
      </DialogForm>

      {banks.length === 0 ? (
        <EmptyState title="No bank accounts yet" hint="Add your first account to track balances." />
      ) : (
        <div className="space-y-3">
          {banks.map((b) => (
            <BankRow key={b.id} bank={b} balance={bankBalance(s, b.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function BankRow({ bank, balance }: { bank: BankAccount; balance: number }) {
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  return (
    <div className="card-elevated rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{bank.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{bank.accountNumber}{bank.ifsc ? ` · ${bank.ifsc}` : ""}</p>
        </div>
        <div className="text-right">
          <p className={`font-display font-bold ${balance < 0 ? "text-destructive" : "text-foreground"}`}>{formatINR(balance)}</p>
          <p className="text-[10px] text-muted-foreground">Balance</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <DialogForm
          trigger={<Button size="sm" variant="outline" className="flex-1"><ArrowDownRight className="mr-1 h-4 w-4 text-success" /> Deposit</Button>}
          title="Deposit to bank"
          onSubmit={() => {
            const a = Number(amt); if (!a) { toast.error("Enter amount"); return false; }
            actions.addBankTxn({ bankId: bank.id, type: "credit", amount: a, date: new Date().toISOString(), note });
            setAmt(""); setNote(""); toast.success("Deposit recorded");
          }}
        >
          <div><Label>Amount</Label><Input type="number" value={amt} onChange={(e) => { setAmt(e.target.value); setType("credit"); }} /></div>
          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
        </DialogForm>
        <DialogForm
          trigger={<Button size="sm" variant="outline" className="flex-1"><ArrowUpRight className="mr-1 h-4 w-4 text-destructive" /> Withdraw</Button>}
          title="Withdraw from bank"
          onSubmit={() => {
            const a = Number(amt); if (!a) { toast.error("Enter amount"); return false; }
            actions.addBankTxn({ bankId: bank.id, type: "debit", amount: a, date: new Date().toISOString(), note });
            setAmt(""); setNote(""); toast.success("Withdrawal recorded");
          }}
        >
          <div><Label>Amount</Label><Input type="number" value={amt} onChange={(e) => { setAmt(e.target.value); setType("debit"); }} /></div>
          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
        </DialogForm>
        <Button size="sm" variant="ghost" onClick={() => { actions.deleteBank(bank.id); toast.success("Deleted"); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {type /* keep var used */ && null}
    </div>
  );
}

/* ---------- Cash ---------- */

function CashView() {
  const entries = useStore((s) => s.cashEntries);
  const bal = useStore((s) => cashBalance(s));
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");

  return (
    <>
      <div className="card-elevated rounded-2xl p-5 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Cash balance</p>
        <p className={`mt-1 font-display text-3xl font-bold ${bal < 0 ? "text-destructive" : "text-foreground"}`}>{formatINR(bal)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DialogForm
          trigger={<Button className="w-full" variant="outline"><ArrowDownRight className="mr-1 h-4 w-4 text-success" /> Cash In</Button>}
          title="Cash In"
          onSubmit={() => {
            const a = Number(amt); if (!a) { toast.error("Enter amount"); return false; }
            actions.addCash({ type: "in", amount: a, date: new Date().toISOString(), note });
            setAmt(""); setNote(""); toast.success("Cash in recorded");
          }}
        >
          <div><Label>Amount</Label><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </DialogForm>
        <DialogForm
          trigger={<Button className="w-full" variant="outline"><ArrowUpRight className="mr-1 h-4 w-4 text-destructive" /> Cash Out</Button>}
          title="Cash Out"
          onSubmit={() => {
            const a = Number(amt); if (!a) { toast.error("Enter amount"); return false; }
            actions.addCash({ type: "out", amount: a, date: new Date().toISOString(), note });
            setAmt(""); setNote(""); toast.success("Cash out recorded");
          }}
        >
          <div><Label>Amount</Label><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
          <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </DialogForm>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No cash entries yet" />
      ) : (
        <section className="card-elevated divide-y overflow-hidden rounded-2xl">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{e.note || (e.type === "in" ? "Cash In" : "Cash Out")}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className={`font-display font-bold ${e.type === "in" ? "text-success" : "text-destructive"}`}>
                  {e.type === "in" ? "+" : "-"}{formatINR(e.amount)}
                </p>
                <Button size="sm" variant="ghost" onClick={() => actions.deleteCash(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

/* ---------- Cheques ---------- */

function ChequesView() {
  const cheques = useStore((s) => s.cheques);
  const [party, setParty] = useState("");
  const [no, setNo] = useState("");
  const [amt, setAmt] = useState("");
  const [dir, setDir] = useState<"received" | "issued">("received");

  return (
    <>
      <DialogForm
        trigger={<Button className="brand-gradient w-full text-white"><Plus className="mr-1 h-4 w-4" /> Add Cheque</Button>}
        title="Add Cheque"
        onSubmit={() => {
          const a = Number(amt);
          if (!party.trim() || !no.trim() || !a) { toast.error("All fields required"); return false; }
          actions.addCheque({
            partyName: party.trim(), chequeNo: no.trim(), amount: a,
            date: new Date().toISOString(), direction: dir, status: "pending",
          });
          setParty(""); setNo(""); setAmt(""); toast.success("Cheque added");
        }}
      >
        <div><Label>Party name</Label><Input value={party} onChange={(e) => setParty(e.target.value)} /></div>
        <div><Label>Cheque number</Label><Input value={no} onChange={(e) => setNo(e.target.value)} /></div>
        <div><Label>Amount</Label><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
        <div>
          <Label>Direction</Label>
          <div className="mt-1 flex gap-2">
            <Button type="button" size="sm" variant={dir === "received" ? "default" : "outline"} onClick={() => setDir("received")}>Received</Button>
            <Button type="button" size="sm" variant={dir === "issued" ? "default" : "outline"} onClick={() => setDir("issued")}>Issued</Button>
          </div>
        </div>
      </DialogForm>

      {cheques.length === 0 ? (
        <EmptyState title="No cheques yet" />
      ) : (
        <section className="card-elevated divide-y overflow-hidden rounded-2xl">
          {cheques.map((c) => <ChequeRow key={c.id} c={c} />)}
        </section>
      )}
    </>
  );
}

function ChequeRow({ c }: { c: Cheque }) {
  const statusColor =
    c.status === "cleared" ? "text-success" : c.status === "bounced" ? "text-destructive" : "text-warning";
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{c.partyName}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            CHQ #{c.chequeNo} · {c.direction} · <span className={statusColor}>{c.status}</span>
          </p>
        </div>
        <p className="font-display font-bold">{formatINR(c.amount)}</p>
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { actions.updateCheque(c.id, { status: "cleared" }); toast.success("Cleared"); }}>Clear</Button>
        <Button size="sm" variant="outline" onClick={() => { actions.updateCheque(c.id, { status: "bounced" }); toast.error("Bounced"); }}>Bounce</Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => actions.deleteCheque(c.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- Loans ---------- */

function LoansView() {
  const loans = useStore((s) => s.loans);
  const [name, setName] = useState("");
  const [lender, setLender] = useState("");
  const [principal, setPrincipal] = useState("");
  const [emi, setEmi] = useState("");
  const [months, setMonths] = useState("");
  const [rate, setRate] = useState("");
  return (
    <>
      <DialogForm
        trigger={<Button className="brand-gradient w-full text-white"><Plus className="mr-1 h-4 w-4" /> Add Loan</Button>}
        title="Add Loan Account"
        onSubmit={() => {
          if (!name.trim()) { toast.error("Name required"); return false; }
          actions.addLoan({
            name: name.trim(), lender: lender.trim(),
            principal: Number(principal) || 0, emi: Number(emi) || 0,
            monthsLeft: Number(months) || 0, rate: Number(rate) || 0,
          });
          setName(""); setLender(""); setPrincipal(""); setEmi(""); setMonths(""); setRate("");
          toast.success("Loan added");
        }}
      >
        <div><Label>Loan name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Lender</Label><Input value={lender} onChange={(e) => setLender(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Principal</Label><Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></div>
          <div><Label>EMI</Label><Input type="number" value={emi} onChange={(e) => setEmi(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Months left</Label><Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} /></div>
          <div><Label>Rate %</Label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        </div>
      </DialogForm>

      {loans.length === 0 ? (
        <EmptyState title="No loans yet" />
      ) : (
        <div className="space-y-3">
          {loans.map((l) => <LoanRow key={l.id} l={l} />)}
        </div>
      )}
    </>
  );
}

function LoanRow({ l }: { l: LoanAccount }) {
  const outstanding = l.emi * l.monthsLeft;
  return (
    <div className="card-elevated rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{l.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{l.lender} · {l.rate}% · {l.monthsLeft} mo left</p>
        </div>
        <p className="font-display font-bold text-destructive">{formatINR(outstanding)}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => { actions.payLoanEmi(l.id); toast.success(`EMI paid: ${formatINR(l.emi)}`); }}>
          Pay EMI ({formatINR(l.emi)})
        </Button>
        <Button size="sm" variant="ghost" onClick={() => actions.deleteLoan(l.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- Purchases ---------- */

function PurchaseView() {
  const purchases = useStore((s) => s.purchases);
  const [vendor, setVendor] = useState("");
  const [amt, setAmt] = useState("");
  return (
    <>
      <DialogForm
        trigger={<Button className="brand-gradient w-full text-white"><Plus className="mr-1 h-4 w-4" /> New Purchase Bill</Button>}
        title="New Purchase Bill"
        onSubmit={() => {
          const a = Number(amt);
          if (!vendor.trim() || !a) { toast.error("Vendor and amount required"); return false; }
          actions.addPurchase({ vendorName: vendor.trim(), amount: a, date: new Date().toISOString(), status: "unpaid" });
          setVendor(""); setAmt(""); toast.success("Purchase added");
        }}
      >
        <div><Label>Vendor</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
        <div><Label>Amount</Label><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
      </DialogForm>

      {purchases.length === 0 ? (
        <EmptyState title="No purchases yet" />
      ) : (
        <section className="card-elevated divide-y overflow-hidden rounded-2xl">
          {purchases.map((p) => <PurchaseRow key={p.id} p={p} />)}
        </section>
      )}
    </>
  );
}

function PurchaseRow({ p }: { p: Purchase }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold">{p.vendorName}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{p.number} · {new Date(p.date).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-display font-bold">{formatINR(p.amount)}</p>
        <Button
          size="sm"
          variant={p.status === "paid" ? "outline" : "default"}
          className={p.status === "paid" ? "" : "brand-gradient text-white"}
          onClick={() => actions.togglePurchasePaid(p.id)}
        >
          {p.status === "paid" ? "Paid" : "Mark Paid"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => actions.deletePurchase(p.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- Loyalty ---------- */

function LoyaltyView() {
  const parties = useStore((s) => s.parties);
  const docs = useStore((s) => s.docs);
  const enabled = useStore((s) => s.settings.toggles["loyalty.enabled"]);
  const auto = useStore((s) => s.settings.toggles["loyalty.autoApply"]);

  const points = parties
    .filter((p) => p.type === "customer")
    .map((p) => {
      const total = docs
        .filter((d) => d.partyId === p.id && d.kind === "invoice" && d.status === "paid")
        .reduce((s, d) => s + d.paidAmount, 0);
      return { party: p, points: Math.floor(total / 100), total };
    })
    .sort((a, b) => b.points - a.points);

  return (
    <>
      <SettingsGroup
        keys={[
          ["loyalty.enabled", "Enable loyalty program"],
          ["loyalty.autoApply", "Auto-apply points at checkout"],
        ]}
      />
      {!enabled ? (
        <EmptyState title="Loyalty disabled" hint="Turn on to earn 1 point per ₹100 spent." />
      ) : (
        <section className="card-elevated rounded-2xl p-4">
          <p className="mb-3 font-display text-sm font-bold">Customers by points {auto && <span className="text-brand">· auto-apply on</span>}</p>
          {points.length === 0 ? (
            <p className="text-xs text-muted-foreground">No customer sales yet.</p>
          ) : (
            <ul className="space-y-2">
              {points.map(({ party, points, total }) => (
                <li key={party.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <div>
                      <p className="font-semibold">{party.name}</p>
                      <p className="text-[10px] text-muted-foreground">Paid: {formatINR(total)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand">{points} pts</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

/* ---------- Companies ---------- */

function CompaniesView() {
  const companies = useStore((s) => s.companies);
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  return (
    <>
      <DialogForm
        trigger={<Button className="brand-gradient w-full text-white"><Plus className="mr-1 h-4 w-4" /> Add Company</Button>}
        title="Add Company"
        onSubmit={() => {
          if (!name.trim()) { toast.error("Name required"); return false; }
          actions.addCompany({ name: name.trim(), gstin: gstin.trim() || undefined });
          setName(""); setGstin(""); toast.success("Company added");
        }}
      >
        <div><Label>Business name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>GSTIN</Label><Input value={gstin} onChange={(e) => setGstin(e.target.value)} /></div>
      </DialogForm>

      <div className="space-y-3">
        {companies.map((c) => <CompanyRow key={c.id} c={c} />)}
      </div>
    </>
  );
}

function CompanyRow({ c }: { c: Company }) {
  return (
    <div className="card-elevated flex items-center justify-between rounded-2xl p-4">
      <div>
        <p className="font-semibold">{c.name} {c.active && <span className="ml-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">Active</span>}</p>
        {c.gstin && <p className="mt-0.5 text-[11px] text-muted-foreground">GSTIN {c.gstin}</p>}
      </div>
      <div className="flex gap-2">
        {!c.active && <Button size="sm" variant="outline" onClick={() => { actions.activateCompany(c.id); toast.success("Switched"); }}>Switch</Button>}
        {!c.active && <Button size="sm" variant="ghost" onClick={() => actions.deleteCompany(c.id)}><Trash2 className="h-4 w-4" /></Button>}
      </div>
    </div>
  );
}

/* ---------- Updates ---------- */

function UpdatesView() {
  const [checking, setChecking] = useState(false);
  return (
    <>
      <SettingsGroup
        keys={[
          ["app.autoUpdate", "Auto-check for updates"],
          ["app.beta", "Beta channel"],
        ]}
      />
      <section className="card-elevated rounded-2xl p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="mt-2 font-display text-lg font-bold">You're up to date</p>
        <p className="text-xs text-muted-foreground">SunilDemo v1.2.0 · Released 15 Jul 2026</p>
        <Button
          className="mt-3"
          variant="outline"
          disabled={checking}
          onClick={() => {
            setChecking(true);
            setTimeout(() => { setChecking(false); toast.success("You're on the latest version"); }, 900);
          }}
        >
          {checking ? "Checking..." : "Check now"}
        </Button>
      </section>
    </>
  );
}

/* ---------- Item settings ---------- */

function ItemSettingsView() {
  return (
    <>
      <SettingsGroup
        keys={[
          ["item.barcode", "Enable barcode scanner"],
          ["item.stock", "Track stock quantity"],
          ["item.category", "Enable item categories"],
          ["item.units", "Enable units (Pcs, Kg, Ltr...)"],
        ]}
      />
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
    </>
  );
}

/* ---------- Multi-currency ---------- */

function MultiCurrencyView() {
  const currency = useStore((s) => s.settings.currency);
  const currencies = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];
  return (
    <>
      <SettingsGroup
        keys={[
          ["multicurrency.enabled", "Enable multi-currency"],
          ["multicurrency.autoRates", "Auto-fetch exchange rates"],
        ]}
      />
      <section className="card-elevated rounded-2xl p-4">
        <p className="mb-2 font-display text-sm font-bold">Base currency</p>
        <div className="flex flex-wrap gap-2">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => { actions.setCurrency(c); toast.success(`Base currency: ${c}`); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${currency === c ? "bg-brand text-white" : "bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
