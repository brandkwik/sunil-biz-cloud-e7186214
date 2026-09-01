// Centralised, typed settings models. Persisted in the store as `appSettings`
// and scoped per business via `businessId` when multi-firm is enabled.

export type AppTheme = "modern" | "classic" | "system" | "light" | "dark";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD MMM YYYY";

export type GeneralSettings = {
  language: "en" | "hi" | "gu" | "mr" | "ta" | "te" | "bn";
  currency: string; // ISO code
  decimalPlaces: number; // 0..4
  dateFormat: DateFormat;
  warnUnsavedChanges: boolean;
  theme: AppTheme;
  multiFirm: boolean;
  godownManagement: boolean;
  // "More transactions" feature flags — extendable
  transactionsEnabled: {
    estimate: boolean;
    proforma: boolean;
    otherIncome: boolean;
    orders: boolean;
    fixedAssets: boolean;
    challan: boolean;
    challanGoodsReturn: boolean;
    challanPrintAmount: boolean;
  };
};

export type SecuritySettings = {
  passcodeEnabled: boolean;
  passcode: string; // 4-digit, local only
  biometric: boolean;
  passcodeForEditDelete: boolean;
};

export type BarcodeScanner = "usb" | "camera";
export type RoundDirection = "up" | "down" | "nearest";
export type ShareAs = "ask" | "pdf" | "image" | "print" | "none";

export type DocPrefixKey =
  | "saleInvoice" | "creditNote" | "saleOrder" | "purchaseOrder" | "estimate"
  | "proforma" | "challan" | "paymentIn" | "paymentOut" | "purchaseInvoice" | "debitNote";

export type TransactionSettings = {
  header: {
    invoiceNumber: boolean;
    cashSaleDefault: boolean;
    billingName: boolean;
    poDetails: boolean;
    addTime: boolean;
  };
  items: {
    inclusiveTax: boolean;
    showPurchasePrice: boolean;
    lastFiveSalePrices: boolean;
    freeQty: boolean;
    count: boolean;
    barcodeScanning: boolean;
    barcodeType: BarcodeScanner;
  };
  totals: {
    txnTax: boolean;
    txnDiscount: boolean;
    roundOff: boolean;
    roundDirection: RoundDirection;
    roundTo: 1 | 0.5 | 0.1 | 10;
  };
  more: {
    shareAs: ShareAs;
    passcodeEditDelete: boolean;
    discountDuringPayment: boolean;
    linkPayments: boolean;
    dueDates: boolean;
    defaultCreditDays: number;
  };
  gst: {
    reverseCharge: boolean;
    stateOfSupply: boolean;
    ewayBill: boolean;
  };
  // prefixes are stored per firm: businessId -> key -> prefix ("" = None)
  prefixes: Record<string, Partial<Record<DocPrefixKey, string>>>;
};

export type ItemType = "products" | "services" | "both";

export type ItemSettings = {
  enabled: boolean;
  itemType: ItemType;
  barcodeScanning: boolean;
  barcodeType: BarcodeScanner;
  mobilePosDefault: boolean;
  stockMaintenance: boolean;
  manufacturing: boolean;
  units: boolean;
  defaultUnit: string;
  category: boolean;
  partyWiseRate: boolean;
  wholesalePrice: boolean;
  lowStockAlerts: boolean;
};

export type PartyCustomField = { id: string; label: string; type: "text" | "number" | "date"; showOnPrint: boolean };

export type PartySettings = {
  gstin: boolean;
  grouping: boolean;
  additionalFields: boolean;
  customFields: PartyCustomField[];
  shippingAddress: boolean;
  loyaltyPoints: boolean;
  loyaltyPointsPer100: number;
};

export type PrintTextSize = "small" | "medium" | "large" | "xlarge";
export type PageSize = "A4" | "A5" | "Letter" | "Legal" | "58mm" | "80mm";
export type Orientation = "portrait" | "landscape";
export type PrintTheme = "tally" | "modern" | "classic" | "minimal";

export type PrintProfile = {
  theme: PrintTheme;
  color: string; // hex accent
  textSize: PrintTextSize;
  pageSize: PageSize;
  orientation: Orientation;
  repeatHeader: boolean;
  companyName: boolean;
  companyNameSize: PrintTextSize;
  logo: boolean;
  address: boolean;
  phone: boolean;
  email: boolean;
  gstin: boolean;
  bankDetails: boolean;
  terms: boolean;
  signature: boolean;
  paymentQr: boolean;
  footer: string;
  customNotes: string;
  authorizedSignatory: string;
};

export type InvoicePrintSettings = {
  defaultMode: "regular" | "thermal";
  regular: PrintProfile;
  thermal: PrintProfile;
};

export type TaxSettings = {
  gstEnabled: boolean;
  composition: boolean;
  tcs: boolean;
  tds: boolean;
  hsnOnInvoice: boolean;
  rates: number[];
  defaultRate: number;
  placeOfSupply: string;
};

export type MultiCurrencySettings = {
  enabled: boolean;
  autoRates: boolean;
  currencies: { code: string; symbol: string; rate: number }[];
};

export type UserRole = "owner" | "admin" | "sales" | "ca" | "viewer";
export type BusinessUser = { id: string; name: string; email: string; role: UserRole; active: boolean };

export type SmsSettings = {
  enabled: boolean;
  sendOnSale: boolean;
  sendOnPaymentIn: boolean;
  sendOnPaymentOut: boolean;
  includeCompanyName: boolean;
  template: string;
};

export type ReminderSettings = {
  paymentReminders: boolean;
  daysBeforeDue: number;
  daysAfterDue: number;
  dailyBackupReminder: boolean;
  lowStockReminder: boolean;
};

export type AppSettings = {
  general: GeneralSettings;
  security: SecuritySettings;
  transaction: TransactionSettings;
  item: ItemSettings;
  party: PartySettings;
  print: InvoicePrintSettings;
  tax: TaxSettings;
  multiCurrency: MultiCurrencySettings;
  users: BusinessUser[];
  sms: SmsSettings;
  reminders: ReminderSettings;
};

export type SettingsSection = keyof AppSettings;

const basePrint: PrintProfile = {
  theme: "modern",
  color: "#C8322B",
  textSize: "medium",
  pageSize: "A4",
  orientation: "portrait",
  repeatHeader: true,
  companyName: true,
  companyNameSize: "large",
  logo: true,
  address: true,
  phone: true,
  email: false,
  gstin: true,
  bankDetails: true,
  terms: true,
  signature: true,
  paymentQr: false,
  footer: "Thank you for your business!",
  customNotes: "",
  authorizedSignatory: "Authorised Signatory",
};

export const DEFAULT_PREFIXES: Record<DocPrefixKey, string> = {
  saleInvoice: "INV",
  creditNote: "CRN",
  saleOrder: "SO",
  purchaseOrder: "PO",
  estimate: "EST",
  proforma: "PRO",
  challan: "DC",
  paymentIn: "RCPT",
  paymentOut: "PAY",
  purchaseInvoice: "PUR",
  debitNote: "DBN",
};

export const PREFIX_LABELS: Record<DocPrefixKey, string> = {
  saleInvoice: "Sale Invoice",
  creditNote: "Credit Note",
  saleOrder: "Sale Order",
  purchaseOrder: "Purchase Order",
  estimate: "Estimate",
  proforma: "Proforma Invoice",
  challan: "Delivery Challan",
  paymentIn: "Payment-In",
  paymentOut: "Payment-Out",
  purchaseInvoice: "Purchase Invoice",
  debitNote: "Debit Note",
};

export function defaultSettings(): AppSettings {
  return {
    general: {
      language: "en",
      currency: "INR",
      decimalPlaces: 2,
      dateFormat: "DD/MM/YYYY",
      warnUnsavedChanges: true,
      theme: "modern",
      multiFirm: true,
      godownManagement: false,
      transactionsEnabled: {
        estimate: true,
        proforma: true,
        otherIncome: true,
        orders: false,
        fixedAssets: false,
        challan: false,
        challanGoodsReturn: false,
        challanPrintAmount: true,
      },
    },
    security: { passcodeEnabled: false, passcode: "", biometric: false, passcodeForEditDelete: false },
    transaction: {
      header: { invoiceNumber: true, cashSaleDefault: false, billingName: false, poDetails: false, addTime: false },
      items: {
        inclusiveTax: true,
        showPurchasePrice: false,
        lastFiveSalePrices: false,
        freeQty: false,
        count: false,
        barcodeScanning: true,
        barcodeType: "camera",
      },
      totals: { txnTax: true, txnDiscount: true, roundOff: true, roundDirection: "nearest", roundTo: 1 },
      more: { shareAs: "ask", passcodeEditDelete: false, discountDuringPayment: false, linkPayments: true, dueDates: true, defaultCreditDays: 7 },
      gst: { reverseCharge: false, stateOfSupply: true, ewayBill: false },
      prefixes: {},
    },
    item: {
      enabled: true,
      itemType: "both",
      barcodeScanning: true,
      barcodeType: "camera",
      mobilePosDefault: false,
      stockMaintenance: true,
      manufacturing: false,
      units: true,
      defaultUnit: "Pcs",
      category: true,
      partyWiseRate: false,
      wholesalePrice: false,
      lowStockAlerts: true,
    },
    party: { gstin: true, grouping: false, additionalFields: false, customFields: [], shippingAddress: true, loyaltyPoints: true, loyaltyPointsPer100: 1 },
    print: {
      defaultMode: "regular",
      regular: basePrint,
      thermal: { ...basePrint, theme: "minimal", pageSize: "80mm", textSize: "small", logo: false, bankDetails: false, signature: false },
    },
    tax: { gstEnabled: true, composition: false, tcs: false, tds: false, hsnOnInvoice: true, rates: [0, 5, 12, 18, 28], defaultRate: 18, placeOfSupply: "Delhi" },
    multiCurrency: {
      enabled: false,
      autoRates: false,
      currencies: [
        { code: "USD", symbol: "$", rate: 83.2 },
        { code: "EUR", symbol: "€", rate: 90.1 },
        { code: "AED", symbol: "د.إ", rate: 22.6 },
      ],
    },
    users: [],
    sms: { enabled: false, sendOnSale: true, sendOnPaymentIn: true, sendOnPaymentOut: false, includeCompanyName: true, template: "Dear {party}, {doc} of {amount} has been recorded. Thank you - {company}" },
    reminders: { paymentReminders: true, daysBeforeDue: 2, daysAfterDue: 3, dailyBackupReminder: true, lowStockReminder: true },
  };
}

/** Deep-merge persisted settings over defaults so new keys always exist. */
export function mergeSettings(raw: any): AppSettings {
  const d = defaultSettings();
  if (!raw || typeof raw !== "object") return d;
  const m = (a: any, b: any): any => {
    if (Array.isArray(a)) return Array.isArray(b) ? b : a;
    if (a && typeof a === "object") {
      const out: any = { ...a };
      for (const k of Object.keys(b ?? {})) out[k] = k in a ? m(a[k], b[k]) : b[k];
      return out;
    }
    return b === undefined ? a : b;
  };
  return m(d, raw);
}

export function roundAmount(n: number, t: TransactionSettings["totals"]) {
  if (!t.roundOff) return n;
  const step = t.roundTo;
  const q = n / step;
  const r = t.roundDirection === "up" ? Math.ceil(q) : t.roundDirection === "down" ? Math.floor(q) : Math.round(q);
  return r * step;
}

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "bn", label: "বাংলা (Bengali)" },
] as const;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];
export const UNITS = ["Pcs", "Kg", "Gm", "Ltr", "Ml", "Mtr", "Box", "Dozen", "Hr", "Nos", "Bag", "Set"];
export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export const APP_VERSION = "1.4.0";
export const APP_BUILD = "2026.09.01";
