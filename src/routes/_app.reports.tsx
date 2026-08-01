import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, docTotal, docSubtotal, docTax, formatINR } from "@/lib/store";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { TrendingDown, TrendingUp, IndianRupee, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "pl", label: "Profit & Loss" },
  { id: "balance", label: "Balance Sheet" },
  { id: "cashflow", label: "Cash Flow" },
  { id: "sales", label: "Sale" },
  { id: "purchase", label: "Purchase" },
  { id: "expenses", label: "Expense" },
  { id: "gst", label: "GST / Tax" },
  { id: "ageing", label: "Receivable / Payable" },
  { id: "party", label: "Party" },
  { id: "item", label: "Item / Stock" },
  { id: "cashbank", label: "Cash & Bank" },
  { id: "loans", label: "Loans & Cheques" },
  { id: "quotes", label: "Quotation" },
  { id: "daybook", label: "Day Book" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const docs = useStore((s) => s.docs);
  const expenses = useStore((s) => s.expenses);
  const purchases = useStore((s) => s.purchases);
  const parties = useStore((s) => s.parties);
  const cashEntries = useStore((s) => s.cashEntries);
  const bankTxns = useStore((s) => s.bankTxns);
  const bankAccounts = useStore((s) => s.bankAccounts);

  const [tab, setTab] = useState<TabId>("overview");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inRange = useMemo(() => {
    const f = from ? new Date(from).getTime() : -Infinity;
    const t = to ? new Date(to).getTime() + 864e5 - 1 : Infinity;
    return (d: string) => {
      const x = new Date(d).getTime();
      return x >= f && x <= t;
    };
  }, [from, to]);

  const sales = docs.filter((d) => d.kind === "invoice" && inRange(d.date));
  const quotes = docs.filter((d) => d.kind !== "invoice" && inRange(d.date));
  const exps = expenses.filter((e) => inRange(e.date));
  const purs = purchases.filter((p) => inRange(p.date));

  const salesTotal = sales.reduce((s, d) => s + docTotal(d), 0);
  const salesNet = sales.reduce((s, d) => s + docSubtotal(d), 0);
  const outputTax = sales.reduce((s, d) => s + docTax(d), 0);
  const paidTotal = sales.reduce((s, d) => s + d.paidAmount, 0);
  const unpaid = salesTotal - paidTotal;
  const expTotal = exps.reduce((s, e) => s + e.amount, 0);
  const purTotal = purs.reduce((s, p) => s + p.amount, 0);
  const grossProfit = salesNet - purTotal;
  const netProfit = grossProfit - expTotal;

  const monthly = useMemo(() => {
    const map: Record<string, { month: string; sales: number; expenses: number }> = {};
    const monthKey = (d: Date) => d.toLocaleDateString("en-IN", { month: "short" });
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const k = monthKey(d);
      map[k] = { month: k, sales: 0, expenses: 0 };
    }
    sales.forEach((d) => {
      const k = monthKey(new Date(d.date));
      if (map[k]) map[k].sales += docTotal(d);
    });
    exps.forEach((e) => {
      const k = monthKey(new Date(e.date));
      if (map[k]) map[k].expenses += e.amount;
    });
    return Object.values(map);
  }, [sales, exps]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    exps.forEach((e) => { m[e.category] = (m[e.category] ?? 0) + e.amount; });
    return Object.entries(m).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [exps]);

  const itemRows = useMemo(() => {
    const m: Record<string, { name: string; qty: number; amount: number; tax: number }> = {};
    sales.forEach((d) =>
      d.items.forEach((i) => {
        const k = i.name || "Unnamed";
        m[k] = m[k] ?? { name: k, qty: 0, amount: 0, tax: 0 };
        m[k].qty += i.qty;
        m[k].amount += i.qty * i.rate;
        m[k].tax += (i.qty * i.rate * i.taxPct) / 100;
      }),
    );
    return Object.values(m).sort((a, b) => b.amount - a.amount);
  }, [sales]);

  const gstSlabs = useMemo(() => {
    const m: Record<number, { pct: number; taxable: number; tax: number }> = {};
    sales.forEach((d) =>
      d.items.forEach((i) => {
        m[i.taxPct] = m[i.taxPct] ?? { pct: i.taxPct, taxable: 0, tax: 0 };
        m[i.taxPct].taxable += i.qty * i.rate;
        m[i.taxPct].tax += (i.qty * i.rate * i.taxPct) / 100;
      }),
    );
    return Object.values(m).sort((a, b) => a.pct - b.pct);
  }, [sales]);

  const partyRows = useMemo(
    () =>
      parties.map((p) => {
        const ds = sales.filter((d) => d.partyId === p.id);
        const total = ds.reduce((s, d) => s + docTotal(d), 0);
        const paid = ds.reduce((s, d) => s + d.paidAmount, 0);
        return { ...p, count: ds.length, total, due: total - paid };
      }),
    [parties, sales],
  );

  const dayBook = useMemo(() => {
    type Row = { date: string; type: string; ref: string; inAmt: number; outAmt: number };
    const rows: Row[] = [];
    sales.forEach((d) => rows.push({ date: d.date, type: "Sale", ref: `${d.number} · ${d.partyName}`, inAmt: docTotal(d), outAmt: 0 }));
    purs.forEach((p) => rows.push({ date: p.date, type: "Purchase", ref: `${p.number} · ${p.vendorName}`, inAmt: 0, outAmt: p.amount }));
    exps.forEach((e) => rows.push({ date: e.date, type: "Expense", ref: `${e.category}${e.note ? ` · ${e.note}` : ""}`, inAmt: 0, outAmt: e.amount }));
    cashEntries.filter((c) => inRange(c.date)).forEach((c) =>
      rows.push({ date: c.date, type: `Cash ${c.type}`, ref: c.note ?? "Cash entry", inAmt: c.type === "in" ? c.amount : 0, outAmt: c.type === "out" ? c.amount : 0 }),
    );
    bankTxns.filter((b) => inRange(b.date)).forEach((b) =>
      rows.push({
        date: b.date,
        type: `Bank ${b.type}`,
        ref: `${bankAccounts.find((a) => a.id === b.bankId)?.name ?? "Bank"}${b.note ? ` · ${b.note}` : ""}`,
        inAmt: b.type === "credit" ? b.amount : 0,
        outAmt: b.type === "debit" ? b.amount : 0,
      }),
    );
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, purs, exps, cashEntries, bankTxns, bankAccounts, inRange]);

  const cashIn = cashEntries.filter((c) => inRange(c.date) && c.type === "in").reduce((s, c) => s + c.amount, 0);
  const cashOut = cashEntries.filter((c) => inRange(c.date) && c.type === "out").reduce((s, c) => s + c.amount, 0);
  const bankIn = bankTxns.filter((b) => inRange(b.date) && b.type === "credit").reduce((s, b) => s + b.amount, 0);
  const bankOut = bankTxns.filter((b) => inRange(b.date) && b.type === "debit").reduce((s, b) => s + b.amount, 0);

  const exportCurrent = () => {
    if (tab === "sales") downloadCsv("sale-report", [["Number", "Party", "Date", "Total", "Paid", "Status"], ...sales.map((d) => [d.number, d.partyName, new Date(d.date).toLocaleDateString("en-IN"), Math.round(docTotal(d)), Math.round(d.paidAmount), d.status])]);
    else if (tab === "purchase") downloadCsv("purchase-report", [["Number", "Vendor", "Date", "Amount", "Status"], ...purs.map((p) => [p.number, p.vendorName, new Date(p.date).toLocaleDateString("en-IN"), p.amount, p.status])]);
    else if (tab === "expenses") downloadCsv("expense-report", [["Category", "Date", "Amount", "Note"], ...exps.map((e) => [e.category, new Date(e.date).toLocaleDateString("en-IN"), e.amount, e.note ?? ""])]);
    else if (tab === "gst") downloadCsv("gst-report", [["Rate %", "Taxable", "Tax"], ...gstSlabs.map((g) => [g.pct, Math.round(g.taxable), Math.round(g.tax)])]);
    else if (tab === "party") downloadCsv("party-report", [["Party", "Type", "Invoices", "Sales", "Due"], ...partyRows.map((p) => [p.name, p.type, p.count, Math.round(p.total), Math.round(p.due)])]);
    else if (tab === "item") downloadCsv("item-report", [["Item", "Qty", "Amount", "Tax"], ...itemRows.map((i) => [i.name, i.qty, Math.round(i.amount), Math.round(i.tax)])]);
    else if (tab === "daybook") downloadCsv("day-book", [["Date", "Type", "Details", "In", "Out"], ...dayBook.map((r) => [new Date(r.date).toLocaleDateString("en-IN"), r.type, r.ref, Math.round(r.inAmt), Math.round(r.outAmt)])]);
    else downloadCsv("profit-loss", [["Head", "Amount"], ["Sales (net)", Math.round(salesNet)], ["GST collected", Math.round(outputTax)], ["Purchases", Math.round(purTotal)], ["Gross profit", Math.round(grossProfit)], ["Expenses", Math.round(expTotal)], ["Net profit", Math.round(netProfit)]]);
  };

  return (
    <AppShell title="Reports">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "brand-gradient text-white" : "bg-muted text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-elevated mb-4 flex items-end gap-2 rounded-2xl p-3">
        <div className="flex-1">
          <Label className="text-[10px] uppercase text-muted-foreground">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-9" />
        </div>
        <div className="flex-1">
          <Label className="text-[10px] uppercase text-muted-foreground">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-9" />
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={exportCurrent}>
          <Download className="mr-1 h-4 w-4" /> CSV
        </Button>
      </div>

      {tab === "overview" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Tile label="Total sales" value={formatINR(salesTotal)} icon={<TrendingUp className="h-4 w-4 text-success" />} />
            <Tile label="Received" value={formatINR(paidTotal)} icon={<IndianRupee className="h-4 w-4 text-brand" />} />
            <Tile label="Unpaid" value={formatINR(unpaid)} tone="danger" icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
            <Tile label="Expenses" value={formatINR(expTotal)} tone="danger" icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
          </div>

          <Card title="Sales vs Expenses" right={<span className={`text-xs font-semibold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>Net {formatINR(netProfit)}</span>}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0.005 20)" />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
                  <Tooltip formatter={(v: any) => formatINR(v as number)} />
                  <Bar dataKey="sales" fill="var(--color-brand)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="oklch(0.75 0.05 20)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Quotations & Proforma">
            <Row label="Documents" value={String(quotes.length)} />
            <Row label="Value" value={formatINR(quotes.reduce((s, d) => s + docTotal(d), 0))} />
          </Card>
        </>
      )}

      {tab === "pl" && (
        <Card title="Profit & Loss">
          <Row label="Sales (taxable value)" value={formatINR(salesNet)} />
          <Row label="GST collected" value={formatINR(outputTax)} />
          <Row label="Purchases" value={`- ${formatINR(purTotal)}`} />
          <Row label="Gross profit" value={formatINR(grossProfit)} bold />
          <Row label="Indirect expenses" value={`- ${formatINR(expTotal)}`} />
          <div className="mt-2 flex justify-between border-t pt-3 font-display text-lg font-bold">
            <span>Net profit</span>
            <span className={netProfit >= 0 ? "text-success" : "text-destructive"}>{formatINR(netProfit)}</span>
          </div>
        </Card>
      )}

      {tab === "sales" && (
        <Card title="Sale report" right={<span className="text-xs font-semibold">{formatINR(salesTotal)}</span>}>
          <Table
            head={["Invoice", "Total", "Due"]}
            rows={sales.map((d) => [`${d.number}\n${d.partyName}`, formatINR(docTotal(d)), formatINR(docTotal(d) - d.paidAmount)])}
          />
        </Card>
      )}

      {tab === "purchase" && (
        <Card title="Purchase report" right={<span className="text-xs font-semibold">{formatINR(purTotal)}</span>}>
          <Table head={["Bill", "Amount", "Status"]} rows={purs.map((p) => [`${p.number}\n${p.vendorName}`, formatINR(p.amount), p.status])} />
        </Card>
      )}

      {tab === "expenses" && (
        <>
          <Card title="Expenses by category" right={<span className="text-xs font-semibold">{formatINR(expTotal)}</span>}>
            {byCat.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No expense data</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCat} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.9 0.005 20)" />
                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="category" type="category" fontSize={11} tickLine={false} axisLine={false} width={70} />
                    <Tooltip formatter={(v: any) => formatINR(v as number)} />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                      {byCat.map((_, i) => <Cell key={i} fill="var(--color-brand)" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          <Card title="Expense entries">
            <Table head={["Category", "Date", "Amount"]} rows={exps.map((e) => [`${e.category}\n${e.note ?? ""}`, new Date(e.date).toLocaleDateString("en-IN"), formatINR(e.amount)])} />
          </Card>
        </>
      )}

      {tab === "gst" && (
        <>
          <Card title="GSTR-1 summary (outward)">
            <Table head={["Rate", "Taxable", "Tax"]} rows={gstSlabs.map((g) => [`${g.pct}%`, formatINR(g.taxable), formatINR(g.tax)])} />
          </Card>
          <Card title="Tax liability">
            <Row label="Output GST (sales)" value={formatINR(outputTax)} />
            <Row label="Taxable turnover" value={formatINR(salesNet)} />
            <Row label="Net payable" value={formatINR(outputTax)} bold />
          </Card>
        </>
      )}

      {tab === "party" && (
        <Card title="Party statement">
          <Table head={["Party", "Sales", "Due"]} rows={partyRows.map((p) => [`${p.name}\n${p.type} · ${p.count} bills`, formatINR(p.total), formatINR(p.due)])} />
        </Card>
      )}

      {tab === "item" && (
        <Card title="Item / stock sale report">
          <Table head={["Item", "Qty sold", "Amount"]} rows={itemRows.map((i) => [i.name, String(i.qty), formatINR(i.amount)])} />
        </Card>
      )}

      {tab === "cashbank" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Tile label="Cash in" value={formatINR(cashIn)} icon={<TrendingUp className="h-4 w-4 text-success" />} />
            <Tile label="Cash out" value={formatINR(cashOut)} tone="danger" icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
            <Tile label="Bank credit" value={formatINR(bankIn)} icon={<TrendingUp className="h-4 w-4 text-success" />} />
            <Tile label="Bank debit" value={formatINR(bankOut)} tone="danger" icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
          </div>
          <Card title="Bank accounts">
            <Table head={["Account", "Opening", "A/c No."]} rows={bankAccounts.map((b) => [b.name, formatINR(b.openingBalance), b.accountNumber])} />
          </Card>
        </>
      )}

      {tab === "daybook" && (
        <Card title="Day book" right={<span className="text-xs font-semibold">{dayBook.length} entries</span>}>
          <Table
            head={["Details", "In", "Out"]}
            rows={dayBook.map((r) => [`${r.type}\n${r.ref} · ${new Date(r.date).toLocaleDateString("en-IN")}`, r.inAmt ? formatINR(r.inAmt) : "—", r.outAmt ? formatINR(r.outAmt) : "—"])}
          />
        </Card>
      )}
    </AppShell>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card-elevated mb-4 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-bold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No data for this period</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-[10px] uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} className={`pb-2 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={`py-2.5 align-top ${ci === 0 ? "pr-3" : "whitespace-nowrap text-right font-medium"}`}>
                  {ci === 0 ? (
                    <span className="block">
                      <span className="block font-medium">{c.split("\n")[0]}</span>
                      {c.split("\n")[1] && <span className="block text-[11px] text-muted-foreground">{c.split("\n")[1]}</span>}
                    </span>
                  ) : (
                    c
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tile({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: "danger" }) {
  return (
    <div className="stat-tile">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <p className={`mt-2 font-display text-xl font-bold ${tone === "danger" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
