import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, actions, docSubtotal, docTax, docTotal, formatINR } from "@/lib/store";
import { StatusBadge } from "./_app.dashboard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/$id")({
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const doc = useStore((s) => s.docs.find((d) => d.id === id));
  const party = useStore((s) => s.parties.find((p) => p.id === doc?.partyId));

  if (!doc) {
    return (
      <AppShell title="Not found">
        <p className="text-sm text-muted-foreground">This document doesn't exist.</p>
      </AppShell>
    );
  }

  const del = () => {
    actions.deleteDoc(doc.id);
    toast.success("Deleted");
    router.navigate({ to: "/invoices" });
  };

  return (
    <AppShell title={doc.number}>
      <div className="space-y-4 pb-32">
        <section className="card-elevated rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{doc.kind === "proforma" ? "Proforma Invoice" : "Tax Invoice"}</p>
              <h2 className="mt-1 font-display text-xl font-bold">{doc.number}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(doc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <StatusBadge status={doc.status} />
          </div>

          <div className="mt-5 rounded-xl bg-muted/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Billed to</p>
            <p className="mt-1 font-semibold">{party?.name}</p>
            {party?.phone && <p className="text-xs text-muted-foreground">{party.phone}</p>}
            {party?.gstin && <p className="text-xs text-muted-foreground">GSTIN: {party.gstin}</p>}
          </div>

          <div className="mt-5">
            <div className="flex justify-between border-b pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Item</span><span>Amount</span>
            </div>
            <ul className="divide-y">
              {doc.items.map((i) => (
                <li key={i.id} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.qty} × {formatINR(i.rate)} · GST {i.taxPct}%</p>
                    </div>
                    <p className="text-sm font-semibold">{formatINR(i.qty * i.rate * (1 + i.taxPct / 100))}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(docSubtotal(doc))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{formatINR(docTax(doc))}</span></div>
            <div className="mt-2 flex justify-between border-t pt-2 font-display text-lg font-bold">
              <span>Total</span><span className="text-brand">{formatINR(docTotal(doc))}</span>
            </div>
            {doc.paidAmount > 0 && (
              <div className="flex justify-between text-success"><span>Paid</span><span>{formatINR(doc.paidAmount)}</span></div>
            )}
          </div>

          {doc.notes && (
            <div className="mt-5 rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{doc.notes}</p>
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card p-3 md:relative md:inset-auto md:mt-4 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-md gap-2 md:max-w-none">
          <Button variant="outline" onClick={del} className="text-destructive">
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="flex-1">
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
          {doc.status !== "paid" && doc.kind === "invoice" && (
            <Button onClick={() => { actions.markPaid(doc.id); toast.success("Marked as paid"); }} className="flex-1 brand-gradient font-semibold text-white hover:opacity-95">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark paid
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
