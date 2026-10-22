import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { itcSummary } from "@/components/settle/summary";
import { formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/match")({ component: MatchPage });

const STAGES = ["Reading bills", "Pairing GSTR-2B", "Checking the bank", "Writing flags"];

function MatchPage() {
  const invoices = useSettle((s) => s.invoices);
  const flags = useSettle((s) => s.flags);
  const matches = useSettle((s) => s.matches);
  const twoB = useSettle((s) => s.twoB);
  const seen = useSettle((s) => s.matchedSeen);
  const mark = useSettle((s) => s.markMatchedSeen);
  const [stage, setStage] = useState(seen ? STAGES.length : 0);
  const [shown, setShown] = useState(seen ? Math.min(12, matches.length) : 0);
  const navigate = useNavigate();
  const totals = useMemo(() => itcSummary(flags, matches, invoices, twoB), [flags, matches, invoices, twoB]);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (seen || reduce) {
      setStage(STAGES.length);
      setShown(Math.min(12, matches.length));
      mark();
      return;
    }
    const timers: number[] = [];
    STAGES.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStage(i + 1), 500 * (i + 1)));
    });
    timers.push(
      window.setTimeout(() => {
        setShown(Math.min(12, matches.length));
        mark();
      }, 2200),
    );
    return () => timers.forEach(clearTimeout);
  }, [seen, reduce, matches.length, mark]);

  const done = stage >= STAGES.length;
  const books = invoices.slice(0, 8);
  const pairs = matches.slice(0, shown);

  return (
    <AppShell step="match">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Matching September</h1>
          <p className="mt-1 text-ink-2" aria-live="polite">
            {done ? `${flags.length} flags to review. ${matches.length} bills already agree.` : STAGES[Math.min(stage, STAGES.length - 1)]}
          </p>
        </div>
        <button
          className="inline-flex h-12 items-center rounded-full bg-accent px-6 font-medium text-[var(--color-accent-ink)] disabled:opacity-40"
          disabled={!done}
          onClick={() => navigate({ to: "/app/2026-09/review" })}
        >
          Review {flags.filter((f) => f.status === "open").length} flags
        </button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-accent transition-all" style={{ width: `${(stage / STAGES.length) * 100}%` }} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Column title="Books" rows={books.map((i) => `${i.invoiceNo} · ${i.vendorName.split(" ")[0]}`)} />
        <Column title="GSTR-2B" rows={twoB.slice(0, 8).map((i) => `${i.invoiceNo} · ${i.vendorName.split(" ")[0]}`)} />
        <Column title="Bank" rows={pairs.map((m) => (m.bankTxnIds.length ? "Payment linked" : "No bank line"))} />
      </div>

      <svg viewBox="0 0 600 80" className="mt-4 hidden h-16 w-full lg:block" aria-hidden>
        {pairs.slice(0, 6).map((_, i) => (
          <path
            key={i}
            d={`M40 ${10 + i * 10} C 200 ${10 + i * 8}, 400 ${60 - i * 6}, 560 ${20 + (i % 3) * 16}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeDasharray={done ? "0" : "8 6"}
            opacity={0.7}
          />
        ))}
      </svg>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile label="Claimable if flags clear" value={formatInr(totals.claimable)} />
        <Tile label="At risk" value={formatInr(totals.atRisk)} />
        <Tile label="Matched pairs" value={String(matches.length)} />
      </div>
      <p className="mt-4 text-sm text-ink-2">
        Want the row list? <Link to="/app/2026-09/matched" className="text-accent">Open matched bills</Link>
      </p>
    </AppShell>
  );
}

function Column({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-medium text-ink-2">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r} className="truncate rounded-lg bg-page px-3 py-2 text-sm">
            {r}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-[13px] text-ink-2">{label}</div>
      <div className="font-mono-num mt-1 text-2xl">{value}</div>
    </div>
  );
}
