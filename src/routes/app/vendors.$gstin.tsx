import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { FLAG_LABEL } from "@/lib/settle/engine";
import { formatDate, formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/vendors/$gstin")({ component: VendorDetail });

function VendorDetail() {
  const { gstin } = Route.useParams();
  const vendor = useSettle((s) => s.vendors.find((v) => v.gstin === gstin));
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const flags = useSettle((s) => s.flags);

  if (!vendor) {
    return (
      <AppShell>
        <p>No vendor with GSTIN {gstin} in this workspace.</p>
        <Link to="/app/vendors" className="mt-3 inline-flex text-sm text-accent">
          All vendors
        </Link>
      </AppShell>
    );
  }

  const bills = invoices.filter((i) => i.vendorGstin === vendor.gstin || i.vendorName === vendor.name);
  const portal = twoB.filter((t) => t.vendorGstin === vendor.gstin || t.vendorName === vendor.name);
  const portalOnly = portal.filter((t) => !bills.some((i) => i.invoiceNoNorm === t.invoiceNoNorm));
  const mine = flags.filter(
    (f) => bills.some((i) => i.id === f.invoiceId) || portal.some((t) => t.id === f.twoBId),
  );
  const openItc = mine.filter((f) => f.status === "open").reduce((s, f) => s + f.itcImpact, 0);

  return (
    <AppShell>
      <Link to="/app/vendors" className="text-sm text-accent">
        All vendors
      </Link>
      <h1 className="settle-h2 mt-2">{vendor.name}</h1>
      <p className="font-mono-num mt-1 text-sm text-ink-2">{vendor.gstin}</p>
      <p className="mt-2 text-sm text-ink-2">
        {vendor.filingStatus === "not_filed" ? "GSTR-1 not filed for September." : "GSTR-1 filed."} {bills.length}{" "}
        {bills.length === 1 ? "bill" : "bills"} in your books. Open ITC {formatInr(openItc)}.
      </p>
      <h2 className="mt-6 text-sm font-medium text-ink-2">Bills in your books</h2>
      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
        {bills.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {i.invoiceNo} · {i.date ? formatDate(i.date) : "No date"}
            </span>
            <span className="font-mono-num">{formatInr(i.total)}</span>
          </li>
        ))}
        {bills.length === 0 && <li className="px-4 py-3 text-sm text-ink-2">No bill in your books for this GSTIN.</li>}
      </ul>
      {portalOnly.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-medium text-ink-2">In GSTR-2B, not in your books</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {portalOnly.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {t.invoiceNo} · {formatDate(t.date)}
                </span>
                <span className="font-mono-num">{formatInr(t.taxable + t.cgst + t.sgst + t.igst)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-6 text-sm font-medium text-ink-2">Flags</h2>
      <ul className="mt-2 space-y-2">
        {mine.map((f) => (
          <li key={f.id} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            {FLAG_LABEL[f.type]} · {f.status === "open" ? "Open" : f.status === "follow_up" ? "Follow-up" : f.status === "fixed" ? "Fixed" : "Ignored"} ·{" "}
            <span className="font-mono-num">{formatInr(f.itcImpact)}</span>
            <p className="mt-1 text-ink-2">{f.reason}</p>
          </li>
        ))}
        {mine.length === 0 && <li className="text-sm text-ink-2">No flags for this vendor.</li>}
      </ul>
    </AppShell>
  );
}
