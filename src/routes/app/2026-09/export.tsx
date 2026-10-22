import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { itcSummary } from "@/components/settle/summary";
import { FLAG_LABEL } from "@/lib/settle/engine";
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

  function download(format: "csv" | "json") {
    const rows = flags.map((f) => ({
      type: FLAG_LABEL[f.type],
      status: f.status,
      confidence: f.level,
      reason: f.reason,
      itc: (f.itcImpact / 100).toFixed(2),
      invoice: invoices.find((i) => i.id === f.invoiceId)?.invoiceNo ?? "",
    }));
    const summary = {
      business,
      period: "09-2026",
      claimable: (totals.claimable / 100).toFixed(2),
      atRisk: (totals.atRisk / 100).toFixed(2),
      followUp: (totals.follow / 100).toFixed(2),
      rows,
    };
    const name = `Settle_ShreeGaneshTraders_09-2026.${format === "csv" ? "csv" : "json"}`;
    const body =
      format === "json"
        ? JSON.stringify(summary, null, 2)
        : ["type,status,confidence,reason,itc,invoice", ...rows.map((r) => [r.type, r.status, r.confidence, `"${r.reason.replaceAll('"', "'")}"`, r.itc, r.invoice].join(","))].join("\n");
    const blob = new Blob([body], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    setHistory((h) => [`${name} · ${formatDate(new Date().toISOString().slice(0, 10))}`, ...h]);
  }

  function downloadPrintable(kind: "pdf" | "xlsx") {
    const name = `Settle_ShreeGaneshTraders_09-2026.${kind === "pdf" ? "html" : "csv"}`;
    const html = `<!doctype html><meta charset="utf-8"><title>${business} 09-2026</title><body style="font-family:Georgia,serif;padding:32px"><h1>${business}</h1><p>September 2026 input tax credit</p><p>Claimable ${formatInr(totals.claimable)}</p><p>At risk ${formatInr(totals.atRisk)}</p><p>Follow-up ${formatInr(totals.follow)}</p><table border="1" cellpadding="6">${flags
      .map((f) => `<tr><td>${FLAG_LABEL[f.type]}</td><td>${f.status}</td><td>${formatInr(f.itcImpact)}</td><td>${f.reason}</td></tr>`)
      .join("")}</table><p>Print this page and choose Save as PDF.</p></body>`;
    if (kind === "pdf") {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } else {
      download("csv");
      return;
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
            ["xlsx", "Spreadsheet", () => downloadPrintable("xlsx")],
            ["pdf", "Print summary", () => downloadPrintable("pdf")],
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
