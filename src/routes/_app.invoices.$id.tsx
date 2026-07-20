import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, actions, docSubtotal, docTax, docTotal, formatINR, type PaymentMethod } from "@/lib/store";
import { StatusBadge } from "./_app.dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Printer, Trash2, Banknote, Landmark, Smartphone, ScrollText, CreditCard, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_app/invoices/$id")({
  component: InvoiceDetail,
});

const METHODS: Array<{ id: PaymentMethod; label: string; hint: string; icon: any }> = [
  { id: "cash", label: "Cash", hint: "Received in cash", icon: Banknote },
  { id: "bank", label: "Bank Transfer", hint: "NEFT / IMPS / RTGS", icon: Landmark },
  { id: "upi", label: "UPI", hint: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "cheque", label: "Cheque", hint: "Deposit to bank", icon: ScrollText },
  { id: "card", label: "Card", hint: "Debit / Credit swipe", icon: CreditCard },
  { id: "online", label: "Online Gateway", hint: "Razorpay / Stripe API", icon: Link2 },
];

function InvoiceDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const doc = useStore((s) => s.docs.find((d) => d.id === id));
  const party = useStore((s) => s.parties.find((p) => p.id === doc?.partyId));

  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");

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

  const confirmPaid = () => {
    actions.markPaid(doc.id, method);
    setPayOpen(false);
    if (method === "online") {
      toast.success("Payment link sent — marked as paid (demo)");
    } else {
      toast.success(`Marked as paid via ${METHODS.find((m) => m.id === method)?.label}`);
    }
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
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.qty} {i.unit ?? ""} × {formatINR(i.rate)} · GST {i.taxPct}%
                      </p>
                      {(i.category || i.hsn || i.barcode) && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {i.category && <>#{i.category} </>}
                          {i.hsn && <>· HSN {i.hsn} </>}
                          {i.barcode && <>· {i.barcode}</>}
                        </p>
                      )}
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold">{formatINR(i.qty * i.rate * (1 + i.taxPct / 100))}</p>
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
              <div className="flex justify-between text-success">
                <span>Paid {doc.paymentMethod ? `· ${METHODS.find((m) => m.id === doc.paymentMethod)?.label}` : ""}</span>
                <span>{formatINR(doc.paidAmount)}</span>
              </div>
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
            <Button onClick={() => setPayOpen(true)} className="flex-1 brand-gradient font-semibold text-white hover:opacity-95">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark paid
            </Button>
          )}
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Receive payment</DialogTitle>
            <DialogDescription>
              {formatINR(docTotal(doc))} from <span className="font-semibold">{party?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="grid grid-cols-1 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <Label
                  key={m.id}
                  htmlFor={`pm-${m.id}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${active ? "border-brand bg-brand/5" : ""}`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-brand text-brand-foreground" : "bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
                  </span>
                  <RadioGroupItem id={`pm-${m.id}`} value={m.id} />
                </Label>
              );
            })}
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={confirmPaid} className="brand-gradient flex-1 font-semibold text-white hover:opacity-95">
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
