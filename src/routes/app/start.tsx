import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/start")({ component: Start });

function Start() {
  const [period, setPeriod] = useState("2026-09");
  const navigate = useNavigate();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12">
      <p className="text-[13px] font-medium text-ink-2">Settle</p>
      <h1 className="settle-h1 mt-2">Which month are we closing?</h1>
      <p className="mt-3 max-w-xl text-ink-2">Pick the return period. Then upload your files, or open the books already on this device.</p>
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
        <button
          className="rounded-2xl border border-line bg-surface p-5 text-left hover:border-line-strong"
          onClick={() => navigate({ to: "/app/2026-09/upload" })}
        >
          <div className="font-medium">Upload my files</div>
          <p className="mt-1 text-sm text-ink-2">Bills, bank statement, and GSTR-2B for this period.</p>
        </button>
        <Link to="/app/2026-09/match" className="rounded-2xl bg-accent p-5 text-left text-[var(--color-accent-ink)]">
          <div className="font-medium">Open Shree Ganesh Traders</div>
          <p className="mt-1 text-sm opacity-90">Aurangabad, September 2026. Bills, 2B and bank are already in.</p>
        </Link>
      </div>
      <ol className="mt-10 space-y-2 text-sm text-ink-2">
        <li>1. Three files in. We count the rows before anything is matched.</li>
        <li>2. We pair each bill with 2B and the bank payment.</li>
        <li>3. You review only the rows that do not agree.</li>
      </ol>
    </main>
  );
}
