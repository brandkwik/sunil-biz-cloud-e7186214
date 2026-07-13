import { createFileRoute } from "@tanstack/react-router";
import { AppShell, FabAdd } from "@/components/app-shell";
import { useStore, actions, formatINR } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Trash2, Receipt } from "lucide-react";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Travel", "Marketing", "Supplies", "Other"];

export const Route = createFileRoute("/_app/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const expenses = useStore((s) => s.expenses);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [vendor, setVendor] = useState("");

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const save = () => {
    const amt = +amount;
    if (!amt) return toast.error("Enter amount");
    actions.addExpense({
      category, amount: amt, note, vendor,
      date: new Date().toISOString(),
    });
    toast.success("Expense added");
    setOpen(false); setAmount(""); setNote(""); setVendor("");
  };

  return (
    <AppShell title="Expenses">
      <div className="card-elevated mb-4 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground">Total expenses</p>
        <p className="mt-1 font-display text-2xl font-bold">{formatINR(total)}</p>
      </div>

      <div className="card-elevated divide-y overflow-hidden rounded-2xl">
        {expenses.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No expenses yet</p>}
        {expenses.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
              <Receipt className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.category}</p>
              <p className="truncate text-xs text-muted-foreground">{e.note || e.vendor || "—"} · {new Date(e.date).toLocaleDateString("en-IN")}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-display font-bold text-destructive">-{formatINR(e.amount)}</p>
              <button onClick={() => actions.deleteExpense(e.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <FabAdd label="Add" onClick={() => setOpen(true)} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Vendor (optional)</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="brand-gradient text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
