import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { itcSummary } from "@/components/settle/summary";
import { flagExportRows, flagsToCsv, flagsToXlsx } from "@/lib/settle/export-file";
import { formatDate, formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/export")({ component: ExportPage });

function ExportPage() {
  const flags = useSettle((s) => s.flags);
  const matches = useSettle((s) => s.matches);
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const business = useSettle((s) => s.businessName);
  const status = useSettle((s) => s.status);
  const [history, setHistory] = useState<string[]>([]);
  const totals = itcSummary(flags, matches, invoices, twoB);

  if (status !== "approved") {
    return (
      <AppShell step="export">
        <h1 className="settle-h2">Export September</h1>
        <p className="mt-3 max-w-md text-ink-2">Approve September to export.</p>
        <Link to="/app/2026-09/approve" className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 font-medium text-[var(--color-accent-ink)] hover:bg-accent-hover">
          Go to approve
        </Link>
      </AppShell>
    );
  }

  function download(format: "csv" | "json" | "xlsx") {
    const rows = flagExportRows(flags, invoices);
    const summary = {
      business,
      period: "09-2026",
      claimable: (totals.claimable / 100).toFixed(2),
      atRisk: (totals.atRisk / 100).toFixed(2),
      followUp: (totals.follow / 100).toFixed(2),
      rows,
    };
    const ext = format === "json" ? "json" : format;
    const name = `Settle_ShreeGaneshTraders_09-2026.${ext}`;
    const body =
      format === "json" ? JSON.stringify(summary, null, 2) : format === "csv" ? flagsToCsv(rows) : flagsToXlsx(rows);
    const type =
      format === "json"
        ? "application/json"
        : format === "csv"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const payload: BlobPart = typeof body === "string" ? body : new Uint8Array(body).buffer;
    const blob = new Blob([payload], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    setHistory((h) => [`${name} · ${formatDate(new Date().toISOString().slice(0, 10))}`, ...h]);
  }

  function downloadPrintable() {
    const rows = flagExportRows(flags, invoices);
    const name = "Settle_ShreeGaneshTraders_09-2026.html";
    const html = `<!doctype html><meta charset="utf-8"><title>${business} 09-2026</title><body style="font-family:Georgia,serif;padding:32px"><h1>${business}</h1><p>September 2026 input tax credit</p><p>Claimable ${formatInr(totals.claimable)}</p><p>At risk ${formatInr(totals.atRisk)}</p><p>Follow-up ${formatInr(totals.follow)}</p><table border="1" cellpadding="6"><tr><th>Type</th><th>Status</th><th>Reason</th><th>ITC</th><th>Explanation</th></tr>${rows
      .map((r) => `<tr><td>${r.type}</td><td>${r.status}</td><td>${r.Reason}</td><td>${r.itc}</td><td>${r.explanation}</td></tr>`)
      .join("")}</table><p>Print this page and choose Save as PDF.</p></body>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    setHistory((h) => [`${name} · ready to print`, ...h]);
  }

  return (
    <AppShell step="export">
      <h1 className="settle-h2">Export September</h1>
      <p className="mt-1 text-ink-2">
        Totals match the approve screen: claimable {formatInr(totals.claimable)}, at risk {formatInr(totals.atRisk)}.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["csv", "CSV", () => download("csv")],
            ["xlsx", "Spreadsheet", () => download("xlsx")],
            ["pdf", "Print summary", () => downloadPrintable()],
            ["json", "JSON", () => download("json")],
          ] as const
        ).map(([id, label, fn]) => (
          <button key={id} onClick={fn} className="rounded-2xl border border-line bg-surface p-4 text-left hover:border-line-strong">
            <div className="font-medium">{label}</div>
            <div className="mt-1 text-sm text-ink-2">Settle_ShreeGaneshTraders_09-2026</div>
          </button>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-semibold">Downloads</h2>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">Nothing downloaded in this sitting yet.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {history.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
