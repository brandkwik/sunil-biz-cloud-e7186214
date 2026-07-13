import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, docTotal, formatINR } from "@/lib/store";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { TrendingDown, TrendingUp, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const docs = useStore((s) => s.docs);
  const expenses = useStore((s) => s.expenses);

  const salesTotal = docs.filter((d) => d.kind === "invoice").reduce((s, d) => s + docTotal(d), 0);
  const paidTotal = docs.filter((d) => d.kind === "invoice").reduce((s, d) => s + d.paidAmount, 0);
  const unpaid = salesTotal - paidTotal;
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = paidTotal - expTotal;

  const monthly = useMemo(() => {
    const map: Record<string, { month: string; sales: number; expenses: number }> = {};
    const monthKey = (d: Date) => d.toLocaleDateString("en-IN", { month: "short" });
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const k = monthKey(d);
      map[k] = { month: k, sales: 0, expenses: 0 };
    }
    docs.forEach((d) => {
      if (d.kind !== "invoice") return;
      const k = monthKey(new Date(d.date));
      if (map[k]) map[k].sales += docTotal(d);
    });
    expenses.forEach((e) => {
      const k = monthKey(new Date(e.date));
      if (map[k]) map[k].expenses += e.amount;
    });
    return Object.values(map);
  }, [docs, expenses]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach((e) => { m[e.category] = (m[e.category] ?? 0) + e.amount; });
    return Object.entries(m).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <AppShell title="Reports">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Tile label="Total sales" value={formatINR(salesTotal)} icon={<TrendingUp className="h-4 w-4 text-success" />} />
        <Tile label="Received" value={formatINR(paidTotal)} icon={<IndianRupee className="h-4 w-4 text-brand" />} />
        <Tile label="Unpaid" value={formatINR(unpaid)} tone="danger" icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
        <Tile label="Expenses" value={formatINR(expTotal)} tone="danger" icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
      </div>

      <section className="card-elevated mb-4 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-bold">Sales vs Expenses</h3>
          <span className={`text-xs font-semibold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
            Net {formatINR(profit)}
          </span>
        </div>
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
      </section>

      <section className="card-elevated rounded-2xl p-4">
        <h3 className="mb-3 font-display font-bold">Expenses by category</h3>
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
      </section>
    </AppShell>
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
