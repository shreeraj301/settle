import type { Confidence, Money } from "./types.ts";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function rupees(paise: Money): number {
  return paise / 100;
}

export function toPaise(rupeesValue: number): Money {
  return Math.round(rupeesValue * 100);
}

export function formatInr(paise: Money): string {
  const neg = paise < 0;
  const abs = INR.format(Math.abs(paise) / 100);
  return neg ? `-${abs}` : abs;
}

export function formatInrCompact(paise: Money): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise) / 100;
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)} Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)} L`;
  return formatInr(paise);
}

export function spokenInr(paise: Money): string {
  const abs = Math.abs(paise) / 100;
  const crore = Math.floor(abs / 1_00_00_000);
  let rem = abs - crore * 1_00_00_000;
  const lakh = Math.floor(rem / 1_00_000);
  rem -= lakh * 1_00_000;
  const thousand = Math.floor(rem / 1000);
  rem = Math.round((rem - thousand * 1000) * 100) / 100;
  const parts: string[] = [];
  if (crore) parts.push(`${crore} crore`);
  if (lakh) parts.push(`${lakh} lakh`);
  if (thousand) parts.push(`${thousand} thousand`);
  if (rem || parts.length === 0) parts.push(String(rem));
  const phrase = parts.join(" ");
  return paise < 0 ? `minus rupees ${phrase}` : `rupees ${phrase}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);
  if (m) {
    const idx = MONTHS.findIndex((x) => x.toLowerCase() === m![2].toLowerCase());
    if (idx >= 0) return `${m[3]}-${String(idx + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "Not dated";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function periodLabel(period: string): string {
  const [y, mo] = period.split("-");
  const idx = Number(mo) - 1;
  const name = MONTHS[idx] ?? mo;
  return `${name} ${y}`;
}

export function periodShort(period: string): string {
  const [y, mo] = period.split("-");
  return `${mo}-${y}`;
}

export function normaliseInvoiceNo(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s/\-.]/g, "")
    .replace(/^0+/, "");
}

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function gstinChecksumOk(gstin: string): boolean {
  const g = gstin.replace(/\s/g, "").toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const c = GSTIN_CHARS.indexOf(g[i]);
    if (c < 0) return false;
    const factor = i % 2 === 0 ? 1 : 2;
    const product = c * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const check = (36 - (sum % 36)) % 36;
  return GSTIN_CHARS[check] === g[14];
}

export function cleanGstin(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

export function levelOf(score: number): Confidence {
  if (score >= 0.9) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

export function itcOf(taxable: number, cgst: number, sgst: number, igst: number): Money {
  return cgst + sgst + igst || Math.round(Math.abs(taxable) * 0) + cgst + sgst + igst;
}

export function taxOf(row: { cgst: Money; sgst: Money; igst: Money }): Money {
  return row.cgst + row.sgst + row.igst;
}
