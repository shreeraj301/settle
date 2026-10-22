import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { ConfidencePill } from "@/components/settle/ui";
import { formatDate, formatInr, taxOf } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/matched")({ component: Matched });

function Matched() {
  const matches = useSettle((s) => s.matches);
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const bank = useSettle((s) => s.bank);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <AppShell>
      <h1 className="settle-h2">Matched bills</h1>
      <p className="mt-1 text-sm text-ink-2">{matches.length} pairs where books and 2B agree.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Matched purchase bills for September 2026</caption>
          <thead className="sticky top-0 bg-surface text-left text-ink-2">
            <tr>
              <th className="px-3 py-3 font-medium">Invoice</th>
              <th className="px-3 py-3 font-medium">Vendor</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 text-right font-medium">Tax</th>
              <th className="px-3 py-3 font-medium">Confidence</th>
              <th className="px-3 py-3 font-medium">Bank</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => {
              const inv = invoices.find((i) => i.id === m.invoiceId);
              const row = twoB.find((t) => t.id === m.twoBId);
              if (!inv) return null;
              const expanded = open === m.id;
              return (
                <Fragment key={m.id}>
                  <tr className="border-t border-line">
                    <th scope="row" className="px-3 py-3 text-left font-medium">
                      <button className="underline decoration-line" onClick={() => setOpen(expanded ? null : m.id)}>
                        {inv.invoiceNo}
                      </button>
                    </th>
                    <td className="max-w-[240px] truncate px-3 py-3">{inv.vendorName}</td>
                    <td className="px-3 py-3">{formatDate(inv.date)}</td>
                    <td className="px-3 py-3 text-right font-mono-num">{formatInr(taxOf(inv))}</td>
                    <td className="px-3 py-3">
                      <ConfidencePill level={m.level} />
                    </td>
                    <td className="px-3 py-3">{m.bankTxnIds.length ? "Linked" : "Unpaid"}</td>
                  </tr>
                  {expanded && (
                    <tr className="bg-page">
                      <td colSpan={6} className="px-3 py-3 text-sm">
                        2B {row?.invoiceNo} dated {formatDate(row?.date)}, taxable {row ? formatInr(row.taxable) : ""}. Bank:{" "}
                        {m.bankTxnIds.map((id) => bank.find((b) => b.id === id)?.narration).filter(Boolean).join("; ") || "No bank line"}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {matches.length === 0 && <p className="mt-4 text-sm">No matched bills yet. Run a match to see them here.</p>}
    </AppShell>
  );
}
