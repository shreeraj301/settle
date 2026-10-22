import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { CLIENTS, useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/clients")({ component: Clients });

function Clients() {
  const setClient = useSettle((s) => s.setClient);
  const current = useSettle((s) => s.clientId);
  const navigate = useNavigate();
  return (
    <AppShell>
      <h1 className="text-[28px] font-semibold tracking-tight">Clients</h1>
      <p className="mt-1 text-sm text-ink-2">Switch the workspace. Shree Ganesh Traders has September already matched.</p>
      <ul className="mt-5 space-y-3">
        {CLIENTS.map((c) => (
          <li key={c.id}>
            <button
              className={`w-full rounded-2xl border bg-surface p-4 text-left ${current === c.id ? "border-accent" : "border-line"}`}
              onClick={() => {
                setClient(c.id);
                navigate({ to: "/app/2026-09/review" });
              }}
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-ink-2">
                {c.city} · {c.gstin}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
