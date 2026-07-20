// Simple localStorage-backed store for the SunilDemo mock app.
import { useSyncExternalStore } from "react";

const KEY = "sunildemo:v1";

export type Party = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  type: "customer" | "vendor";
  balance: number;
};

export type LineItem = {
  id: string;
  name: string;
  qty: number;
  rate: number;
  taxPct: number;
  unit?: string;
  category?: string;
  barcode?: string;
  hsn?: string;
};

export type PaymentMethod = "cash" | "bank" | "upi" | "cheque" | "card" | "online";


export type DocKind = "invoice" | "proforma";
export type DocStatus = "paid" | "unpaid" | "partial" | "draft";

export type InvoiceDoc = {
  id: string;
  kind: DocKind;
  number: string;
  partyId: string;
  partyName: string;
  date: string; // ISO
  dueDate?: string;
  items: LineItem[];
  notes?: string;
  status: DocStatus;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
};


export type Expense = {
  id: string;
  category: string;
  vendor?: string;
  amount: number;
  date: string;
  note?: string;
};

export type User = { name: string; business: string; email: string };

type State = {
  user: User | null;
  parties: Party[];
  docs: InvoiceDoc[];
  expenses: Expense[];
};

const seedParties: Party[] = [
  { id: p(), name: "Ravi Traders", phone: "+91 98100 12345", type: "customer", balance: 12500 },
  { id: p(), name: "Sharma Enterprises", phone: "+91 99202 33445", type: "customer", balance: 0 },
  { id: p(), name: "Metro Supplies", phone: "+91 98876 22110", type: "vendor", balance: -4200 },
];

function p() {
  return Math.random().toString(36).slice(2, 10);
}

function seedDocs(parties: Party[]): InvoiceDoc[] {
  const [a, b] = parties;
  const today = new Date();
  const iso = (d: Date) => d.toISOString();
  return [
    {
      id: p(),
      kind: "invoice",
      number: "INV-0001",
      partyId: a.id,
      partyName: a.name,
      date: iso(today),
      dueDate: iso(new Date(today.getTime() + 7 * 864e5)),
      items: [
        { id: p(), name: "Consulting hours", qty: 10, rate: 1500, taxPct: 18 },
      ],
      status: "unpaid",
      paidAmount: 0,
    },
    {
      id: p(),
      kind: "invoice",
      number: "INV-0002",
      partyId: b.id,
      partyName: b.name,
      date: iso(new Date(today.getTime() - 3 * 864e5)),
      items: [{ id: p(), name: "Product A", qty: 4, rate: 899, taxPct: 12 }],
      status: "paid",
      paidAmount: 4028,
    },
    {
      id: p(),
      kind: "proforma",
      number: "PRO-0001",
      partyId: a.id,
      partyName: a.name,
      date: iso(new Date(today.getTime() - 1 * 864e5)),
      items: [{ id: p(), name: "Quotation item", qty: 2, rate: 5000, taxPct: 18 }],
      status: "draft",
      paidAmount: 0,
    },
  ];
}

function initial(): State {
  const parties = seedParties;
  return {
    user: null,
    parties,
    docs: seedDocs(parties),
    expenses: [
      { id: p(), category: "Rent", amount: 15000, date: new Date().toISOString(), note: "Office rent" },
      { id: p(), category: "Utilities", amount: 2400, date: new Date().toISOString(), note: "Electricity" },
    ],
  };
}

let state: State =
  typeof window !== "undefined"
    ? (() => {
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) return JSON.parse(raw) as State;
        } catch {}
        const s = initial();
        localStorage.setItem(KEY, JSON.stringify(s));
        return s;
      })()
    : initial();

const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(state),
  );
}

export function getState() {
  return state;
}

// Actions
export const actions = {
  login(email: string, name = "Sunil", business = "SunilDemo Traders") {
    state = { ...state, user: { name, business, email } };
    persist();
  },
  logout() {
    state = { ...state, user: null };
    persist();
  },
  addParty(input: Omit<Party, "id" | "balance">) {
    state = {
      ...state,
      parties: [...state.parties, { ...input, id: p(), balance: 0 }],
    };
    persist();
  },
  addDoc(input: Omit<InvoiceDoc, "id" | "number"> & { number?: string }) {
    const kindPrefix = input.kind === "invoice" ? "INV" : "PRO";
    const count =
      state.docs.filter((d) => d.kind === input.kind).length + 1;
    const number =
      input.number ?? `${kindPrefix}-${count.toString().padStart(4, "0")}`;
    state = { ...state, docs: [{ ...input, id: p(), number }, ...state.docs] };
    persist();
  },
  markPaid(id: string, method: PaymentMethod = "cash") {
    state = {
      ...state,
      docs: state.docs.map((d) =>
        d.id === id
          ? { ...d, status: "paid" as DocStatus, paidAmount: docTotal(d), paymentMethod: method }
          : d,
      ),
    };
    persist();
  },

  deleteDoc(id: string) {
    state = { ...state, docs: state.docs.filter((d) => d.id !== id) };
    persist();
  },
  addExpense(input: Omit<Expense, "id">) {
    state = { ...state, expenses: [{ ...input, id: p() }, ...state.expenses] };
    persist();
  },
  deleteExpense(id: string) {
    state = { ...state, expenses: state.expenses.filter((e) => e.id !== id) };
    persist();
  },
  reset() {
    state = initial();
    persist();
  },
};

export function docSubtotal(d: InvoiceDoc) {
  return d.items.reduce((s, i) => s + i.qty * i.rate, 0);
}
export function docTax(d: InvoiceDoc) {
  return d.items.reduce((s, i) => s + (i.qty * i.rate * i.taxPct) / 100, 0);
}
export function docTotal(d: InvoiceDoc) {
  return docSubtotal(d) + docTax(d);
}
export function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
