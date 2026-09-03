import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { docSubtotal, docTax, docTotal, type Business, type InvoiceDoc, type Party, type PrintSettings, type DocKind } from "@/lib/store";

export const KIND_TITLE: Record<DocKind, string> = {
  invoice: "TAX INVOICE",
  proforma: "PROFORMA INVOICE",
  quotation: "QUOTATION",
  estimate: "ESTIMATE",
  credit_note: "CREDIT NOTE",
};

const inr = (n: number) => "Rs. " + Math.round(n).toLocaleString("en-IN");

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [211, 47, 47];
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function two(n: number) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : ""); }
function three(n: number) { return (n >= 100 ? ONES[Math.floor(n / 100)] + " Hundred " : "") + (n % 100 ? two(n % 100) : ""); }
export function amountInWords(n: number) {
  n = Math.round(n);
  if (!n) return "Zero Rupees Only";
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thou = Math.floor((n % 1e5) / 1000), rest = n % 1000;
  let s = "";
  if (crore) s += three(crore) + " Crore ";
  if (lakh) s += two(lakh) + " Lakh ";
  if (thou) s += two(thou) + " Thousand ";
  if (rest) s += three(rest);
  return s.trim() + " Rupees Only";
}

export type PdfCtx = { doc: InvoiceDoc; party?: Party; business: Business; print: PrintSettings; toggles: Record<string, boolean> };

export function buildInvoicePdf({ doc, party, business, print, toggles }: PdfCtx): jsPDF {
  return print.type === "thermal" ? buildThermal({ doc, party, business, print, toggles }) : buildRegular({ doc, party, business, print, toggles });
}

function buildRegular({ doc, party, business, print, toggles }: PdfCtx): jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: print.pageSize.toLowerCase() as "a4" | "a5" | "letter" });
  const W = pdf.internal.pageSize.getWidth();
  const M = 12;
  const accent = hexToRgb(print.accent);
  const fs = print.textSize === "small" ? 8 : print.textSize === "large" ? 11 : 9.5;
  const modern = print.theme === "modern";

  // Header band
  if (modern) {
    pdf.setFillColor(...accent);
    pdf.rect(0, 0, W, 26, "F");
    pdf.setTextColor(255, 255, 255);
  } else {
    pdf.setTextColor(20, 20, 20);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(business.name, M, 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fs - 0.5);
  const addr = [business.address, business.phone && `Ph: ${business.phone}`, business.gstin && `GSTIN: ${business.gstin}`].filter(Boolean).join("  |  ");
  pdf.text(addr, M, 18, { maxWidth: W - 2 * M - 50 });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(KIND_TITLE[doc.kind], W - M, 12, { align: "right" });
  if (!modern) {
    pdf.setDrawColor(...accent);
    pdf.setLineWidth(0.8);
    pdf.line(M, 22, W - M, 22);
  }

  // Meta + bill-to
  pdf.setTextColor(30, 30, 30);
  let y = 34;
  pdf.setFontSize(fs);
  pdf.setFont("helvetica", "bold");
  pdf.text("Bill To", M, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(party?.name ?? doc.partyName, M, y + 5);
  const pl = [party?.phone, party?.gstin && `GSTIN: ${party.gstin}`].filter(Boolean) as string[];
  pl.forEach((l, i) => pdf.text(l, M, y + 10 + i * 4.5));

  const meta: [string, string][] = [
    ["No.", doc.number],
    ["Date", new Date(doc.date).toLocaleDateString("en-IN")],
  ];
  if (doc.dueDate && toggles["invoice.dueDate"]) meta.push(["Due", new Date(doc.dueDate).toLocaleDateString("en-IN")]);
  if (doc.sourceId) meta.push(["Ref", "Converted"]);
  meta.forEach(([k, v], i) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(k, W - M - 40, y + i * 5);
    pdf.setFont("helvetica", "normal");
    pdf.text(v, W - M, y + i * 5, { align: "right" });
  });

  y += 24;
  const gst = toggles["gst.enabled"] !== false;
  const head = ["#", "Item", "HSN", "Qty", "Rate", ...(gst ? ["GST%"] : []), "Amount"];
  const body = doc.items.map((it, i) => [
    String(i + 1),
    it.name + (it.unit ? ` (${it.unit})` : ""),
    it.hsn ?? "-",
    String(it.qty),
    inr(it.rate),
    ...(gst ? [`${it.taxPct}%`] : []),
    inr(it.qty * it.rate * (1 + (gst ? it.taxPct : 0) / 100)),
  ]);
  autoTable(pdf, {
    startY: y,
    head: [head],
    body,
    theme: print.theme === "minimal" ? "plain" : "grid",
    styles: { fontSize: fs, cellPadding: 2 },
    headStyles: { fillColor: print.theme === "minimal" ? [240, 240, 240] : accent, textColor: print.theme === "minimal" ? 20 : 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 8 }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
    margin: { left: M, right: M },
  });
  y = (pdf as any).lastAutoTable.finalY + 6;

  // Totals
  const rows: [string, string][] = [["Subtotal", inr(docSubtotal(doc))]];
  if (gst && print.showTaxBreakup) {
    const tax = docTax(doc);
    rows.push(["CGST", inr(tax / 2)], ["SGST", inr(tax / 2)]);
  } else if (gst) rows.push(["GST", inr(docTax(doc))]);
  rows.push(["Total", inr(docTotal(doc))]);
  if (doc.paidAmount > 0) rows.push(["Received", inr(doc.paidAmount)], ["Balance", inr(docTotal(doc) - doc.paidAmount)]);
  rows.forEach(([k, v]) => {
    const bold = k === "Total";
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(bold ? fs + 2 : fs);
    pdf.text(k, W - M - 50, y);
    pdf.text(v, W - M, y, { align: "right" });
    y += bold ? 7 : 5.5;
  });
  if (print.showAmountInWords) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(fs - 0.5);
    pdf.text(`Amount in words: ${amountInWords(docTotal(doc))}`, M, y, { maxWidth: W - 2 * M - 60 });
    y += 8;
  }

  // Bank / UPI / terms / signature
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fs - 0.5);
  if (business.bankLine) { pdf.setFont("helvetica", "bold"); pdf.text("Bank details", M, y); pdf.setFont("helvetica", "normal"); pdf.text(business.bankLine, M, y + 4.5); y += 10; }
  if (business.upiId) { pdf.text(`UPI: ${business.upiId}`, M, y); y += 6; }
  if (toggles["print.terms"] !== false && business.terms) { pdf.setFont("helvetica", "bold"); pdf.text("Terms & Conditions", M, y); pdf.setFont("helvetica", "normal"); pdf.text(business.terms, M, y + 4.5, { maxWidth: W - 2 * M - 60 }); y += 14; }
  if (doc.notes) { pdf.text(`Note: ${doc.notes}`, M, y, { maxWidth: W - 2 * M - 60 }); y += 8; }
  if (toggles["print.signature"] !== false) {
    pdf.setDrawColor(120);
    pdf.setLineWidth(0.3);
    pdf.line(W - M - 50, y + 8, W - M, y + 8);
    pdf.text(`For ${business.name}`, W - M, y + 12.5, { align: "right" });
    pdf.text("Authorised Signatory", W - M, y + 17, { align: "right" });
  }
  return pdf;
}

function buildThermal({ doc, party, business, print, toggles }: PdfCtx): jsPDF {
  const w = print.thermalWidth === "58mm" ? 58 : 80;
  const lines = 60 + doc.items.length * 12;
  const pdf = new jsPDF({ unit: "mm", format: [w, Math.max(120, lines)] });
  const M = 3;
  const fs = print.textSize === "small" ? 7 : print.textSize === "large" ? 9.5 : 8;
  let y = 6;
  const c = (t: string, size = fs, bold = false) => { pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.text(t, w / 2, y, { align: "center", maxWidth: w - 2 * M }); y += size * 0.5; };
  const lr = (l: string, r: string, bold = false) => { pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(fs); pdf.text(l, M, y); pdf.text(r, w - M, y, { align: "right" }); y += fs * 0.5; };
  const hr = () => { pdf.setDrawColor(0); pdf.setLineDashPattern([0.8, 0.8], 0); pdf.line(M, y, w - M, y); y += 3; };

  c(business.name, fs + 3, true);
  if (business.address) c(business.address, fs - 1);
  if (business.phone) c(`Ph: ${business.phone}`, fs - 1);
  if (business.gstin) c(`GSTIN: ${business.gstin}`, fs - 1);
  y += 1; hr();
  c(KIND_TITLE[doc.kind], fs + 1, true);
  lr(`No: ${doc.number}`, new Date(doc.date).toLocaleDateString("en-IN"));
  lr(`To: ${party?.name ?? doc.partyName}`, party?.phone ?? "");
  hr();
  lr("Item", "Amount", true);
  hr();
  const gst = toggles["gst.enabled"] !== false;
  doc.items.forEach((it) => {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(fs);
    pdf.text(it.name, M, y, { maxWidth: w - 2 * M }); y += fs * 0.5;
    lr(`${it.qty} x ${inr(it.rate)}${gst ? ` @${it.taxPct}%` : ""}`, inr(it.qty * it.rate * (1 + (gst ? it.taxPct : 0) / 100)));
  });
  hr();
  lr("Subtotal", inr(docSubtotal(doc)));
  if (gst) lr("GST", inr(docTax(doc)));
  lr("TOTAL", inr(docTotal(doc)), true);
  if (doc.paidAmount > 0) { lr("Received", inr(doc.paidAmount)); lr("Balance", inr(docTotal(doc) - doc.paidAmount)); }
  hr();
  if (print.showAmountInWords) { c(amountInWords(docTotal(doc)), fs - 1.5); }
  if (business.upiId) c(`Pay via UPI: ${business.upiId}`, fs - 1);
  if (toggles["print.terms"] !== false && business.terms) { y += 1; c(business.terms, fs - 1.5); }
  y += 2; c("Thank you! Visit again.", fs, true);
  return pdf;
}

/* ---------- output helpers ---------- */

export function pdfFileName(doc: InvoiceDoc) {
  return `${doc.number}.pdf`;
}

export function pdfBlobUrl(pdf: jsPDF) {
  return URL.createObjectURL(pdf.output("blob"));
}

export function downloadPdf(pdf: jsPDF, name: string) {
  pdf.save(name);
}

export function printPdf(pdf: jsPDF) {
  pdf.autoPrint();
  const url = pdfBlobUrl(pdf);
  const win = window.open(url, "_blank");
  if (!win) {
    // popup blocked — fall back to hidden iframe
    const f = document.createElement("iframe");
    f.style.display = "none";
    f.src = url;
    document.body.appendChild(f);
    f.onload = () => f.contentWindow?.print();
  }
}

/** Share via Web Share API (files) when available; otherwise download + optional WhatsApp text. */
export async function sharePdf(pdf: jsPDF, name: string, text: string): Promise<"shared" | "downloaded"> {
  const file = new File([pdf.output("blob")], name, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name, text });
      return "shared";
    } catch {
      /* user cancelled — fall through */
    }
  }
  pdf.save(name);
  return "downloaded";
}

export function whatsappLink(phone: string | undefined, text: string) {
  const num = (phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/* ---------- report PDF ---------- */

export function buildReportPdf(title: string, subtitle: string, business: Business, rows: (string | number)[][], accent = "#d32f2f"): jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: rows[0]?.length > 5 ? "landscape" : "portrait" });
  const W = pdf.internal.pageSize.getWidth();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(business.name, 12, 14);
  pdf.setFontSize(12);
  pdf.text(title, W - 12, 14, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90);
  pdf.text(subtitle, 12, 20);
  pdf.setTextColor(20);
  autoTable(pdf, {
    startY: 25,
    head: [rows[0].map(String)],
    body: rows.slice(1).map((r) => r.map((c) => (typeof c === "number" ? c.toLocaleString("en-IN") : String(c)))),
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor: hexToRgb(accent), textColor: 255 },
    margin: { left: 12, right: 12 },
  });
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(`Generated ${new Date().toLocaleString("en-IN")} · Page ${i}/${pages}`, W / 2, pdf.internal.pageSize.getHeight() - 6, { align: "center" });
  }
  return pdf;
}

/* ---------- CSV helpers ---------- */

export function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadText(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob(["\ufeff" + content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Excel-compatible export (HTML table with .xls extension opens natively in Excel/Sheets). */
export function downloadExcel(name: string, title: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<html><head><meta charset="utf-8"></head><body><h3>${esc(title)}</h3><table border="1">${rows
    .map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`)
    .join("")}</table></body></html>`;
  downloadText(`${name}.xls`, html, "application/vnd.ms-excel");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
