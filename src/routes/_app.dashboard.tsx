import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, docTotal, formatINR } from "@/lib/store";
import { ArrowUpRight, FileText, IndianRupee, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const docs = useStore((s) => s.docs);
  const expenses = useStore((s) => s.expenses);
  const user = useStore((s) => s.user);

  const stats = useMemo(() => {
    const invoices = docs.filter((d) => d.kind === "invoice");
    const totalSales = invoices.reduce((s, d) => s + docTotal(d), 0);
    const paid = invoices.filter((d) => d.status === "paid").reduce((s, d) => s + d.paidAmount, 0);
    const unpaid = totalSales - paid;
    const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
    return { totalSales, paid, unpaid, expTotal, count: invoices.length };
  }, [docs, expenses]);

  const recent = docs.slice(0, 5);

  return (
    <AppShell title={`Hi, ${user?.name?.split(" ")[0] ?? "there"}`}>
      {/* Hero balance card */}
      <section className="card-elevated -mt-2 mb-4 rounded-2xl p-4 md:mt-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Receivable</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="font-display text-3xl font-bold text-foreground">{formatINR(stats.unpaid)}</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
            {stats.count} invoices
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="mt-0.5 font-semibold text-success">{formatINR(stats.paid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total sales</p>
            <p className="mt-0.5 font-semibold">{formatINR(stats.totalSales)}</p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-6 grid grid-cols-4 gap-3">
        {[
          { to: "/invoices/new?kind=invoice", label: "Invoice", icon: FileText },
          { to: "/invoices/new?kind=proforma", label: "Proforma", icon: FileText },
          { to: "/expenses", label: "Expense", icon: Wallet },
          { to: "/reports", label: "Reports", icon: TrendingUp },
        ].map((a) => (
          <Link key={a.label} to={a.to as any} className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center transition hover:border-brand/40">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
              <a.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium leading-tight">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* Stat tiles */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="stat-tile">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-success" /> Sales this month
          </div>
          <p className="mt-2 font-display text-xl font-bold">{formatINR(stats.totalSales)}</p>
        </div>
        <div className="stat-tile">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" /> Expenses
          </div>
          <p className="mt-2 font-display text-xl font-bold">{formatINR(stats.expTotal)}</p>
        </div>
      </section>

      {/* Recent */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Recent transactions</h2>
          <Link to="/invoices" className="flex items-center gap-1 text-xs font-semibold text-brand">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="card-elevated divide-y overflow-hidden rounded-2xl">
          {recent.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No invoices yet</p>}
          {recent.map((d) => (
            <Link key={d.id} to="/invoices/$id" params={{ id: d.id }} className="flex items-center gap-3 p-4 transition hover:bg-muted/50">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.partyName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.number} · {new Date(d.date).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatINR(docTotal(d))}</p>
                <StatusBadge status={d.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-success/10 text-success",
    unpaid: "bg-destructive/10 text-destructive",
    partial: "bg-warning/20 text-warning-foreground",
    draft: "bg-muted text-muted-foreground",
  };
  return <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${map[status] ?? ""}`}>{status}</span>;
}
