import { Link } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { periodLabel } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";
import { AppShell } from "./shell";

const PAGE_TITLE: Record<string, string> = {
  upload: "Files",
  match: "Match",
  review: "Review",
  matched: "Matched bills",
  bank: "Bank",
  approve: "Approve",
  export: "Export",
};

export function OtherPeriod({ period, page }: { period: string; page: string }) {
  const setPeriod = useSettle((s) => s.setPeriod);
  const business = useSettle((s) => s.businessName);
  useLayoutEffect(() => {
    setPeriod(period);
  }, [period, setPeriod]);

  const label = periodLabel(period);
  const step = page === "matched" || page === "bank" ? undefined : page;

  return (
    <AppShell step={step}>
      <p className="text-[13px] font-medium text-ink-2">{business}</p>
      <h1 className="settle-h2 mt-1">
        {PAGE_TITLE[page] ?? "Month"} for {label}
      </h1>
      <p className="mt-3 max-w-xl text-ink-2">No bills are loaded for {label}. Nothing here is matched, and Approve stays off.</p>
      <p className="mt-2 max-w-xl text-sm text-ink-2">September is the month already on this device. A file you add is counted on the upload screen. It is not used for matching.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/app/start" className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-[var(--color-accent-ink)]">
          Choose another month
        </Link>
        <Link to="/app/$period/upload" params={{ period: "2026-09" }} className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-medium">
          Open September files
        </Link>
      </div>
    </AppShell>
  );
}
