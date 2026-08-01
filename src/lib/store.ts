// localStorage-backed store for SunilDemo.
import { useSyncExternalStore } from "react";

const KEY = "sunildemo:v2";

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

export type DocKind = "invoice" | "proforma" | "quotation";
export type DocStatus = "paid" | "unpaid" | "partial" | "draft";

export type InvoiceDoc = {
  id: string;
  kind: DocKind;
  number: string;
  partyId: string;
  partyName: string;
  date: string;
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

export type BankAccount = {
  id: string;
  name: string;
  accountNumber: string;
  ifsc?: string;
  openingBalance: number;
};

export type CashEntry = {
  id: string;
  type: "in" | "out";
  amount: number;
  date: string;
  note?: string;
};

export type Cheque = {
  id: string;
  partyName: string;
  chequeNo: string;
  amount: number;
  date: string;
  direction: "received" | "issued";
  status: "pending" | "cleared" | "bounced";
};

export type LoanAccount = {
  id: string;
  name: string;
  lender: string;
  principal: number;
  emi: number;
  monthsLeft: number;
  rate: number;
};

export type Purchase = {
  id: string;
  number: string;
  vendorName: string;
  amount: number;
  date: string;
  status: "paid" | "unpaid";
};

export type Company = {
  id: string;
  name: string;
  gstin?: string;
  active: boolean;
};

export type User = { name: string; business: string; email: string };

export type Settings = {
  toggles: Record<string, boolean>;
  currency: string;
};

export type BankTxn = {
  id: string;
  bankId: string;
  type: "credit" | "debit";
  amount: number;
  date: string;
  note?: string;
};

type State = {
  user: User | null;
  parties: Party[];
  docs: InvoiceDoc[];
  expenses: Expense[];
  bankAccounts: BankAccount[];
  bankTxns: BankTxn[];
  cashEntries: CashEntry[];
  cheques: Cheque[];
  loans: LoanAccount[];
  purchases: Purchase[];
  companies: Company[];
  settings: Settings;
};

function p() {
  return Math.random().toString(36).slice(2, 10);
}

function initial(): State {
  const parties: Party[] = [
    { id: p(), name: "Ravi Traders", phone: "+91 98100 12345", type: "customer", balance: 12500 },
    { id: p(), name: "Sharma Enterprises", phone: "+91 99202 33445", type: "customer", balance: 0 },
    { id: p(), name: "Metro Supplies", phone: "+91 98876 22110", type: "vendor", balance: -4200 },
  ];
  const [a, b] = parties;
  const today = new Date();
  const iso = (d: Date) => d.toISOString();
  const docs: InvoiceDoc[] = [
    {
      id: p(), kind: "invoice", number: "INV-0001", partyId: a.id, partyName: a.name,
      date: iso(today), dueDate: iso(new Date(today.getTime() + 7 * 864e5)),
      items: [{ id: p(), name: "Consulting hours", qty: 10, rate: 1500, taxPct: 18 }],
      status: "unpaid", paidAmount: 0,
    },
    {
      id: p(), kind: "invoice", number: "INV-0002", partyId: b.id, partyName: b.name,
      date: iso(new Date(today.getTime() - 3 * 864e5)),
      items: [{ id: p(), name: "Product A", qty: 4, rate: 899, taxPct: 12 }],
      status: "paid", paidAmount: 4028,
    },
  ];
  return {
    user: null,
    parties,
    docs,
    expenses: [
      { id: p(), category: "Rent", amount: 15000, date: iso(today), note: "Office rent" },
      { id: p(), category: "Utilities", amount: 2400, date: iso(today), note: "Electricity" },
    ],
    bankAccounts: [],
    bankTxns: [],
    cashEntries: [],
    cheques: [],
    loans: [],
    purchases: [],
    companies: [{ id: p(), name: "SunilDemo Traders", gstin: "07ABCDE1234F1Z5", active: true }],
    settings: {
      currency: "INR",
      toggles: {
        "gst.enabled": true,
        "invoice.autoNumber": true,
        "invoice.roundOff": true,
        "invoice.dueDate": true,
        "invoice.perItemDiscount": false,
        "print.thermal58": false,
        "print.logo": true,
        "print.terms": true,
        "print.signature": true,
        "tax.tcs": false,
        "tax.tds": false,
        "tax.composition": false,
        "item.barcode": true,
        "item.stock": true,
        "item.category": true,
        "item.units": true,
        "multicurrency.enabled": false,
        "multicurrency.autoRates": false,
        "loyalty.enabled": true,
        "loyalty.autoApply": false,
        "app.passcode": false,
        "app.backup": true,
        "app.sounds": true,
        "app.autoUpdate": true,
        "app.beta": false,
      },
    },
  };
}

function migrate(raw: any): State {
  const base = initial();
  return {
    ...base,
    ...raw,
    settings: {
      ...base.settings,
      ...(raw?.settings ?? {}),
      toggles: { ...base.settings.toggles, ...(raw?.settings?.toggles ?? {}) },
    },
    bankAccounts: raw?.bankAccounts ?? base.bankAccounts,
    bankTxns: raw?.bankTxns ?? base.bankTxns,
    cashEntries: raw?.cashEntries ?? base.cashEntries,
    cheques: raw?.cheques ?? base.cheques,
    loans: raw?.loans ?? base.loans,
    purchases: raw?.purchases ?? base.purchases,
    companies: raw?.companies ?? base.companies,
  };
}

let state: State =
  typeof window !== "undefined"
    ? (() => {
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) return migrate(JSON.parse(raw));
          const legacy = localStorage.getItem("sunildemo:v1");
          if (legacy) return migrate(JSON.parse(legacy));
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
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

export function getState() {
  return state;
}

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
    state = { ...state, parties: [...state.parties, { ...input, id: p(), balance: 0 }] };
    persist();
  },
  deleteParty(id: string) {
    state = { ...state, parties: state.parties.filter((x) => x.id !== id) };
    persist();
  },
  addDoc(input: Omit<InvoiceDoc, "id" | "number"> & { number?: string }) {
    const kindPrefix =
      input.kind === "invoice" ? "INV" : input.kind === "quotation" ? "QTN" : "PRO";
    const count = state.docs.filter((d) => d.kind === input.kind).length + 1;
    const number = input.number ?? `${kindPrefix}-${count.toString().padStart(4, "0")}`;
    state = { ...state, docs: [{ ...input, id: p(), number }, ...state.docs] };
    persist();
  },
  convertToInvoice(id: string) {
    const src = state.docs.find((d) => d.id === id);
    if (!src) return;
    const count = state.docs.filter((d) => d.kind === "invoice").length + 1;
    const number = `INV-${count.toString().padStart(4, "0")}`;
    const doc: InvoiceDoc = {
      ...src,
      id: p(),
      number,
      kind: "invoice",
      status: "unpaid",
      paidAmount: 0,
      date: new Date().toISOString(),
    };
    state = { ...state, docs: [doc, ...state.docs] };
    persist();
    return doc.id;
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
  // Bank
  addBank(input: Omit<BankAccount, "id">) {
    state = { ...state, bankAccounts: [...state.bankAccounts, { ...input, id: p() }] };
    persist();
  },
  deleteBank(id: string) {
    state = {
      ...state,
      bankAccounts: state.bankAccounts.filter((x) => x.id !== id),
      bankTxns: state.bankTxns.filter((t) => t.bankId !== id),
    };
    persist();
  },
  addBankTxn(input: Omit<BankTxn, "id">) {
    state = { ...state, bankTxns: [{ ...input, id: p() }, ...state.bankTxns] };
    persist();
  },
  // Cash
  addCash(input: Omit<CashEntry, "id">) {
    state = { ...state, cashEntries: [{ ...input, id: p() }, ...state.cashEntries] };
    persist();
  },
  deleteCash(id: string) {
    state = { ...state, cashEntries: state.cashEntries.filter((x) => x.id !== id) };
    persist();
  },
  // Cheques
  addCheque(input: Omit<Cheque, "id">) {
    state = { ...state, cheques: [{ ...input, id: p() }, ...state.cheques] };
    persist();
  },
  updateCheque(id: string, patch: Partial<Cheque>) {
    state = { ...state, cheques: state.cheques.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    persist();
  },
  deleteCheque(id: string) {
    state = { ...state, cheques: state.cheques.filter((x) => x.id !== id) };
    persist();
  },
  // Loans
  addLoan(input: Omit<LoanAccount, "id">) {
    state = { ...state, loans: [...state.loans, { ...input, id: p() }] };
    persist();
  },
  deleteLoan(id: string) {
    state = { ...state, loans: state.loans.filter((x) => x.id !== id) };
    persist();
  },
  payLoanEmi(id: string) {
    state = {
      ...state,
      loans: state.loans.map((l) =>
        l.id === id ? { ...l, monthsLeft: Math.max(0, l.monthsLeft - 1) } : l,
      ),
    };
    persist();
  },
  // Purchases
  addPurchase(input: Omit<Purchase, "id" | "number">) {
    const count = state.purchases.length + 1;
    const number = `PUR-${count.toString().padStart(4, "0")}`;
    state = { ...state, purchases: [{ ...input, id: p(), number }, ...state.purchases] };
    persist();
  },
  togglePurchasePaid(id: string) {
    state = {
      ...state,
      purchases: state.purchases.map((x) =>
        x.id === id ? { ...x, status: x.status === "paid" ? "unpaid" : "paid" } : x,
      ),
    };
    persist();
  },
  deletePurchase(id: string) {
    state = { ...state, purchases: state.purchases.filter((x) => x.id !== id) };
    persist();
  },
  // Companies
  addCompany(input: Omit<Company, "id" | "active">) {
    state = { ...state, companies: [...state.companies, { ...input, id: p(), active: false }] };
    persist();
  },
  activateCompany(id: string) {
    state = {
      ...state,
      companies: state.companies.map((c) => ({ ...c, active: c.id === id })),
    };
    persist();
  },
  deleteCompany(id: string) {
    state = { ...state, companies: state.companies.filter((c) => c.id !== id) };
    persist();
  },
  // Settings
  toggleSetting(key: string) {
    state = {
      ...state,
      settings: {
        ...state.settings,
        toggles: { ...state.settings.toggles, [key]: !state.settings.toggles[key] },
      },
    };
    persist();
  },
  setCurrency(code: string) {
    state = { ...state, settings: { ...state.settings, currency: code } };
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

export function bankBalance(s: State, bankId: string): number {
  const acct = s.bankAccounts.find((b) => b.id === bankId);
  if (!acct) return 0;
  const delta = s.bankTxns
    .filter((t) => t.bankId === bankId)
    .reduce((sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount), 0);
  return acct.openingBalance + delta;
}

export function cashBalance(s: State): number {
  return s.cashEntries.reduce((sum, e) => sum + (e.type === "in" ? e.amount : -e.amount), 0);
}
