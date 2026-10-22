import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { Evidence } from "@/components/settle/evidence";
import { itcSummary } from "@/components/settle/summary";
import { ConfidencePill, PillButton, SeverityPill } from "@/components/settle/ui";
import { FLAG_LABEL, FLAG_ORDER } from "@/lib/settle/engine";
import { formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";
import type { Flag } from "@/lib/settle/types";

export const Route = createFileRoute("/app/2026-09/review")({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: typeof search.type === "string" ? search.type : undefined,
  }),
  component: Review,
});

const IGNORE = ["Not a business expense", "Already claimed", "Duplicate", "Personal", "Other"];

function Review() {
  const search = Route.useSearch();
  const flags = useSettle((s) => s.flags);
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const bank = useSettle((s) => s.bank);
  const matches = useSettle((s) => s.matches);
  const status = useSettle((s) => s.status);
  const fixGstin = useSettle((s) => s.fixGstin);
  const addFrom2b = useSettle((s) => s.addFrom2b);
  const followUp = useSettle((s) => s.followUp);
  const ignore = useSettle((s) => s.ignore);
  const acceptDate = useSettle((s) => s.acceptDate);
  const [filter, setFilter] = useState<string>(search.type || "open");
  const [active, setActive] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [gstinDraft, setGstinDraft] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const locked = status === "approved";

  const visible = useMemo(() => {
    return flags.filter((f) => {
      if (filter === "open") return f.status === "open";
      if (filter === "follow") return f.status === "follow_up";
      if (filter === "done") return f.status === "fixed" || f.status === "ignored";
      return f.type === filter && f.status === "open";
    });
  }, [flags, filter]);

  const current = flags.find((f) => f.id === (active ?? visible[0]?.id)) ?? visible[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const idx = visible.findIndex((f) => f.id === current?.id);
      if (e.key === "j" || e.key === "ArrowDown") {
        const n = visible[Math.min(visible.length - 1, idx + 1)];
        if (n) setActive(n.id);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        const n = visible[Math.max(0, idx - 1)];
        if (n) setActive(n.id);
      }
      if (e.key === "?" ) navigate({ to: "/app/help" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, current, navigate]);

  const totals = itcSummary(flags, matches, invoices, twoB);
  const openCount = flags.filter((f) => f.status === "open").length;
  const followCount = flags.filter((f) => f.status === "follow_up").length;
  const doneCount = flags.filter((f) => f.status === "fixed" || f.status === "ignored").length;
  const idx = visible.findIndex((f) => f.id === current?.id);
  const go = (dir: number) => {
    const n = visible[idx + dir];
    if (n) setActive(n.id);
  };

  if (openCount === 0 && filter === "open") {
    return (
      <AppShell step="review">
        <section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8">
          <h1 className="settle-h2">All clear for September.</h1>
          <p className="mt-3 text-ink-2">
            Nothing left open. {formatInr(totals.claimable)} can be claimed. Follow-ups sit with vendors until they file.
          </p>
          <Link to="/app/2026-09/approve" className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 font-medium text-[var(--color-accent-ink)]">
            Approve September
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell step="review">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="settle-h2">Review flags</h1>
          <p className="text-sm text-ink-2">
            {openCount} open · {followCount} with vendors · {formatInr(totals.atRisk)} at risk · {formatInr(totals.follow)} in follow-up
          </p>
        </div>
      </div>
      <div className="mt-4 flex max-w-full flex-wrap gap-2">
        <Filter label="Open" count={openCount} on={filter === "open"} onClick={() => setFilter("open")} />
        {FLAG_ORDER.map((t) => {
          const c = flags.filter((f) => f.type === t && f.status === "open").length;
          return <Filter key={t} label={FLAG_LABEL[t]} count={c} on={filter === t} onClick={() => setFilter(t)} disabled={c === 0} />;
        })}
        <Filter label="Follow-up" count={followCount} on={filter === "follow"} onClick={() => setFilter("follow")} />
        <Filter label="Done" count={doneCount} on={filter === "done"} onClick={() => setFilter("done")} />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <ul className="min-w-0 space-y-2">
          {visible.length === 0 && <li className="rounded-xl border border-line bg-surface p-4 text-sm">No flags match these filters. Clear filters.</li>}
          {visible.map((f) => {
            const inv = invoices.find((i) => i.id === f.invoiceId);
            const row = twoB.find((t) => t.id === f.twoBId);
            const on = current?.id === f.id;
            return (
              <li key={f.id}>
                <article
                  className={`w-full min-w-0 rounded-xl border bg-surface p-3 text-left ${f.status !== "open" ? "flag-resolved" : ""} ${on ? "border-accent" : "border-line"}`}
                >
                  <button className="w-full min-w-0 text-left" onClick={() => { setActive(f.id); setSheet(true); }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{FLAG_LABEL[f.type]}</span>
                      <span className="flex flex-wrap items-center gap-1">
                        <SeverityPill flag={f} />
                        <ConfidencePill level={f.level} />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">{f.reason}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="wrap-anywhere text-ink-2">{inv?.vendorName ?? row?.vendorName}</span>
                      <span className="font-mono-num shrink-0 text-sm">{formatInr(f.itcImpact)}</span>
                    </div>
                  </button>
                  {f.status === "open" && (
                    <label className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(f.id)}
                        onChange={() =>
                          setSelected((s) => (s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]))
                        }
                      />
                      Select for bulk
                    </label>
                  )}
                </article>
              </li>
            );
          })}
        </ul>

        {current && (
          <div className="flag-detail hidden min-h-[520px] min-w-0 md:block">
            <FlagDetail
              flag={current}
              locked={locked}
              gstinDraft={gstinDraft}
              setGstinDraft={setGstinDraft}
              reason={reason}
              setReason={setReason}
              note={note}
              setNote={setNote}
              msg={msg}
              onFixGstin={() => fixGstin(current.id, gstinDraft)}
              onAdd={() => addFrom2b(current.id)}
              onFollow={() => setMsg(followUp([current.id]))}
              onIgnore={() => {
                if (!reason) return;
                ignore([current.id], reason, note);
                setReason("");
                setNote("");
              }}
              onDate={() => acceptDate(current.id)}
            />
          </div>
        )}
      </div>

      {sheet && current && (
        <div className="fixed inset-0 z-50 flex flex-col bg-page md:hidden">
          <div className="flex h-14 items-center border-b border-line px-4">
            <button className="text-sm font-medium text-accent" onClick={() => setSheet(false)}>
              Back to flags
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FlagDetail
              flag={current}
              locked={locked}
              gstinDraft={gstinDraft}
              setGstinDraft={setGstinDraft}
              reason={reason}
              setReason={setReason}
              note={note}
              setNote={setNote}
              msg={msg}
              onFixGstin={() => fixGstin(current.id, gstinDraft)}
              onAdd={() => addFrom2b(current.id)}
              onFollow={() => setMsg(followUp([current.id]))}
              onIgnore={() => {
                if (!reason) return;
                ignore([current.id], reason, note);
                setReason("");
                setNote("");
              }}
              onDate={() => acceptDate(current.id)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-line bg-surface p-3">
            <button className="h-12 rounded-full border border-line text-sm font-medium" onClick={() => go(-1)} disabled={idx <= 0}>
              Previous
            </button>
            <button className="h-12 rounded-full border border-line text-sm font-medium" onClick={() => go(1)} disabled={idx >= visible.length - 1}>
              Next
            </button>
          </div>
        </div>
      )}

      {selected.length >= 2 && !locked && (
        <div className="fixed inset-x-4 bottom-20 z-40 flex items-center justify-between gap-3 rounded-full border border-line bg-surface px-4 py-2 shadow-[var(--shadow-2)] lg:bottom-6 lg:left-[280px]">
          <span className="text-sm">{selected.length} selected</span>
          <div className="flex gap-2">
            <PillButton
              tone="secondary"
              onClick={() => {
                setMsg(followUp(selected));
                setSelected([]);
              }}
            >
              Mark follow-up
            </PillButton>
            <PillButton
              tone="danger"
              onClick={() => {
                if (!reason) {
                  setReason("Duplicate");
                }
                ignore(selected, reason || "Duplicate", note);
                setSelected([]);
              }}
            >
              Ignore
            </PillButton>
          </div>
        </div>
      )}
      {msg && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p className="text-sm">{msg}</p>
          <PillButton className="mt-3" tone="secondary" onClick={() => navigator.clipboard.writeText(msg)}>
            Copy message
          </PillButton>
        </div>
      )}
    </AppShell>
  );
}

function Filter({ label, count, on, onClick, disabled }: { label: string; count: number; on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] disabled:opacity-40 ${on ? "bg-ink text-[var(--color-bg)]" : "border border-line bg-surface"}`}
    >
      {label}
      <span className="font-mono-num text-[13px]">{count}</span>
    </button>
  );
}

function FlagDetail(props: {
  flag: Flag;
  locked: boolean;
  gstinDraft: string;
  setGstinDraft: (s: string) => void;
  reason: string;
  setReason: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  msg: string;
  onFixGstin: () => void;
  onAdd: () => void;
  onFollow: () => void;
  onIgnore: () => void;
  onDate: () => void;
}) {
  const { flag } = props;
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const bank = useSettle((s) => s.bank);
  const invoice = invoices.find((i) => i.id === flag.invoiceId);
  const row = twoB.find((t) => t.id === flag.twoBId);
  const lines = bank.filter((b) => flag.bankTxnIds.includes(b.id));
  const twoGstin = row?.vendorGstin ?? "";

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 lg:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="settle-h2">{FLAG_LABEL[flag.type]}</h2>
                      <SeverityPill flag={flag} />
                      <ConfidencePill level={flag.level} />
                      <span className="font-mono-num ml-auto text-sm">{formatInr(flag.itcImpact)}</span>
                    </div>
      <p className="mt-2 text-ink-2">{flag.reason}</p>
      <div className="mt-4">
        <Evidence flag={flag} invoice={invoice} twoB={row} bank={lines} />
      </div>
      {flag.status !== "open" && (
        <p className="mt-4 text-sm text-success">
          {flag.status === "fixed" ? "Fixed. Undo from the toast if you need it back." : flag.status === "follow_up" ? "Waiting on the vendor." : `Ignored: ${flag.ignoreReason}`}
        </p>
      )}
      {!props.locked && flag.status === "open" && (
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          {flag.type === "GSTIN_MISMATCH" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Correct GSTIN"
                className="h-12 flex-1 rounded-md border border-line bg-page px-3 font-mono-num text-sm"
                placeholder={twoGstin}
                value={props.gstinDraft}
                onChange={(e) => props.setGstinDraft(e.target.value.toUpperCase())}
              />
              <PillButton onClick={props.onFixGstin}>Save GSTIN</PillButton>
              <PillButton tone="secondary" onClick={() => props.setGstinDraft(twoGstin)}>
                Use 2B value
              </PillButton>
            </div>
          )}
          {flag.type === "MISSING_IN_BOOKS" && <PillButton onClick={props.onAdd}>Add from 2B</PillButton>}
          {flag.type === "DATE_PERIOD" && <PillButton onClick={props.onDate}>Accept date</PillButton>}
          {(flag.type === "AMOUNT_MISMATCH" || flag.type === "MISSING_IN_2B" || flag.type === "SUPPLIER_NOT_FILED") && (
            <PillButton onClick={props.onFollow}>Mark vendor follow-up</PillButton>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="text-sm text-ink-2">
              Ignore reason
              <select className="mt-1 block h-12 rounded-md border border-line bg-page px-2" value={props.reason} onChange={(e) => props.setReason(e.target.value)}>
                <option value="">Choose a reason</option>
                {IGNORE.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <input
              aria-label="Ignore note"
              className="h-12 flex-1 rounded-md border border-line bg-page px-3"
              placeholder="Note (optional)"
              value={props.note}
              onChange={(e) => props.setNote(e.target.value)}
            />
            <PillButton tone="danger" disabled={!props.reason} onClick={props.onIgnore}>
              Ignore
            </PillButton>
          </div>
          {!props.reason && <p className="text-[13px] text-ink-2">Ignore stays off until you pick a reason.</p>}
        </div>
      )}
    </section>
  );
}
