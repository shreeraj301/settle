import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { itcSummary } from "@/components/settle/summary";
import { PillButton } from "@/components/settle/ui";
import { FLAG_LABEL } from "@/lib/settle/engine";
import { formatDate, formatInr, periodLabel } from "@/lib/settle/format";
import { countsByType, useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/approve")({ component: Approve });

function Approve() {
  const flags = useSettle((s) => s.flags);
  const matches = useSettle((s) => s.matches);
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const status = useSettle((s) => s.status);
  const approvedAt = useSettle((s) => s.approvedAt);
  const approve = useSettle((s) => s.approve);
  const reopen = useSettle((s) => s.reopen);
  const business = useSettle((s) => s.businessName);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const totals = useMemo(() => itcSummary(flags, matches, invoices, twoB), [flags, matches, invoices, twoB]);
  const counts = countsByType(flags);
  const openCount = flags.filter((f) => f.status === "open").length;
  const highOpen = flags.filter((f) => f.status === "open" && f.level === "high").length;
  const approveLabel = highOpen > 0 ? `Approve September (${highOpen} high flags open)` : "Approve September";
  const max = Math.max(totals.claimable + totals.atRisk + totals.follow, 1);

  return (
    <AppShell step="approve">
      <p className="text-[13px] font-medium text-ink-2">{business}</p>
      <h1 className="settle-h1 mt-1">{periodLabel("2026-09")}</h1>
      {status === "approved" && (
        <p className="mt-3 rounded-xl bg-success-tint px-4 py-3 text-sm text-success">
          Approved on {formatDate(approvedAt?.slice(0, 10))} by you.{" "}
          <button className="underline" onClick={() => reopen()}>
            Reopen period
          </button>
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile label="Claimable" value={formatInr(totals.claimable)} />
        <Tile label="At risk" value={formatInr(totals.atRisk)} />
        <Tile label="Needs follow-up" value={formatInr(totals.follow)} />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="flex h-full">
          <div className="bg-success" style={{ width: `${(totals.claimable / max) * 100}%` }} />
          <div className="bg-danger" style={{ width: `${(totals.atRisk / max) * 100}%` }} />
          <div className="bg-warning" style={{ width: `${(totals.follow / max) * 100}%` }} />
        </div>
      </div>
      <p className="mt-2 text-[13px] text-ink-2">Green can be claimed. Red is still open. Amber is with a vendor.</p>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {Object.entries(counts).map(([k, n]) => (
          <li key={k} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{FLAG_LABEL[k as keyof typeof FLAG_LABEL]}</span>
            <span className="font-mono-num">{n} open</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        {status !== "approved" ? (
          <PillButton disabled={highOpen > 0} onClick={() => setOpen(true)}>
            {approveLabel}
          </PillButton>
        ) : (
          <Link to="/app/2026-09/export" className="inline-flex h-11 items-center rounded-full bg-accent px-5 font-medium text-[var(--color-accent-ink)]">
            Export
          </Link>
        )}
        <Link to="/app/2026-09/review" className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm">
          Back to flags
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)] p-4 sm:items-center" role="dialog" aria-modal aria-labelledby="approve-title">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-[var(--shadow-2)]">
            <h2 id="approve-title" className="text-xl font-semibold">Approve September?</h2>
            <p className="mt-2 text-sm text-ink-2">
              Claimable {formatInr(totals.claimable)}. At risk {formatInr(totals.atRisk)}. {openCount} flags still open.
            </p>
            {openCount > 0 && (
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                I reviewed open flags
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <PillButton tone="secondary" onClick={() => setOpen(false)}>
                Not yet
              </PillButton>
              <PillButton
                disabled={openCount > 0 && !checked}
                onClick={() => {
                  approve();
                  setOpen(false);
                }}
              >
                Approve
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </AppShell>
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
