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
  itemId?: string;
  name: string;
  qty: number;
  rate: number;
  taxPct: number;
  discountPct?: number;
  unit?: string;
  category?: string;
  barcode?: string;
  hsn?: string;
  mrp?: number;
  cost?: number;
};

export type Item = {
  id: string;
  name: string;
  type: "product" | "service";
  sku?: string;
  barcode?: string;
  hsn?: string;
  unit: string;
  category?: string;
  purchasePrice: number;
  salePrice: number;
  mrp?: number;
  taxPct: number;
  stock: number;
  minStock: number;
  batch?: string;
  expiry?: string;
};

export type StockMove = {
  id: string;
  itemId: string;
  itemName: string;
  qty: number; // +in / -out
  reason: string;
  ref?: string;
  date: string;
};

export type PaymentMethod = "cash" | "bank" | "upi" | "cheque" | "card" | "online";

export type Payment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note?: string;
};

export type DocKind = "invoice" | "proforma" | "quotation" | "estimate" | "credit_note";
export type DocStatus = "paid" | "unpaid" | "partial" | "draft" | "sent" | "accepted" | "converted";

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
  payments?: Payment[];
  sourceId?: string;
  convertedToId?: string;
  shipping?: number;
  roundOff?: number;
};

export type OtherIncome = {
  id: string;
  source: string;
  amount: number;
  date: string;
  note?: string;
};

export type Business = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  state?: string;
  terms?: string;
  upiId?: string;
  bankLine?: string;
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
  kind?: "bill" | "debit_note";
  items?: LineItem[];
  sourceId?: string;
};


export type Company = {
  id: string;
  name: string;
  gstin?: string;
  active: boolean;
};

export type User = { name: string; business: string; email: string };

export type PrintType = "regular" | "thermal";
export type PrintSettings = {
  type: PrintType;
  pageSize: "A4" | "A5" | "Letter";
  thermalWidth: "58mm" | "80mm";
  theme: "classic" | "modern" | "minimal";
  textSize: "small" | "medium" | "large";
  accent: string;
  copies: number;
  showTaxBreakup: boolean;
  showAmountInWords: boolean;
};

export const DEFAULT_PRINT: PrintSettings = {
  type: "regular",
  pageSize: "A4",
  thermalWidth: "80mm",
  theme: "modern",
  textSize: "medium",
  accent: "#d32f2f",
  copies: 1,
  showTaxBreakup: true,
  showAmountInWords: true,
};

export type Settings = {
  toggles: Record<string, boolean>;
  currency: string;
  print: PrintSettings;
};

export type BankTxn = {
  id: string;
  bankId: string;
  type: "credit" | "debit";
  amount: number;
  date: string;
  note?: string;
};

export type PlanId = "free" | "silver" | "gold" | "diamond";
export type BillingCycle = "1y" | "2y" | "3y";
export type PlanDevice = "mobile" | "desktop";

export type Subscription = {
  plan: PlanId;
  cycle: BillingCycle;
  device: PlanDevice;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  history: { id: string; plan: PlanId; cycle: BillingCycle; device: PlanDevice; amount: number; date: string }[];
};

type State = {
  user: User | null;
  business: Business;
  parties: Party[];
  items: Item[];
  stockMoves: StockMove[];
  docs: InvoiceDoc[];
  expenses: Expense[];
  otherIncome: OtherIncome[];
  bankAccounts: BankAccount[];
  bankTxns: BankTxn[];
  cashEntries: CashEntry[];
  cheques: Cheque[];
  loans: LoanAccount[];
  purchases: Purchase[];
  companies: Company[];
  settings: Settings;
  subscription: Subscription;
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
  const items: Item[] = [
    { id: p(), name: "Premium Perfume 100ml", type: "product", unit: "Pcs", category: "Perfume", hsn: "3303", barcode: "8901234567890", purchasePrice: 950, salePrice: 1450, mrp: 1699, taxPct: 18, stock: 24, minStock: 10 },
    { id: p(), name: "Gift Box", type: "product", unit: "Pcs", category: "Packaging", hsn: "4819", purchasePrice: 140, salePrice: 250, mrp: 299, taxPct: 18, stock: 6, minStock: 12 },
    { id: p(), name: "Consulting hours", type: "service", unit: "Hr", category: "Services", hsn: "9983", purchasePrice: 0, salePrice: 1500, taxPct: 18, stock: 0, minStock: 0 },
  ];
  const docs: InvoiceDoc[] = [
    {
      id: p(), kind: "invoice", number: "INV-0001", partyId: a.id, partyName: a.name,
      date: iso(today), dueDate: iso(new Date(today.getTime() + 7 * 864e5)),
      items: [{ id: p(), itemId: items[2].id, name: "Consulting hours", qty: 10, rate: 1500, taxPct: 18, unit: "Hr", cost: 0 }],
      status: "unpaid", paidAmount: 0, payments: [],
    },
    {
      id: p(), kind: "invoice", number: "INV-0002", partyId: b.id, partyName: b.name,
      date: iso(new Date(today.getTime() - 3 * 864e5)),
      items: [{ id: p(), itemId: items[0].id, name: "Premium Perfume 100ml", qty: 2, rate: 1450, taxPct: 18, unit: "Pcs", cost: 950 }],
      status: "paid", paidAmount: 3422, payments: [],
    },
  ];
  return {
    user: null,
    business: {
      name: "SunilDemo Traders",
      address: "12, MG Road, New Delhi 110001",
      phone: "+91 98100 00000",
      email: "billing@sunildemo.app",
      gstin: "07ABCDE1234F1Z5",
      state: "Delhi",
      terms: "Goods once sold will not be taken back. Payment due within 7 days.",
      upiId: "sunildemo@upi",
      bankLine: "HDFC Bank · A/C 0012345678 · IFSC HDFC0000123",
    },
    parties,
    items,
    stockMoves: [],
    docs,
    expenses: [
      { id: p(), category: "Rent", amount: 15000, date: iso(today), note: "Office rent" },
      { id: p(), category: "Utilities", amount: 2400, date: iso(today), note: "Electricity" },
    ],
    otherIncome: [],

    bankAccounts: [],
    bankTxns: [],
    cashEntries: [],
    cheques: [],
    loans: [],
    purchases: [],
    companies: [{ id: p(), name: "SunilDemo Traders", gstin: "07ABCDE1234F1Z5", active: true }],
    settings: {
      currency: "INR",
      print: { ...DEFAULT_PRINT },
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
    subscription: {
      plan: "free",
      cycle: "1y",
      device: "mobile",
      startedAt: iso(today),
      expiresAt: iso(new Date(today.getTime() + 14 * 864e5)),
      autoRenew: false,
      history: [],
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
      print: { ...DEFAULT_PRINT, ...(raw?.settings?.print ?? {}) },
    },
    business: { ...base.business, ...(raw?.business ?? {}) },
    items: raw?.items ?? base.items,
    stockMoves: raw?.stockMoves ?? base.stockMoves,
    otherIncome: raw?.otherIncome ?? base.otherIncome,
    bankAccounts: raw?.bankAccounts ?? base.bankAccounts,
    bankTxns: raw?.bankTxns ?? base.bankTxns,
    cashEntries: raw?.cashEntries ?? base.cashEntries,
    cheques: raw?.cheques ?? base.cheques,
    loans: raw?.loans ?? base.loans,
    purchases: raw?.purchases ?? base.purchases,
    companies: raw?.companies ?? base.companies,
    subscription: { ...base.subscription, ...(raw?.subscription ?? {}) },

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

const PREFIX: Record<DocKind, string> = {
  invoice: "INV",
  proforma: "PRO",
  quotation: "QTN",
  estimate: "EST",
  credit_note: "CRN",
};

function nextNumber(kind: DocKind) {
  const count = state.docs.filter((d) => d.kind === kind).length + 1;
  return `${PREFIX[kind]}-${count.toString().padStart(4, "0")}`;
}

// Stock ledger: invoices reduce stock, credit notes add it back.
function stockSign(kind: DocKind) {
  if (kind === "invoice") return -1;
  if (kind === "credit_note") return 1;
  return 0;
}

function moveStock(lines: LineItem[], sign: number, reason: string, ref?: string) {
  if (!sign) return;
  const moves: StockMove[] = [];
  const items = state.items.map((it) => {
    const qty = lines.filter((l) => l.itemId === it.id).reduce((s, l) => s + l.qty, 0);
    if (!qty) return it;
    moves.push({ id: p(), itemId: it.id, itemName: it.name, qty: qty * sign, reason, ref, date: new Date().toISOString() });
    return it.type === "service" ? it : { ...it, stock: it.stock + qty * sign };
  });
  state = { ...state, items, stockMoves: [...moves, ...state.stockMoves] };
}

function applyStock(doc: InvoiceDoc) {
  moveStock(doc.items, stockSign(doc.kind), doc.kind === "credit_note" ? "Sales return" : "Sale", doc.number);
}
function revertStock(doc: InvoiceDoc) {
  moveStock(doc.items, -stockSign(doc.kind), "Document deleted", doc.number);
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
  updateParty(id: string, patch: Partial<Party>) {
    state = { ...state, parties: state.parties.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
    persist();
  },
  // ---- Item master + stock ledger
  addItem(input: Omit<Item, "id">) {
    state = { ...state, items: [...state.items, { ...input, id: p() }] };
    persist();
  },
  updateItem(id: string, patch: Partial<Item>) {
    state = { ...state, items: state.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
    persist();
  },
  deleteItem(id: string) {
    state = { ...state, items: state.items.filter((x) => x.id !== id) };
    persist();
  },
  adjustStock(itemId: string, qty: number, reason = "Manual adjustment", ref?: string) {
    const it = state.items.find((x) => x.id === itemId);
    if (!it) return;
    state = {
      ...state,
      items: state.items.map((x) => (x.id === itemId ? { ...x, stock: x.stock + qty } : x)),
      stockMoves: [
        { id: p(), itemId, itemName: it.name, qty, reason, ref, date: new Date().toISOString() },
        ...state.stockMoves,
      ],
    };
    persist();
  },
  addDoc(input: Omit<InvoiceDoc, "id" | "number"> & { number?: string }) {
    const number = input.number ?? nextNumber(input.kind);
    const doc: InvoiceDoc = { ...input, id: p(), number, payments: input.payments ?? [] };
    state = { ...state, docs: [doc, ...state.docs] };
    applyStock(doc);
    if (input.sourceId) {
      state = {
        ...state,
        docs: state.docs.map((d) =>
          d.id === input.sourceId ? { ...d, status: "converted" as DocStatus, convertedToId: doc.id } : d,
        ),
      };
    }
    persist();
    return doc.id;
  },
  updateDoc(id: string, patch: Partial<InvoiceDoc>) {
    state = { ...state, docs: state.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) };
    persist();
  },
  setDocStatus(id: string, status: DocStatus) {
    state = { ...state, docs: state.docs.map((d) => (d.id === id ? { ...d, status } : d)) };
    persist();
  },
  convertToInvoice(id: string) {
    return this.convertDoc(id, "invoice");
  },
  // Estimate -> Quotation -> Proforma -> Invoice (any forward step allowed)
  convertDoc(id: string, target: DocKind) {
    const src = state.docs.find((d) => d.id === id);
    if (!src || src.kind === target || target === "credit_note") return;
    const doc: InvoiceDoc = {
      ...src,
      id: p(),
      number: nextNumber(target),
      kind: target,
      status: target === "invoice" ? "unpaid" : "draft",
      paidAmount: 0,
      payments: [],
      sourceId: src.id,
      convertedToId: undefined,
      date: new Date().toISOString(),
    };
    state = {
      ...state,
      docs: [doc, ...state.docs.map((d) => (d.id === src.id ? { ...d, status: "converted" as DocStatus, convertedToId: doc.id } : d))],
    };
    applyStock(doc);
    persist();
    return doc.id;
  },
  // Sales return / credit note from an invoice
  createSalesReturn(invoiceId: string, lines: { lineId: string; qty: number }[], reason = "") {
    const src = state.docs.find((d) => d.id === invoiceId);
    if (!src) return;
    const items = src.items
      .map((li) => {
        const sel = lines.find((l) => l.lineId === li.id);
        if (!sel || sel.qty <= 0) return null;
        return { ...li, id: p(), qty: Math.min(sel.qty, li.qty) };
      })
      .filter(Boolean) as LineItem[];
    if (!items.length) return;
    const doc: InvoiceDoc = {
      id: p(),
      kind: "credit_note",
      number: nextNumber("credit_note"),
      partyId: src.partyId,
      partyName: src.partyName,
      date: new Date().toISOString(),
      items,
      notes: reason,
      status: "draft",
      paidAmount: 0,
      payments: [],
      sourceId: src.id,
    };
    state = { ...state, docs: [doc, ...state.docs] };
    applyStock(doc);
    persist();
    return doc.id;
  },
  addPayment(id: string, amount: number, method: PaymentMethod = "cash", note?: string) {
    const doc = state.docs.find((d) => d.id === id);
    if (!doc) return;
    const total = docTotal(doc);
    const paid = Math.min(total, doc.paidAmount + amount);
    const payment: Payment = { id: p(), amount, method, date: new Date().toISOString(), note };
    state = {
      ...state,
      docs: state.docs.map((d) =>
        d.id === id
          ? {
              ...d,
              paidAmount: paid,
              paymentMethod: method,
              payments: [...(d.payments ?? []), payment],
              status: (paid >= total - 0.5 ? "paid" : paid > 0 ? "partial" : "unpaid") as DocStatus,
            }
          : d,
      ),
    };
    if (method === "cash") {
      state = {
        ...state,
        cashEntries: [{ id: p(), type: "in", amount, date: payment.date, note: `Payment-In ${doc.number}` }, ...state.cashEntries],
      };
    }
    persist();
  },
  markPaid(id: string, method: PaymentMethod = "cash") {
    const doc = state.docs.find((d) => d.id === id);
    if (!doc) return;
    this.addPayment(id, Math.max(0, docTotal(doc) - doc.paidAmount), method, "Full settlement");
  },
  deleteDoc(id: string) {
    const doc = state.docs.find((d) => d.id === id);
    state = { ...state, docs: state.docs.filter((d) => d.id !== id) };
    if (doc) revertStock(doc);
    persist();
  },
  // Other income
  addOtherIncome(input: Omit<OtherIncome, "id">) {
    state = { ...state, otherIncome: [{ ...input, id: p() }, ...state.otherIncome] };
    persist();
  },
  deleteOtherIncome(id: string) {
    state = { ...state, otherIncome: state.otherIncome.filter((x) => x.id !== id) };
    persist();
  },
  updateBusiness(patch: Partial<Business>) {
    state = { ...state, business: { ...state.business, ...patch } };
    persist();
  },
  exportBackup(): string {
    return JSON.stringify(state, null, 2);
  },
  importBackup(json: string) {
    const parsed = JSON.parse(json);
    state = migrate(parsed);
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
    const kind = input.kind ?? "bill";
    const same = state.purchases.filter((x) => (x.kind ?? "bill") === kind).length + 1;
    const number = `${kind === "bill" ? "PUR" : "DBN"}-${same.toString().padStart(4, "0")}`;
    const rec: Purchase = { ...input, kind, id: p(), number };
    state = { ...state, purchases: [rec, ...state.purchases] };
    if (rec.items?.length) {
      moveStock(rec.items, kind === "bill" ? 1 : -1, kind === "bill" ? "Purchase" : "Purchase return", number);
    }
    persist();
    return rec.id;
  },
  createPurchaseReturn(purchaseId: string, amount: number, lines?: LineItem[]) {
    const src = state.purchases.find((x) => x.id === purchaseId);
    if (!src) return;
    return this.addPurchase({
      vendorName: src.vendorName,
      amount,
      date: new Date().toISOString(),
      status: "unpaid",
      kind: "debit_note",
      items: lines ?? src.items,
      sourceId: src.id,
    });
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
    const rec = state.purchases.find((x) => x.id === id);
    state = { ...state, purchases: state.purchases.filter((x) => x.id !== id) };
    if (rec?.items?.length) moveStock(rec.items, (rec.kind ?? "bill") === "bill" ? -1 : 1, "Purchase deleted", rec.number);
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
  updatePrintSettings(patch: Partial<PrintSettings>) {
    state = { ...state, settings: { ...state.settings, print: { ...state.settings.print, ...patch } } };
    persist();
  },
  importParties(rows: Array<Omit<Party, "id" | "balance">>) {
    const fresh = rows.filter((r) => r.name && !state.parties.some((x) => x.name.toLowerCase() === r.name.toLowerCase()));
    state = { ...state, parties: [...state.parties, ...fresh.map((r) => ({ ...r, id: p(), balance: 0 }))] };
    persist();
    return fresh.length;
  },
  importItems(rows: Array<Omit<Item, "id">>) {
    const fresh = rows.filter((r) => r.name && !state.items.some((x) => x.name.toLowerCase() === r.name.toLowerCase()));
    state = { ...state, items: [...state.items, ...fresh.map((r) => ({ ...r, id: p() }))] };
    persist();
    return fresh.length;
  },
  // Subscription
  subscribePlan(input: { plan: PlanId; cycle: BillingCycle; device: PlanDevice; amount: number }) {
    const years = input.cycle === "1y" ? 1 : input.cycle === "2y" ? 2 : 3;
    const now = new Date();
    const current = state.subscription;
    const base =
      current.plan !== "free" && new Date(current.expiresAt) > now ? new Date(current.expiresAt) : now;
    const expires = new Date(base.getTime());
    expires.setFullYear(expires.getFullYear() + years);
    state = {
      ...state,
      subscription: {
        ...current,
        plan: input.plan,
        cycle: input.cycle,
        device: input.device,
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        history: [
          { id: p(), plan: input.plan, cycle: input.cycle, device: input.device, amount: input.amount, date: now.toISOString() },
          ...current.history,
        ],
      },
    };
    persist();
  },
  setAutoRenew(on: boolean) {
    state = { ...state, subscription: { ...state.subscription, autoRenew: on } };
    persist();
  },
  cancelPlan() {
    state = {
      ...state,
      subscription: { ...state.subscription, plan: "free", autoRenew: false, expiresAt: new Date().toISOString() },
    };
    persist();
  },
  reset() {
    state = initial();
    persist();
  },
};

export function lineAmount(i: LineItem) {
  return i.qty * i.rate * (1 - (i.discountPct ?? 0) / 100);
}
export function docSubtotal(d: InvoiceDoc) {
  return d.items.reduce((s, i) => s + lineAmount(i), 0);
}
export function docTax(d: InvoiceDoc) {
  return d.items.reduce((s, i) => s + (lineAmount(i) * i.taxPct) / 100, 0);
}
export function docTotal(d: InvoiceDoc) {
  return docSubtotal(d) + docTax(d) + (d.shipping ?? 0);
}
export function docDue(d: InvoiceDoc) {
  return Math.max(0, docTotal(d) - d.paidAmount);
}
/** Bill-wise gross profit: sale value minus item cost. */
export function docProfit(d: InvoiceDoc) {
  const cost = d.items.reduce((s, i) => s + (i.cost ?? 0) * i.qty, 0);
  return docSubtotal(d) - cost;
}
export function stockValue(s: State) {
  return s.items.reduce((sum, i) => sum + i.stock * i.purchasePrice, 0);
}
export function lowStockItems(s: State) {
  return s.items.filter((i) => i.type === "product" && i.minStock > 0 && i.stock <= i.minStock);
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
