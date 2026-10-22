import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { booksLoaded, CLIENTS, useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/clients")({ component: Clients });

function Clients() {
  const setClient = useSettle((s) => s.setClient);
  const current = useSettle((s) => s.clientId);
  const mode = useSettle((s) => s.mode);
  const period = useSettle((s) => s.period);
  const invoices = useSettle((s) => s.invoices);
  const twoB = useSettle((s) => s.twoB);
  const flags = useSettle((s) => s.flags);
  const navigate = useNavigate();
  const open = flags.filter((f) => f.status === "open").length;
  return (
    <AppShell>
      <h1 className="settle-h2">{mode === "ca" ? "Client desk" : "Clients"}</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-2">
        {mode === "ca"
          ? "Pick who you are closing. Shree Ganesh Traders has September books. The other two are empty, so Approve stays off."
          : "Switch the workspace. Shree Ganesh Traders has September already matched."}
      </p>
      <ul className="mt-5 space-y-3">
        {CLIENTS.map((c) => {
          const active = current === c.id;
          const loaded = active && booksLoaded(invoices, twoB);
          return (
            <li key={c.id}>
              <button
                className={`w-full rounded-2xl border bg-surface p-4 text-left ${active ? "border-accent" : "border-line"}`}
                onClick={() => {
                  setClient(c.id);
                  navigate({ to: "/app/$period/review", params: { period } });
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{c.name}</div>
                  <span className="text-[13px] text-ink-2">{loaded ? `${open} open` : c.id === "sgt" && period === "2026-09" ? "September books" : "No bills"}</span>
                </div>
                <div className="text-sm text-ink-2">
                  {c.city} · {c.gstin}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {mode === "ca" && <p className="kbd-hint mt-4 text-[13px] text-ink-2">After you open a client, J and K move through the flags.</p>}
    </AppShell>
  );
}
