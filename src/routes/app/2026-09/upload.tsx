import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Landmark } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/upload")({ component: Upload });

type SlotKey = "bills" | "bank" | "gstr2b";

type SlotState =
  | { status: "empty" }
  | { status: "ok"; name: string; rows: number | null; sample?: boolean }
  | { status: "error"; message: string };

const EMPTY: Record<SlotKey, SlotState> = { bills: { status: "empty" }, bank: { status: "empty" }, gstr2b: { status: "empty" } };

function Upload() {
  const invoiceCount = useSettle((s) => s.invoices.length);
  const bankCount = useSettle((s) => s.bank.length);
  const twoBCount = useSettle((s) => s.twoB.length);
  const [slots, setSlots] = useState<Record<SlotKey, SlotState>>(EMPTY);
  const ready = slots.bills.status === "ok" && slots.bills.sample === true && slots.gstr2b.status === "ok" && slots.gstr2b.sample === true;
  const countedOnly = (["bills", "bank", "gstr2b"] as SlotKey[]).some((key) => slots[key].status === "ok" && !slots[key].sample);

  function loadSample() {
    setSlots({
      bills: { status: "ok", name: "purchase-bills-sep-2026.csv", rows: invoiceCount, sample: true },
      bank: { status: "ok", name: "bank-statement-sep-2026.csv", rows: bankCount, sample: true },
      gstr2b: { status: "ok", name: "gstr2b-sep-2026.json", rows: twoBCount, sample: true },
    });
  }

  return (
    <AppShell step="upload">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="settle-h2">Files for September</h1>
          <p className="mt-1 max-w-xl text-ink-2">Three empty slots. Add them in any order. Matching needs bills and GSTR-2B. Bank is optional.</p>
        </div>
        <Link
          to="/app/2026-09/match"
          aria-disabled={!ready}
          className={`inline-flex h-12 items-center rounded-full px-6 font-medium ${ready ? "bg-accent text-[var(--color-accent-ink)] hover:bg-accent-hover" : "pointer-events-none bg-line text-ink-2"}`}
        >
          Match now
        </Link>
      </div>
      {!ready && <p className="mt-3 text-sm text-ink-2">Load September files to match the books on this device. A file you add is counted only. It is not used for matching.</p>}
      {countedOnly && (
        <p className="mt-3 max-w-xl rounded-xl bg-page px-3 py-2 text-sm text-ink-2" role="status">
          Counted only. Matching uses the September books already on this device, not the file you added.
        </p>
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Slot
          title="Purchase bills"
          hint="CSV or XLSX"
          accept=".csv,.xlsx,.xls,text/csv"
          icon={FileSpreadsheet}
          state={slots.bills}
          onFile={(file) => readSlot(file, "bills").then((next) => setSlots((s) => ({ ...s, bills: next })))}
          onClear={() => setSlots((s) => ({ ...s, bills: { status: "empty" } }))}
        />
        <Slot
          title="Bank statement"
          hint="CSV, XLSX or text PDF"
          accept=".csv,.xlsx,.xls,.pdf,.txt,text/csv,application/pdf"
          icon={Landmark}
          state={slots.bank}
          onFile={(file) => readSlot(file, "bank").then((next) => setSlots((s) => ({ ...s, bank: next })))}
          onClear={() => setSlots((s) => ({ ...s, bank: { status: "empty" } }))}
        />
        <Slot
          title="GSTR-2B"
          hint="JSON or XLSX from the GST portal"
          accept=".json,.xlsx,.xls,.pdf,application/json"
          icon={FileText}
          state={slots.gstr2b}
          onFile={(file) => readSlot(file, "gstr2b").then((next) => setSlots((s) => ({ ...s, gstr2b: next })))}
          onClear={() => setSlots((s) => ({ ...s, gstr2b: { status: "empty" } }))}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={loadSample} className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm font-medium">
          Load September files
        </button>
      </div>
    </AppShell>
  );
}

function Slot({
  title,
  hint,
  accept,
  icon: Icon,
  state,
  onFile,
  onClear,
}: {
  title: string;
  hint: string;
  accept: string;
  icon: typeof FileText;
  state: SlotState;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-dashed border-line-strong bg-surface p-5"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      <Icon className="size-6 text-ink-2" strokeWidth={1.5} />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-ink-2">{hint}</p>
      {state.status === "ok" ? (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-full bg-success-tint px-3 py-2 text-sm text-success">
          <span className="truncate">
            {state.name}
            {state.rows != null ? ` · ${state.rows} ${state.rows === 1 ? "row" : "rows"}` : ""}
          </span>
          <button type="button" className="shrink-0 underline" onClick={onClear}>
            Remove
          </button>
        </div>
      ) : (
        <label className="mt-4 flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl bg-page text-sm text-ink-2">
          Drop file or browse
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
      )}
      {state.status === "error" && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-tint px-3 py-2 text-sm text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}

const TWO_B_ERROR = "This looks like a bank statement. GSTR-2B is a JSON or XLSX from the GST portal.";

async function readSlot(file: File, slot: SlotKey): Promise<SlotState> {
  if (file.size > 20 * 1024 * 1024) {
    return { status: "error", message: "This file is over 20 MB. The limit is 20 MB. Try a single month." };
  }
  const name = file.name;
  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  const binary = ext === ".xlsx" || ext === ".xls" || ext === ".pdf";
  const text = binary ? "" : await file.text().catch(() => "");
  const head = text.slice(0, 4000).toLowerCase();
  const bankish = /narration|withdrawal|\bdebit\b|ifsc|account statement/.test(head) || /bank|statement/.test(lower);

  if (slot === "gstr2b") {
    if (bankish || ext === ".csv" || ext === ".txt") return { status: "error", message: TWO_B_ERROR };
    if (ext !== ".json" && ext !== ".xlsx" && ext !== ".xls") {
      return { status: "error", message: "GSTR-2B is a JSON or XLSX from the GST portal." };
    }
    if (ext === ".json" && !/gstin|b2b|itc|gstr/i.test(text)) {
      return { status: "error", message: "This JSON is not a GSTR-2B download. Use the JSON or XLSX from the GST portal." };
    }
  }
  if (slot === "bills") {
    if (ext !== ".csv" && ext !== ".xlsx" && ext !== ".xls") {
      return { status: "error", message: "Purchase bills are a CSV or XLSX of invoices." };
    }
    if (bankish && !/invoice|gstin|taxable/.test(head)) {
      return { status: "error", message: "This looks like a bank statement. Purchase bills are a CSV or XLSX of invoices." };
    }
  }
  if (slot === "bank") {
    if (![".csv", ".xlsx", ".xls", ".pdf", ".txt"].includes(ext)) {
      return { status: "error", message: "Bank statements are CSV, XLSX or a text PDF." };
    }
    if (ext === ".json" || (/gstin|gstr-2b|gstr2b/.test(head) && !bankish)) {
      return { status: "error", message: "This looks like GSTR-2B. Put it in the GSTR-2B slot." };
    }
  }

  const rows = binary ? null : countRows(ext, text);
  if (!binary && rows === 0) {
    return { status: "error", message: "No rows in this file. Check that it has a header and at least one line." };
  }
  return { status: "ok", name, rows };
}

function countRows(ext: string, text: string): number {
  if (ext === ".json") {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) return data.length;
      if (data && typeof data === "object") {
        const arrays = Object.values(data).filter((v) => Array.isArray(v)) as unknown[][];
        if (arrays.length) return Math.max(...arrays.map((a) => a.length));
      }
    } catch {
      return 0;
    }
    return 0;
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return Math.max(0, lines.length - 1);
}
