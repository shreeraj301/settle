import { formatDate, formatInr, levelOf, normaliseInvoiceNo, taxOf } from "./format.ts";
import type {
  BankTxn,
  Confidence,
  EngineResult,
  Flag,
  FlagType,
  Invoice,
  Match,
  ReasonCode,
  TwoBEntry,
} from "./types.ts";

const RUPEE = 100;

function daysBetween(a: string, b: string): number {
  if (!a || !b) return 999;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return 999;
  return Math.abs(da - db) / 86_400_000;
}

function trigram(s: string): Set<string> {
  const t = `  ${s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ")}  `;
  const set = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) set.add(t.slice(i, i + 3));
  return set;
}

function similarity(a: string, b: string): number {
  const A = trigram(a);
  const B = trigram(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function compact(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function flagId(type: FlagType, key: string): string {
  return `${type}-${key}`;
}

export function runMatch(input: {
  invoices: Invoice[];
  twoB: TwoBEntry[];
  bank: BankTxn[];
  period: string;
  compareGstinOnly?: boolean;
}): EngineResult {
  const invoices = input.invoices.map((i) => ({ ...i, invoiceNoNorm: normaliseInvoiceNo(i.invoiceNo) }));
  const twoB = input.twoB.map((i) => ({ ...i, invoiceNoNorm: normaliseInvoiceNo(i.invoiceNo) }));
  const bank = input.bank;
  const used2b = new Set<string>();
  const usedBank = new Set<string>();
  const matches: Match[] = [];
  const flags: Flag[] = [];

  const byKey = new Map<string, TwoBEntry[]>();
  for (const row of twoB) {
    const k = `${row.invoiceNoNorm}`;
    const list = byKey.get(k) ?? [];
    list.push(row);
    byKey.set(k, list);
  }

  const seenBooks = new Map<string, string>();

  for (const inv of invoices) {
    const dupKey = `${inv.vendorGstin}|${inv.invoiceNoNorm}|${inv.taxable}|${inv.total}`;
    const prior = seenBooks.get(dupKey);
    if (prior) {
      flags.push(makeFlag({
        type: "DUPLICATE",
        level: "high",
        invoice: inv,
        itc: taxOf(inv),
        reason: "This bill appears twice. Claiming both would double the credit.",
        diffs: [{ field: "Invoice no.", books: `${inv.invoiceNo} (second copy)`, twoB: "Already linked to the first copy" }],
        bankIds: [],
        key: inv.id,
      }));
      continue;
    }
    seenBooks.set(dupKey, inv.id);

    const candidates = (byKey.get(inv.invoiceNoNorm) ?? []).filter((r) => !used2b.has(r.id));
    let best: TwoBEntry | undefined;
    let bestScore = 0;
    const reasons: ReasonCode[] = [];
    for (const row of candidates) {
      const nameSim = similarity(inv.vendorName, row.vendorName);
      const gstinEq = inv.vendorGstin === row.vendorGstin;
      const amountNear = Math.abs(inv.taxable - row.taxable) <= 100 || Math.abs(inv.total - (row.taxable + taxOf(row))) <= RUPEE * 2;
      const score =
        (gstinEq || nameSim > 0.45 ? 0.45 : 0.15) +
        0.35 +
        (Math.abs(inv.taxable - row.taxable) <= RUPEE ? 0.15 : amountNear ? 0.08 : 0) +
        (daysBetween(inv.date, row.date) <= 7 ? 0.05 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }

    let linked: TwoBEntry | undefined;
    if (best && bestScore >= 0.55) {
      linked = best;
      used2b.add(best.id);
      reasons.push("INVNO_EQ");
      if (inv.vendorGstin === best.vendorGstin) reasons.push("GSTIN_EQ");
      if (Math.abs(inv.taxable - best.taxable) <= RUPEE) reasons.push("AMOUNT_EQ");
      else if (Math.abs(inv.taxable - best.taxable) <= RUPEE * 50) reasons.push("AMOUNT_NEAR");
      if (daysBetween(inv.date, best.date) <= 7) reasons.push("DATE_NEAR");
    }

    const bankHit = pickBank(inv, bank, usedBank, linked);
    for (const id of bankHit.ids) usedBank.add(id);
    reasons.push(...bankHit.reasons);

    if (!linked) {
      flags.push(makeFlag({
        type: "MISSING_IN_2B",
        level: bankHit.ids.length ? "high" : "medium",
        invoice: inv,
        itc: taxOf(inv),
        reason: `${inv.vendorName} has not shown this bill in your 2B yet, so this credit is at risk.`,
        diffs: [
          { field: "Invoice no.", books: inv.invoiceNo, twoB: "Not found" },
          { field: "Taxable", books: formatInr(inv.taxable), twoB: "Not found" },
        ],
        bankIds: bankHit.ids,
        key: inv.id,
      }));
    } else {
      const gstinDiff = inv.vendorGstin !== linked.vendorGstin;
      const amountDiff = Math.abs(inv.taxable - linked.taxable) > RUPEE || Math.abs(taxOf(inv) - taxOf(linked)) > RUPEE;
      const dateDiff = Boolean(inv.date && linked.date && inv.date !== linked.date);
      const periodDiff = linked.returnPeriod !== input.period;
      const notFiled = !linked.itcAvailable || linked.filingStatus === "not_filed";

      if (gstinDiff) {
        flags.push(makeFlag({
          type: "GSTIN_MISMATCH",
          level: "high",
          invoice: inv,
          twoB: linked,
          itc: taxOf(inv),
          reason: `The GSTIN you saved is one character off from what ${inv.vendorName} filed.`,
          diffs: [{ field: "GSTIN", books: inv.vendorGstin, twoB: linked.vendorGstin }],
          bankIds: bankHit.ids,
          key: inv.id,
        }));
      } else if (amountDiff) {
        const a = inv.taxable;
        const b = linked.taxable;
        const taxOnly = Math.abs(a - b) <= RUPEE && Math.abs(taxOf(inv) - taxOf(linked)) > RUPEE;
        const taxGap = Math.abs(taxOf(inv) - taxOf(linked));
        flags.push(makeFlag({
          type: "AMOUNT_MISMATCH",
          level: taxOnly ? "medium" : "high",
          invoice: inv,
          twoB: linked,
          itc: taxGap || taxOf(inv),
          reason: taxOnly
            ? `Tax on your bill is ${formatInr(taxOf(inv))}. GSTR-2B shows ${formatInr(taxOf(linked))}.`
            : `Bill taxable ${formatInr(a)}, 2B ${formatInr(b)}. ${formatInr(Math.abs(a - b))} difference at ${inv.rate}% GST: ${formatInr(taxGap)} tax at stake.`,
          diffs: [
            { field: "Taxable", books: formatInr(a), twoB: formatInr(b) },
            { field: "Tax", books: formatInr(taxOf(inv)), twoB: formatInr(taxOf(linked)) },
          ],
          bankIds: bankHit.ids,
          key: inv.id,
        }));
      } else if (notFiled) {
        flags.push(makeFlag({
          type: "SUPPLIER_NOT_FILED",
          level: "high",
          invoice: inv,
          twoB: linked,
          itc: taxOf(inv),
          reason: `${inv.vendorName} has not filed GSTR-1 for ${linked.returnPeriod.slice(5)}-${linked.returnPeriod.slice(0, 4)}. Wait or ask them to file.`,
          diffs: [{ field: "Filing", books: "In your books", twoB: "ITC available: No" }],
          bankIds: bankHit.ids,
          key: inv.id,
        }));
      } else if (periodDiff || (dateDiff && daysBetween(inv.date, linked.date) > 0 && periodDiff)) {
        flags.push(dateFlag(inv, linked, bankHit.ids, input.period, true));
      } else if (dateDiff && daysBetween(inv.date, linked.date) >= 2) {
        flags.push(dateFlag(inv, linked, bankHit.ids, input.period, false));
      } else {
        const score = bankHit.ids.length ? (bankHit.reasons.includes("REF_HAS_INVNO") ? 0.96 : 0.78) : 0.92;
        matches.push({
          id: `m-${inv.id}`,
          invoiceId: inv.id,
          twoBId: linked.id,
          bankTxnIds: bankHit.ids,
          confidence: score,
          level: levelOf(score),
          reasons,
          status: "auto",
        });
      }
    }

    const twin = bank.filter(
      (b) =>
        !usedBank.has(b.id) &&
        b.kind === "supplier_payment" &&
        b.debit > 0 &&
        Math.abs(b.debit - inv.total) <= RUPEE &&
        similarity(b.narration, inv.vendorName) > 0.35 &&
        daysBetween(b.date, inv.date || b.date) <= 3 &&
        !bankHit.ids.includes(b.id),
    );
    if (bankHit.ids.length && twin.length) {
      const extra = twin[0];
      usedBank.add(extra.id);
      flags.push(makeFlag({
        type: "DUPLICATE",
        level: "medium",
        invoice: inv,
        twoB: linked,
        itc: 0,
        reason: "The bank shows two payments of the same amount to this vendor, minutes apart.",
        diffs: [
          { field: "Bank", books: inv.invoiceNo, bank: `${formatInr(bankHit.ids.length ? bank.find((x) => x.id === bankHit.ids[0])!.debit : 0)} and ${formatInr(extra.debit)}` },
        ],
        bankIds: [...bankHit.ids, extra.id],
        key: `bank-${inv.id}`,
      }));
    }
  }

  for (const row of twoB) {
    if (used2b.has(row.id)) continue;
    flags.push(makeFlag({
      type: "MISSING_IN_BOOKS",
      level: "high",
      twoB: row,
      itc: taxOf(row),
      reason: `This bill is in your 2B but not in your records. Add it to claim ${formatInr(taxOf(row))}.`,
      diffs: [
        { field: "Invoice no.", books: "Not in books", twoB: row.invoiceNo },
        { field: "Taxable", books: "Not in books", twoB: formatInr(row.taxable) },
      ],
      bankIds: [],
      key: row.id,
    }));
  }

  return { matches, flags, invoices, twoB, bank };
}

function mmPeriod(period: string): string {
  const [y, m] = period.split("-");
  if (!y || !m) return period;
  return `${m}-${y}`;
}

function dateFlag(inv: Invoice, linked: TwoBEntry, bankIds: string[], period: string, periodDiff: boolean): Flag {
  const datesDiffer = Boolean(inv.date && linked.date && inv.date !== linked.date);
  const booked = mmPeriod(inv.period || period);
  const filed = mmPeriod(linked.returnPeriod);
  const claim = mmPeriod(periodDiff ? linked.returnPeriod : inv.period || period);
  let reason: string;
  if (datesDiffer) {
    reason = `Dated ${formatDate(inv.date)} in books, ${formatDate(linked.date)} in 2B.`;
    if (periodDiff) reason += ` Claim it in ${claim}.`;
    else reason += " Amounts match. This is a date note, not a credit block.";
  } else if (claim !== mmPeriod(period)) {
    reason = `Booked in ${booked}, filed in ${filed}. Claim it in ${claim}, not ${mmPeriod(period)}.`;
  } else {
    reason = `Booked in ${booked}, filed in ${filed}. Claim it in ${claim}.`;
  }
  return makeFlag({
    type: "DATE_PERIOD",
    level: periodDiff ? "medium" : "low",
    invoice: inv,
    twoB: linked,
    itc: periodDiff ? taxOf(inv) : 0,
    reason,
    diffs: [
      { field: "Date", books: formatDate(inv.date), twoB: formatDate(linked.date) },
      { field: "Period", books: mmPeriod(period), twoB: filed },
    ],
    bankIds,
    key: inv.id,
  });
}

function pickBank(inv: Invoice, bank: BankTxn[], used: Set<string>, linked?: TwoBEntry) {
  const ids: string[] = [];
  const reasons: ReasonCode[] = [];
  const target = Math.abs(inv.total);
  const norm = inv.invoiceNoNorm;
  const refHit = bank.find((b) => {
    if (used.has(b.id) || b.debit <= 0 || b.kind === "charge" || b.kind === "gst_payment") return false;
    const blob = compact(`${b.ref} ${b.narration}`);
    return norm.length >= 4 && blob.includes(norm);
  });
  if (refHit && Math.abs(refHit.debit - target) <= RUPEE * 5) {
    ids.push(refHit.id);
    reasons.push("REF_HAS_INVNO", "AMOUNT_EQ");
    return { ids, reasons };
  }
  const fuzzy = bank.find((b) => {
    if (used.has(b.id) || b.debit <= 0) return false;
    if (b.kind === "charge" || b.kind === "gst_payment" || b.kind === "advance" || b.kind === "reversal") return false;
    const close = Math.abs(b.debit - target) <= RUPEE;
    const name = similarity(b.narration, inv.vendorName) > 0.32;
    const date = daysBetween(b.date, inv.date || linked?.date || b.date) <= 10;
    return close && name && date;
  });
  if (fuzzy) {
    ids.push(fuzzy.id);
    reasons.push("PAYEE_FUZZY", "AMOUNT_EQ", "DATE_NEAR");
  }
  return { ids, reasons };
}

function makeFlag(args: {
  type: FlagType;
  level: Confidence;
  invoice?: Invoice;
  twoB?: TwoBEntry;
  itc: number;
  reason: string;
  diffs: Flag["diffs"];
  bankIds: string[];
  key: string;
}): Flag {
  return {
    id: flagId(args.type, args.key),
    periodId: "2026-09",
    type: args.type,
    level: args.level,
    invoiceId: args.invoice?.id,
    twoBId: args.twoB?.id,
    bankTxnIds: args.bankIds,
    diffs: args.diffs,
    itcImpact: Math.abs(args.itc),
    reason: args.reason,
    status: "open",
    history: [],
  };
}

export const FLAG_LABEL: Record<FlagType, string> = {
  MISSING_IN_2B: "Not in GSTR-2B",
  MISSING_IN_BOOKS: "Not in your books",
  GSTIN_MISMATCH: "GSTIN does not match",
  AMOUNT_MISMATCH: "Amount or tax differs",
  DATE_PERIOD: "Date or period differs",
  DUPLICATE: "Possible duplicate",
  SUPPLIER_NOT_FILED: "Supplier has not filed",
};

export const FLAG_ORDER: FlagType[] = [
  "MISSING_IN_2B",
  "MISSING_IN_BOOKS",
  "GSTIN_MISMATCH",
  "AMOUNT_MISMATCH",
  "DATE_PERIOD",
  "DUPLICATE",
  "SUPPLIER_NOT_FILED",
];
