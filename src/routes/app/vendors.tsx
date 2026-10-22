import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { CopyButton } from "@/components/settle/ui";
import { formatInr } from "@/lib/settle/format";
import { followUpMessage, useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/vendors")({ component: Vendors });

function Vendors() {
  const vendors = useSettle((s) => s.vendors);
  const flags = useSettle((s) => s.flags);
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const business = useSettle((s) => s.businessName);
  const queue = flags.filter((f) => f.status === "follow_up");
  return (
    <AppShell>
      <h1 className="settle-h2">Vendors</h1>
      <p className="mt-1 text-sm text-ink-2">{queue.length} follow-ups waiting on a reply.</p>
      {queue.length > 0 && (
        <ul className="mt-4 space-y-3">
          {queue.map((f) => {
            const text = f.note || followUpMessage(f, invoices, twoB, business);
            const name = invoices.find((i) => i.id === f.invoiceId)?.vendorName ?? twoB.find((t) => t.id === f.twoBId)?.vendorName;
            return (
              <li key={f.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{name}</div>
                  <span className="font-mono-num text-sm">{formatInr(f.itcImpact)}</span>
                </div>
                <p className="mt-2 text-sm text-ink-2">{text}</p>
                <div className="mt-3">
                  <CopyButton text={text} label="Copy message" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Vendors in this period</caption>
          <thead>
            <tr className="text-left text-ink-2">
              <th className="px-3 py-3 font-medium">Vendor</th>
              <th className="px-3 py-3 font-medium">GSTIN</th>
              <th className="px-3 py-3 font-medium">Filing</th>
              <th className="px-3 py-3 text-right font-medium">Open ITC</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const mine = flags.filter((f) => {
                const inv = invoices.find((i) => i.id === f.invoiceId);
                const row = twoB.find((t) => t.id === f.twoBId);
                return (inv?.vendorGstin === v.gstin || row?.vendorGstin === v.gstin) && f.status === "open";
              });
              const impact = mine.reduce((s, f) => s + f.itcImpact, 0);
              return (
                <tr key={v.gstin} className="border-t border-line">
                  <th scope="row" className="max-w-[280px] px-3 py-3 text-left font-medium">
                    <Link to="/app/vendors/$gstin" params={{ gstin: v.gstin }} className="line-clamp-2 text-left">
                      {v.name}
                    </Link>
                  </th>
                  <td className="px-3 py-3 font-mono-num text-[13px]">{v.gstin}</td>
                  <td className="px-3 py-3">{v.filingStatus === "not_filed" ? "Not filed" : "Filed"}</td>
                  <td className="px-3 py-3 text-right font-mono-num">{formatInr(impact)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
