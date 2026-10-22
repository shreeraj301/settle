import { taxOf } from "@/lib/settle/format";
import type { Flag, Invoice, Match, TwoBEntry } from "@/lib/settle/types";

export function itcSummary(flags: Flag[], matches: Match[], invoices: Invoice[], twoB: TwoBEntry[]) {
  const invBy = new Map(invoices.map((i) => [i.id, i]));
  const claimedInvoice = new Set<string>();
  let claimable = 0;
  for (const m of matches) {
    if (!m.invoiceId || claimedInvoice.has(m.invoiceId)) continue;
    const inv = invBy.get(m.invoiceId);
    if (!inv) continue;
    claimable += taxOf(inv);
    claimedInvoice.add(m.invoiceId);
  }
  let atRisk = 0;
  let follow = 0;
  for (const f of flags) {
    const blocks = f.type !== "DUPLICATE" || f.itcImpact > 0;
    const lowDate = f.type === "DATE_PERIOD" && f.level === "low";
    if (f.status === "fixed") {
      if (f.type === "MISSING_IN_BOOKS") claimable += f.itcImpact;
      else if (f.invoiceId && !claimedInvoice.has(f.invoiceId) && f.type !== "DUPLICATE" && !lowDate) {
        const inv = invBy.get(f.invoiceId);
        claimable += inv ? taxOf(inv) : f.itcImpact;
        if (f.invoiceId) claimedInvoice.add(f.invoiceId);
      }
    } else if (f.status === "follow_up") {
      follow += f.itcImpact;
    } else if (f.status === "open" && blocks && !lowDate) {
      atRisk += f.itcImpact;
    }
  }
  void twoB;
  return { claimable, atRisk, follow };
}
