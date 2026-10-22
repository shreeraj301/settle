import type { BankTxn, Flag, Match } from "./types.ts";

export type BankGroup = { title: string; rows: BankTxn[] };

function byDate(a: BankTxn, b: BankTxn) {
  return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
}

/** Each bank line is listed once. A second payment of the same bill is not also "linked". */
export function groupBankLines(bank: BankTxn[], matches: Match[], flags: Flag[]): BankGroup[] {
  const primary = new Set<string>();
  for (const m of matches) for (const id of m.bankTxnIds) primary.add(id);
  for (const f of flags) {
    if (f.type === "DUPLICATE") continue;
    for (const id of f.bankTxnIds) primary.add(id);
  }
  const duplicate = new Set<string>();
  for (const f of flags) {
    if (f.type !== "DUPLICATE") continue;
    for (const id of f.bankTxnIds) {
      if (!primary.has(id)) duplicate.add(id);
    }
  }
  const used = new Set<string>();
  const take = (pred: (b: BankTxn) => boolean) => {
    const rows = bank.filter((b) => !used.has(b.id) && pred(b)).sort(byDate);
    for (const row of rows) used.add(row.id);
    return rows;
  };
  return [
    { title: "Linked to a bill", rows: take((b) => primary.has(b.id) && b.kind === "supplier_payment") },
    { title: "Possible duplicate", rows: take((b) => duplicate.has(b.id)) },
    { title: "Not linked yet", rows: take((b) => b.kind === "supplier_payment") },
    { title: "Other bank lines", rows: take(() => true) },
  ];
}
