import { normaliseInvoiceNo, toPaise } from "./format.ts";
import type { BankTxn, Invoice, TwoBEntry, Vendor } from "./types.ts";

export const BUSINESS = {
  id: "sgt",
  name: "Shree Ganesh Traders",
  gstin: "27SGTXS0000G1ZR",
  stateCode: "27",
  city: "Aurangabad",
  period: "2026-09",
};

type V = { key: string; name: string; gstin: string };

const VENDORS: V[] = [
  { key: "A", name: "Aurangpura Oil Depot", gstin: "27SGTXA0001K1ZZ" },
  { key: "B", name: "Bhavani Pulses & Grains", gstin: "27SGTXB0002K1ZX" },
  { key: "C", name: "Chikalthana Packaging", gstin: "27SGTXC0003K1ZV" },
  { key: "D", name: "Deogiri Soaps & Detergents", gstin: "27SGTXD0004K1ZT" },
  { key: "E", name: "Ellora Electricals Supply", gstin: "27SGTXE0005K1ZR" },
  { key: "F", name: "Bengaluru Spice Exporters", gstin: "29SGTXF0006K1ZL" },
  { key: "G", name: "Gulmandi Sugar Agency", gstin: "27SGTXG0007K1ZN" },
  { key: "H", name: "Harsul Transport Co", gstin: "27SGTXH0008K1ZL" },
  {
    key: "J",
    name: "Jyoti Kirana Wholesale Distributors of Marathwada and Vidarbha Private Limited",
    gstin: "27SGTXJ0009K1ZI",
  },
];

const byKey = Object.fromEntries(VENDORS.map((v) => [v.key, v])) as Record<string, V>;

function taxSplit(taxableRupees: number, rate: number, igst: boolean) {
  const tax = Math.round(taxableRupees * rate) / 100;
  const taxable = toPaise(taxableRupees);
  if (igst) return { taxable, cgst: 0, sgst: 0, igst: toPaise(tax), total: taxable + toPaise(tax) };
  const half = toPaise(tax / 2);
  return { taxable, cgst: half, sgst: half, igst: 0, total: taxable + half + half };
}

type Row = {
  id: string;
  v: string;
  no: string;
  date: string | null;
  taxable: number;
  rate: number;
  twoB?: "absent" | "same" | Partial<{
    gstin: string;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    date: string;
    period: string;
    itc: boolean;
    filed: "filed" | "not_filed";
  }>;
  doc?: "invoice" | "credit_note";
  booksGstin?: string;
  skipBooks?: boolean;
  duplicateBooks?: boolean;
};

const ROWS: Row[] = [
  { id: "1", v: "A", no: "AOD/0901", date: "2026-09-01", taxable: 48000, rate: 5 },
  { id: "2", v: "B", no: "BPG-221", date: "2026-09-02", taxable: 112500, rate: 5 },
  { id: "3", v: "C", no: "CP/7781", date: "2026-09-03", taxable: 9200, rate: 18 },
  { id: "4", v: "D", no: "DSD/104", date: "2026-09-04", taxable: 22750, rate: 18 },
  { id: "5", v: "E", no: "EES-3310", date: "2026-09-05", taxable: 15400, rate: 18 },
  { id: "6", v: "F", no: "BSE/KA/0912", date: "2026-09-06", taxable: 64000, rate: 5 },
  { id: "7", v: "G", no: "GSA/556", date: "2026-09-07", taxable: 86000, rate: 5 },
  { id: "8", v: "H", no: "HTC/F/090", date: "2026-09-08", taxable: 6000, rate: 5 },
  { id: "9", v: "J", no: "JKW/26/1441", date: "2026-09-09", taxable: 38900, rate: 18 },
  { id: "10", v: "A", no: "AOD/0915", date: "2026-09-15", taxable: 52000, rate: 5, twoB: "absent" },
  { id: "11", v: "H", no: "HTC/F/097", date: null, taxable: 4500, rate: 5, skipBooks: true, twoB: { date: "2026-09-18" } },
  { id: "12", v: "D", no: "DSD/111", date: "2026-09-12", taxable: 18300, rate: 18, booksGstin: "27SGTXD0O04K1ZT" },
  { id: "13", v: "B", no: "BPG-238", date: "2026-09-14", taxable: 74000, rate: 5, twoB: { taxable: 47000 } },
  {
    id: "14",
    v: "E",
    no: "EES-3329",
    date: "2026-09-16",
    taxable: 11000,
    rate: 18,
    twoB: { cgst: 900, sgst: 900 },
  },
  { id: "15", v: "C", no: "CP/7702", date: "2026-08-28", taxable: 7600, rate: 18, twoB: { period: "2026-08", date: "2026-08-28" } },
  { id: "16", v: "G", no: "GSA/561", date: "2026-09-20", taxable: 43000, rate: 5, twoB: { date: "2026-09-22" } },
  { id: "17", v: "J", no: "JKW/26/1458", date: "2026-09-21", taxable: 12400, rate: 18, duplicateBooks: true },
  { id: "19", v: "C", no: "CP/7795", date: "2026-09-22", taxable: 5250, rate: 18 },
  { id: "20", v: "F", no: "BSE/KA/0930", date: "2026-09-24", taxable: 30000, rate: 5, twoB: { itc: false, filed: "not_filed" } },
  { id: "21", v: "A", no: "AOD/CN-07", date: "2026-09-25", taxable: -4000, rate: 5, doc: "credit_note" },
  { id: "22", v: "D", no: "DSD/118", date: "2026-09-26", taxable: 9999, rate: 18 },
  { id: "23", v: "E", no: "EES-3341", date: "2026-09-27", taxable: 205000, rate: 18 },
  { id: "24", v: "B", no: "BPG-245", date: "2026-09-28", taxable: 1500, rate: 5 },
  { id: "25", v: "G", no: "GSA/570", date: "2026-09-30", taxable: 21000, rate: 5 },
];

function makeInvoice(row: Row, suffix = ""): Invoice {
  const v = byKey[row.v];
  const igst = row.v === "F";
  const t = taxSplit(row.taxable, row.rate, igst);
  return {
    id: `inv-${row.id}${suffix}`,
    vendorGstin: row.booksGstin ?? v.gstin,
    vendorName: v.name,
    invoiceNo: row.no,
    invoiceNoNorm: normaliseInvoiceNo(row.no),
    date: row.date ?? "",
    docType: row.doc ?? "invoice",
    taxable: t.taxable,
    cgst: t.cgst,
    sgst: t.sgst,
    igst: t.igst,
    total: t.total,
    rate: row.rate,
    period: "2026-09",
  };
}

function makeTwoB(row: Row): TwoBEntry | null {
  if (row.twoB === "absent") return null;
  const v = byKey[row.v];
  const igst = row.v === "F";
  const base = taxSplit(row.taxable, row.rate, igst);
  const ov = typeof row.twoB === "object" ? row.twoB : {};
  let taxable = base.taxable;
  let cgst = base.cgst;
  let sgst = base.sgst;
  let igstAmt = base.igst;
  if (ov.taxable != null) {
    const t2 = taxSplit(ov.taxable, row.rate, igst);
    taxable = t2.taxable;
    cgst = t2.cgst;
    sgst = t2.sgst;
    igstAmt = t2.igst;
  }
  if (ov.cgst != null) cgst = toPaise(ov.cgst);
  if (ov.sgst != null) sgst = toPaise(ov.sgst);
  if (ov.igst != null) igstAmt = toPaise(ov.igst);
  return {
    id: `2b-${row.id}`,
    vendorGstin: ov.gstin ?? v.gstin,
    vendorName: v.name,
    invoiceNo: row.no,
    invoiceNoNorm: normaliseInvoiceNo(row.no),
    date: ov.date ?? row.date ?? "2026-09-18",
    docType: row.doc ?? "invoice",
    returnPeriod: ov.period ?? "2026-09",
    taxable,
    cgst,
    sgst,
    igst: igstAmt,
    itcAvailable: ov.itc ?? true,
    filingStatus: ov.filed ?? "filed",
  };
}

export function buildWorkspace(): { invoices: Invoice[]; twoB: TwoBEntry[]; bank: BankTxn[]; vendors: Vendor[] } {
  const invoices: Invoice[] = [];
  const twoB: TwoBEntry[] = [];
  for (const row of ROWS) {
    if (!row.skipBooks) invoices.push(makeInvoice(row));
    if (row.duplicateBooks) invoices.push(makeInvoice(row, "b"));
    const t = makeTwoB(row);
    if (t) twoB.push(t);
  }

  const bank: BankTxn[] = [];
  let bal = toPaise(485230.5);
  let n = 1;
  const push = (partial: {
    date: string;
    narration: string;
    ref: string;
    channel: BankTxn["channel"];
    kind: BankTxn["kind"];
    debit?: number;
    credit?: number;
  }) => {
    bal = bal - (partial.debit ?? 0) + (partial.credit ?? 0);
    bank.push({
      id: `bk-${n++}`,
      balance: bal,
      debit: partial.debit ?? 0,
      credit: partial.credit ?? 0,
      date: partial.date,
      narration: partial.narration,
      ref: partial.ref,
      channel: partial.channel,
      kind: partial.kind,
    });
  };

  const pay = (
    date: string,
    narration: string,
    amountRupees: number,
    channel: BankTxn["channel"],
    ref: string,
    kind: BankTxn["kind"] = "supplier_payment",
  ) => push({ date, narration, debit: toPaise(amountRupees), credit: 0, channel, ref, kind });

  pay("2026-09-02", "NEFT AOD0901 AURANGPURA OIL DEPOT", 50400, "NEFT", "AOD0901");
  pay("2026-09-03", "RTGS BHAVANI PULSES AND GRAINS", 118125, "RTGS", "");
  pay("2026-09-04", "UPI CHIKALTHANA PACKAGING", 10856, "UPI", "UPI4921");
  pay("2026-09-05", "IMPS DSD104 DEOGIRI SOAPS", 26845, "IMPS", "DSD104");
  pay("2026-09-06", "CHQ 000221 ELLORA ELECTRICALS", 18172, "CHQ", "000221");
  pay("2026-09-07", "NEFT BENGALURU SPICE EXPORTERS", 67200, "NEFT", "BSEKA0912");
  pay("2026-09-08", "RTGS GSA556 GULMANDI SUGAR", 90300, "RTGS", "GSA556");
  pay("2026-09-09", "UPI HARSUL TRANSPORT", 6300, "UPI", "");
  pay("2026-09-10", "NEFT JYOTI KIRANA WHOLESALE", 45902, "NEFT", "JKW261441");
  pay("2026-09-16", "NEFT AOD0915 AURANGPURA OIL", 54600, "NEFT", "AOD0915");
  pay("2026-09-19", "UPI HTCF097 HARSUL TRANSPORT", 4725, "UPI", "HTCF097");
  pay("2026-09-13", "IMPS DEOGIRI SOAPS DSD111", 21594, "IMPS", "DSD111");
  pay("2026-09-15", "RTGS BHAVANI PULSES", 77700, "RTGS", "");
  pay("2026-09-02", "UPI CHIKALTHANA PACKAGING CP7702", 8968, "UPI", "CP7702");
  pay("2026-09-23", "RTGS GULMANDI SUGAR GSA561", 45150, "RTGS", "GSA561");
  pay("2026-09-22", "NEFT JYOTI KIRANA JKW261458", 14632, "NEFT", "JKW261458");
  pay("2026-09-22", "UPI CHIKALTHANA PACKAGING", 6195, "UPI", "UPI881");
  pay("2026-09-22", "UPI CHIKALTHANA PACKAGING", 6195, "UPI", "UPI882");
  pay("2026-09-25", "NEFT BENGALURU SPICE EXPORTERS", 31500, "NEFT", "BSEKA0930");
  pay("2026-09-28", "RTGS ELLORA ELECTRICALS SUPPLY", 241900, "RTGS", "");
  pay("2026-09-29", "UPI BHAVANI PULSES", 1575, "UPI", "");

  push({ date: "2026-09-03", narration: "UPI RAVI KIRANA CIDCO", credit: toPaise(8420), channel: "UPI", ref: "", kind: "receipt" });
  push({ date: "2026-09-08", narration: "UPI MEENA STORES JALNA ROAD", credit: toPaise(12650), channel: "UPI", ref: "", kind: "receipt" });
  push({ date: "2026-09-14", narration: "UPI SHAH TRADERS PAITHAN", credit: toPaise(5400), channel: "UPI", ref: "", kind: "receipt" });
  push({ date: "2026-09-21", narration: "UPI OSMANPURA MART", credit: toPaise(9800), channel: "UPI", ref: "", kind: "receipt" });
  push({ date: "2026-09-11", narration: "CASH DEPOSIT BRANCH", credit: toPaise(25000), channel: "CASH", ref: "", kind: "receipt" });
  push({ date: "2026-09-30", narration: "BANK CHARGES SMS", debit: toPaise(118), channel: "CHARGE", ref: "", kind: "charge" });
  push({ date: "2026-09-30", narration: "BANK CHARGES GST ON CHARGES", debit: toPaise(59), channel: "CHARGE", ref: "", kind: "charge" });
  push({
    date: "2026-09-20",
    narration: "GST PAYMENT CPIN GSTR-3B AUG-26",
    debit: toPaise(41230),
    channel: "GST",
    ref: "CPIN",
    kind: "gst_payment",
  });
  push({
    date: "2026-09-18",
    narration: "NEFT ADVANCE AURANGPURA OIL DEPOT",
    debit: toPaise(25000),
    channel: "NEFT",
    ref: "ADVANCE",
    kind: "advance",
  });
  push({ date: "2026-09-17", narration: "NEFT ELLORA ELECTRICALS SUPPLY", debit: toPaise(10000), channel: "NEFT", ref: "", kind: "supplier_payment" });
  push({
    date: "2026-09-17",
    narration: "NEFT REVERSAL ELLORA ELECTRICALS",
    credit: toPaise(10000),
    channel: "NEFT",
    ref: "REV",
    kind: "reversal",
  });
  push({ date: "2026-09-30", narration: "INTEREST CREDIT", credit: toPaise(214.6), channel: "INT", ref: "", kind: "interest" });

  const vendors: Vendor[] = VENDORS.map((v) => ({
    gstin: v.gstin,
    name: v.name,
    stateCode: v.gstin.slice(0, 2),
    filingStatus: v.key === "F" ? "not_filed" : "filed",
  }));

  return { invoices, twoB, bank, vendors };
}

export const OPENING_BALANCE = toPaise(485230.5);
