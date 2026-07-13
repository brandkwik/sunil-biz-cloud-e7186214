import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell, FabAdd } from "@/components/app-shell";
import { useStore, docTotal, formatINR, actions } from "@/lib/store";
import { StatusBadge } from "./_app.dashboard";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const docs = useStore((s) => s.docs);
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "invoice" | "proforma">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (tab !== "all" && d.kind !== tab) return false;
      if (q && !`${d.partyName} ${d.number}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [docs, tab, q]);

  const totals = useMemo(() => {
    const t = filtered.reduce((s, d) => s + docTotal(d), 0);
    const paid = filtered.reduce((s, d) => s + d.paidAmount, 0);
    return { total: t, unpaid: t - paid };
  }, [filtered]);

  return (
    <AppShell title="Invoices">
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="stat-tile">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 font-display text-lg font-bold">{formatINR(totals.total)}</p>
        </div>
        <div className="stat-tile">
          <p className="text-xs text-muted-foreground">Unpaid</p>
          <p className="mt-1 font-display text-lg font-bold text-destructive">{formatINR(totals.unpaid)}</p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 rounded-lg bg-muted p-1 text-xs font-semibold">
        {(["all", "invoice", "proforma"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md py-2 capitalize transition ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {k === "all" ? "All" : k === "invoice" ? "Sale Invoice" : "Proforma"}
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by party or number" className="pl-9" />
      </div>

      <div className="card-elevated divide-y overflow-hidden rounded-2xl">
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">No records</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap + to create your first {tab === "proforma" ? "proforma" : "invoice"}</p>
          </div>
        )}
        {filtered.map((d) => (
          <Link key={d.id} to="/invoices/$id" params={{ id: d.id }} className="flex items-center gap-3 p-4 transition hover:bg-muted/50">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{d.partyName}</p>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {d.number} · {new Date(d.date).toLocaleDateString("en-IN")} · {d.kind === "proforma" ? "Proforma" : "Invoice"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold">{formatINR(docTotal(d))}</p>
              {d.status !== "paid" && d.kind === "invoice" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    actions.markPaid(d.id);
                  }}
                  className="mt-1 text-[11px] font-semibold text-brand hover:underline"
                >
                  Mark paid
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>

      <FabAdd label="New" onClick={() => router.navigate({ to: "/invoices/new", search: { kind: tab === "proforma" ? "proforma" : "invoice" } as any })} />
    </AppShell>
  );
}
