import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, actions, docTotal, docSubtotal, docTax, formatINR, type LineItem, type DocKind } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/new")({
  validateSearch: (s: Record<string, unknown>) => ({
    kind: (s.kind === "proforma" || s.kind === "quotation" ? s.kind : "invoice") as DocKind,
  }),
  component: NewInvoice,
});

const KIND_LABEL: Record<DocKind, string> = {
  invoice: "Invoice",
  proforma: "Proforma",
  quotation: "Quotation",
};

function nid() { return Math.random().toString(36).slice(2, 10); }

function NewInvoice() {
  const { kind } = Route.useSearch();
  const parties = useStore((s) => s.parties);
  const router = useRouter();

  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: nid(), name: "", qty: 1, rate: 0, taxPct: 18 },
  ]);

  const draft = { items } as any;
  const subtotal = useMemo(() => docSubtotal(draft), [items]);
  const tax = useMemo(() => docTax(draft), [items]);
  const total = subtotal + tax;

  const update = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const save = () => {
    if (!partyId) return toast.error("Select a party");
    if (items.some((i) => !i.name)) return toast.error("Item name required");
    const party = parties.find((p) => p.id === partyId)!;
    actions.addDoc({
      kind,
      partyId,
      partyName: party.name,
      date: new Date(date).toISOString(),
      items,
      notes,
      status: kind === "proforma" ? "draft" : "unpaid",
      paidAmount: 0,
    });
    toast.success(`${kind === "proforma" ? "Proforma" : "Invoice"} created`);
    router.navigate({ to: "/invoices" });
  };

  return (
    <AppShell title={kind === "proforma" ? "New Proforma" : "New Invoice"}>
      <div className="space-y-4 pb-32">
        <section className="card-elevated space-y-4 rounded-2xl p-4">
          <div>
            <Label>Customer</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select party" /></SelectTrigger>
              <SelectContent>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
          </div>
        </section>

        <section className="card-elevated rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-bold">Items</h3>
            <button
              onClick={() => setItems((p) => [...p, { id: nid(), name: "", qty: 1, rate: 0, taxPct: 18 }])}
              className="flex items-center gap-1 text-xs font-semibold text-brand"
            >
              <Plus className="h-3.5 w-3.5" /> Add item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((i, idx) => (
              <div key={i.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  )}
                </div>
                <Input placeholder="Item name" value={i.name} onChange={(e) => update(i.id, { name: e.target.value })} />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px]">Qty</Label>
                    <Input type="number" value={i.qty} onChange={(e) => update(i.id, { qty: +e.target.value || 0 })} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Rate</Label>
                    <Input type="number" value={i.rate} onChange={(e) => update(i.id, { rate: +e.target.value || 0 })} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Tax %</Label>
                    <Input type="number" value={i.taxPct} onChange={(e) => update(i.id, { taxPct: +e.target.value || 0 })} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px]">Unit</Label>
                    <Input placeholder="Pcs / Kg / Ltr" value={i.unit ?? ""} onChange={(e) => update(i.id, { unit: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Category</Label>
                    <Input placeholder="General" value={i.category ?? ""} onChange={(e) => update(i.id, { category: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Barcode / SKU</Label>
                    <Input placeholder="Scan or type" value={i.barcode ?? ""} onChange={(e) => update(i.id, { barcode: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[11px]">HSN / SAC</Label>
                    <Input placeholder="e.g. 998314" value={i.hsn ?? ""} onChange={(e) => update(i.id, { hsn: e.target.value })} />
                  </div>
                </div>
                <p className="mt-2 text-right text-sm font-semibold">{formatINR(i.qty * i.rate * (1 + i.taxPct / 100))}</p>
              </div>
            ))}

          </div>
        </section>

        <section className="card-elevated rounded-2xl p-4">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms & conditions, thank-you message..." className="mt-1.5" />
        </section>

        <section className="card-elevated space-y-1 rounded-2xl p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatINR(tax)}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 font-display text-lg font-bold"><span>Total</span><span>{formatINR(total)}</span></div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card p-3 md:relative md:inset-auto md:mt-4 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-md gap-2 md:max-w-none">
          <Button variant="outline" onClick={() => router.history.back()} className="flex-1">Cancel</Button>
          <Button onClick={save} className="flex-1 brand-gradient font-semibold text-white hover:opacity-95">Save</Button>
        </div>
      </div>
    </AppShell>
  );
}
