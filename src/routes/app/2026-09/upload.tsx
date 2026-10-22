import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Landmark } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/upload")({ component: Upload });

const SLOTS = [
  { key: "invoices", title: "Purchase bills", hint: "CSV or XLSX", icon: FileSpreadsheet, count: () => useCount("invoices") },
  { key: "bank", title: "Bank statement", hint: "CSV, XLSX or text PDF", icon: Landmark, count: () => useCount("bank") },
  { key: "gstr2b", title: "GSTR-2B", hint: "JSON, XLSX or PDF", icon: FileText, count: () => useCount("twoB") },
];

function useCount(kind: "invoices" | "bank" | "twoB") {
  return useSettle((s) => s[kind].length);
}

function Upload() {
  const invoices = useSettle((s) => s.invoices.length);
  const bank = useSettle((s) => s.bank.length);
  const twoB = useSettle((s) => s.twoB.length);
  const [note, setNote] = useState<string | null>(null);
  const ready = invoices > 0 && twoB > 0;

  return (
    <AppShell step="upload">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="settle-h2">Files for September</h1>
          <p className="mt-1 max-w-xl text-ink-2">Three slots. Add them in any order. Matching needs bills and GSTR-2B. Bank is optional.</p>
        </div>
        <Link
          to="/app/2026-09/match"
          aria-disabled={!ready}
          className={`inline-flex h-12 items-center rounded-full px-6 font-medium ${ready ? "bg-accent text-[var(--color-accent-ink)]" : "pointer-events-none bg-line text-ink-2"}`}
          title={ready ? "Match now" : "Add at least invoices and 2B"}
        >
          Match now
        </Link>
      </div>
      {!ready && <p className="mt-3 text-sm text-warning">Add at least invoices and 2B.</p>}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Slot title="Purchase bills" hint="CSV or XLSX" icon={FileSpreadsheet} rows={invoices} name="purchase-bills-sep-2026.csv" onWarn={setNote} />
        <Slot title="Bank statement" hint="CSV, XLSX or text PDF" icon={Landmark} rows={bank} name="bank-statement-sep-2026.csv" onWarn={setNote} />
        <Slot title="GSTR-2B" hint="Portal JSON, XLSX or PDF" icon={FileText} rows={twoB} name="gstr2b-sep-2026.json" onWarn={setNote} />
      </div>
      {note && (
        <div role="status" className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">
          {note}
        </div>
      )}
      <p className="mt-6 text-sm text-ink-2">
        Nothing here yet?{" "}
        <Link to="/app/2026-09/match" className="font-medium text-accent">
          Open Shree Ganesh Traders
        </Link>
      </p>
    </AppShell>
  );
}

function Slot({
  title,
  hint,
  icon: Icon,
  rows,
  name,
  onWarn,
}: {
  title: string;
  hint: string;
  icon: typeof FileText;
  rows: number;
  name: string;
  onWarn: (s: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-5">
      <Icon className="size-6 text-ink-2" strokeWidth={1.5} />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-ink-2">{hint}</p>
      {rows > 0 ? (
        <div className="mt-4 flex items-center justify-between rounded-full bg-success-tint px-3 py-2 text-sm text-success">
          <span className="truncate">{name}</span>
          <span className="font-mono-num">{rows} rows</span>
        </div>
      ) : (
        <label className="mt-4 flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl bg-page text-sm text-ink-2">
          Drop file or browse
          <input
            type="file"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 20 * 1024 * 1024) {
                onWarn("This file is over 20 MB. The limit is 20 MB. Try a single month.");
                return;
              }
              onWarn(`We kept the September rows already in this workspace. ${file.name} was noted, not merged, so your review stays stable.`);
            }}
          />
        </label>
      )}
    </div>
  );
}

void SLOTS;
