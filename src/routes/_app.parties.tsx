import { createFileRoute } from "@tanstack/react-router";
import { AppShell, FabAdd } from "@/components/app-shell";
import { useStore, actions, formatINR } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { UserRound, Building2 } from "lucide-react";

export const Route = createFileRoute("/_app/parties")({
  component: PartiesPage,
});

function PartiesPage() {
  const parties = useStore((s) => s.parties);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"customer" | "vendor">("customer");
  const [gstin, setGstin] = useState("");

  const save = () => {
    if (!name.trim()) return toast.error("Name required");
    actions.addParty({ name: name.trim(), phone, type, gstin });
    toast.success("Party added");
    setOpen(false); setName(""); setPhone(""); setGstin("");
  };

  const customers = parties.filter((p) => p.type === "customer");
  const vendors = parties.filter((p) => p.type === "vendor");

  return (
    <AppShell title="Parties">
      <div className="space-y-6 pb-8">
        <Section title="Customers" icon={<UserRound className="h-4 w-4" />} items={customers} />
        <Section title="Vendors" icon={<Building2 className="h-4 w-4" />} items={vendors} />
      </div>

      <FabAdd label="Add party" onClick={() => setOpen(true)} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add party</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" /></div>
            <div><Label>GSTIN (optional)</Label><Input value={gstin} onChange={(e) => setGstin(e.target.value)} className="mt-1.5" /></div>
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

function Section({ title, icon, items }: { title: string; icon: React.ReactNode; items: ReturnType<typeof useStore<any>> }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold">
        {icon} {title} <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
      </h2>
      <div className="card-elevated divide-y overflow-hidden rounded-2xl">
        {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No {title.toLowerCase()} yet</p>}
        {items.map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 font-semibold text-brand">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.phone || "—"}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${p.balance > 0 ? "text-success" : p.balance < 0 ? "text-destructive" : ""}`}>
                {formatINR(Math.abs(p.balance))}
              </p>
              <p className="text-[10px] text-muted-foreground">{p.balance > 0 ? "To receive" : p.balance < 0 ? "To pay" : "Settled"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
