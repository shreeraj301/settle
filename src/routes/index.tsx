import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { buildWorkspace } from "@/lib/settle/dataset";
import { FLAG_LABEL, runMatch } from "@/lib/settle/engine";
import { formatInr, periodLabel } from "@/lib/settle/format";
import { itcSummary } from "@/components/settle/summary";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const preview = useMemo(() => {
    const data = buildWorkspace();
    const result = runMatch({ invoices: data.invoices, twoB: data.twoB, bank: data.bank, period: "2026-09" });
    const totals = itcSummary(result.flags, result.matches, result.invoices, result.twoB);
    return { flags: result.flags.slice(0, 3), totals, open: result.flags.length, matched: result.matches.length };
  }, []);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-[32px] leading-none">Settle</span>
        <Link to="/app/start" className="text-sm font-medium text-accent">
          Open workspace
        </Link>
      </header>
      <main className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:pt-10">
        <div>
          <p className="text-[13px] font-medium tracking-wide text-ink-2">GST input credit, explained</p>
          <h1 className="font-display mt-3 max-w-xl text-[40px] leading-[1.08] sm:text-[56px]">
            Which credit can you claim this month?
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-2">
            Settle reads your purchase bills, GSTR-2B and bank statement together. Every mismatch says why, in plain words, with the rows beside it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app/start"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[15px] font-medium text-[var(--color-accent-ink)]"
            >
              Check September bills <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/app/2026-09/match"
              className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-surface px-6 text-[15px] font-medium"
            >
              Open Shree Ganesh Traders
            </Link>
          </div>
          <ol className="mt-12 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
            {[
              ["1. Bring the files", "Bills, bank statement, and GSTR-2B. Any order."],
              ["2. See the differences", "GSTIN, amount, date, missing bills, duplicates."],
              ["3. Fix, then approve", "Edit, link, ask the vendor, or ignore. Then export."],
            ].map(([t, d]) => (
              <li key={t}>
                <div className="font-medium">{t}</div>
                <p className="mt-1 text-sm text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </div>

        <section aria-label="September working view" className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-1)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-medium text-ink-2">Shree Ganesh Traders · Aurangabad</div>
              <h2 className="font-display text-[28px] leading-tight">{periodLabel("2026-09")}</h2>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-ink-2">Can be claimed</div>
              <div className="font-mono-num text-xl">{formatInr(preview.totals.claimable)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <Stat label="Matched" value={String(preview.matched)} />
            <Stat label="To review" value={String(preview.open)} />
            <Stat label="At risk" value={formatInr(preview.totals.atRisk)} />
          </div>
          <ul className="mt-5 divide-y divide-line">
            {preview.flags.map((f) => (
              <li key={f.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{FLAG_LABEL[f.type]}</span>
                  <span className="font-mono-num text-sm">{formatInr(f.itcImpact)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-2">{f.reason}</p>
              </li>
            ))}
          </ul>
          <Link to="/app/2026-09/review" className="mt-4 inline-flex text-sm font-medium text-accent">
            Review these flags
          </Link>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-page px-3 py-3">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className="font-mono-num mt-1 text-sm">{value}</div>
    </div>
  );
}
