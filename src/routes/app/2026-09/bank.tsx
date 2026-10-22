import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { formatDate, formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/bank")({ component: BankPage });

const KIND: Record<string, string> = {
  supplier_payment: "Supplier payment",
  receipt: "Customer receipt",
  charge: "Bank charge",
  gst_payment: "GST payment",
  reversal: "Reversal",
  advance: "Advance",
  interest: "Interest",
  unknown: "Other",
};

function BankPage() {
  const bank = useSettle((s) => s.bank);
  const matches = useSettle((s) => s.matches);
  const flags = useSettle((s) => s.flags);
  const linked = new Set([...matches.flatMap((m) => m.bankTxnIds), ...flags.flatMap((f) => f.bankTxnIds)]);
  const groups = [
    { title: "Linked to a bill", rows: bank.filter((b) => linked.has(b.id) && b.kind === "supplier_payment") },
    { title: "Not linked yet", rows: bank.filter((b) => !linked.has(b.id) && b.kind === "supplier_payment") },
    { title: "Other bank lines", rows: bank.filter((b) => b.kind !== "supplier_payment") },
  ];
  return (
    <AppShell>
      <h1 className="text-[28px] font-semibold tracking-tight">Bank lines</h1>
      <p className="mt-1 text-sm text-ink-2">{bank.length} lines this month, including receipts, charges and the GST challan.</p>
      <div className="mt-5 space-y-6">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-sm font-medium text-ink-2">{g.title}</h2>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
              {g.rows.length === 0 && <li className="px-4 py-3 text-sm text-ink-2">None.</li>}
              {g.rows.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="w-24 text-sm text-ink-2">{formatDate(b.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{b.narration}</span>
                  <span className="rounded-full bg-page px-2 py-0.5 text-[12px]">{KIND[b.kind]}</span>
                  <span className="font-mono-num text-sm">{b.debit ? formatInr(b.debit) : formatInr(b.credit)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
