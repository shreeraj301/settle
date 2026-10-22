import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { groupBankLines } from "@/lib/settle/bank-view";
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
  const groups = groupBankLines(bank, matches, flags);
  return (
    <AppShell>
      <h1 className="settle-h2">Bank lines</h1>
      {bank.length === 0 ? (
        <p className="mt-3 max-w-xl text-ink-2">No bank lines in this workspace.</p>
      ) : (
        <>
      <p className="mt-1 text-sm text-ink-2">{bank.length} lines this month, sorted by date. A second payment of the same bill is listed once, under Possible duplicate.</p>
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
                  <span className="rounded-full bg-page px-2 py-0.5 text-[13px]">{KIND[b.kind]}</span>
                  <span className="font-mono-num text-sm">{b.debit ? formatInr(b.debit) : formatInr(b.credit)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
        </>
      )}
    </AppShell>
  );
}
