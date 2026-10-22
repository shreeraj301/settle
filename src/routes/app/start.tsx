import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { periodLabel } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/start")({ component: Start });

function Start() {
  const [period, setPeriod] = useState("2026-09");
  const applyPeriod = useSettle((s) => s.setPeriod);
  const navigate = useNavigate();
  const september = period === "2026-09";
  const label = periodLabel(period || "2026-09");

  function goUpload() {
    const next = period || "2026-09";
    applyPeriod(next);
    navigate({ to: "/app/$period/upload", params: { period: next } });
  }

  function goOpen() {
    const next = period || "2026-09";
    applyPeriod(next);
    navigate({ to: "/app/$period/review", params: { period: next } });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12">
      <p className="text-[13px] font-medium text-ink-2">Settle</p>
      <h1 className="settle-h1 mt-2">Which month are we closing?</h1>
      <p className="mt-3 max-w-xl text-ink-2">Pick the return period. September opens the books on this device. Any other month opens empty, not a missing page.</p>
      <label className="mt-8 text-sm font-medium text-ink-2">
        Return period
        <input
          className="mt-1 block h-12 w-full max-w-xs rounded-md border border-line bg-surface px-3 text-base text-ink"
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </label>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button className="rounded-2xl border border-line bg-surface p-5 text-left hover:border-line-strong" onClick={goUpload}>
          <div className="font-medium">Upload my files</div>
          <p className="mt-1 text-sm text-ink-2">Opens {label}. A file you add is counted. Matching uses the books already loaded for that month.</p>
        </button>
        <button className="rounded-2xl bg-accent p-5 text-left text-[var(--color-accent-ink)]" onClick={goOpen}>
          <div className="font-medium">{september ? "Open Shree Ganesh Traders" : `Open ${label}`}</div>
          <p className="mt-1 text-sm opacity-90">
            {september ? "Aurangabad, September 2026. Bills, 2B and bank are already in." : `No bills are loaded for ${label}. Approve stays off.`}
          </p>
        </button>
      </div>
      <ol className="mt-10 space-y-2 text-sm text-ink-2">
        <li>1. Three files in. We count the rows before anything is matched.</li>
        <li>2. We pair each bill with 2B and the bank payment.</li>
        <li>3. You review only the rows that do not agree.</li>
      </ol>
    </main>
  );
}
