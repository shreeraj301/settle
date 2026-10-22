import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { FLAG_LABEL } from "@/lib/settle/engine";
import { formatDate, formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/vendors/$gstin")({ component: VendorDetail });

function VendorDetail() {
  const { gstin } = Route.useParams();
  const vendor = useSettle((s) => s.vendors.find((v) => v.gstin === gstin));
  const invoices = useSettle((s) => s.invoices.filter((i) => i.vendorGstin === gstin || i.vendorName === vendor?.name));
  const flags = useSettle((s) =>
    s.flags.filter((f) => invoices.some((i) => i.id === f.invoiceId) || s.twoB.some((t) => t.id === f.twoBId && t.vendorGstin === gstin)),
  );
  if (!vendor) {
    return (
      <AppShell>
        <p>No vendor with that GSTIN in this workspace.</p>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <Link to="/app/vendors" className="text-sm text-accent">All vendors</Link>
      <h1 className="settle-h2 mt-2">{vendor.name}</h1>
      <p className="font-mono-num mt-1 text-sm text-ink-2">{vendor.gstin}</p>
      <h2 className="mt-6 text-sm font-medium text-ink-2">Bills</h2>
      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
        {invoices.map((i) => (
          <li key={i.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {i.invoiceNo} · {formatDate(i.date)}
            </span>
            <span className="font-mono-num">{formatInr(i.total)}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-sm font-medium text-ink-2">Flags</h2>
      <ul className="mt-2 space-y-2">
        {flags.map((f) => (
          <li key={f.id} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            {FLAG_LABEL[f.type]} · {f.status} · {formatInr(f.itcImpact)}
          </li>
        ))}
        {flags.length === 0 && <li className="text-sm text-ink-2">No flags for this vendor.</li>}
      </ul>
    </AppShell>
  );
}
