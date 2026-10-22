import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/settle/shell";
import { PillButton } from "@/components/settle/ui";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const mode = useSettle((s) => s.mode);
  const setMode = useSettle((s) => s.setMode);
  const theme = useSettle((s) => s.theme);
  const setTheme = useSettle((s) => s.setTheme);
  const haptics = useSettle((s) => s.haptics);
  const setHaptics = useSettle((s) => s.setHaptics);
  const reset = useSettle((s) => s.reset);
  const business = useSettle((s) => s.businessName);
  const gstin = useSettle((s) => s.gstin);
  const [ask, setAsk] = useState(false);
  const navigate = useNavigate();
  const period = useSettle((s) => s.period);
  return (
    <AppShell>
      <h1 className="settle-h2">Settings</h1>
      <section className="mt-6 max-w-xl space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <div className="text-sm text-ink-2">Workspace</div>
          <div className="font-medium">{business}</div>
          <div className="font-mono-num text-sm">{gstin}</div>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Mode</legend>
          <div className="mt-2 flex gap-2">
            <PillButton
              tone={mode === "owner" ? "primary" : "secondary"}
              onClick={() => {
                setMode("owner");
                navigate({ to: "/app/$period/review", params: { period } });
              }}
            >
              Owner
            </PillButton>
            <PillButton
              tone={mode === "ca" ? "primary" : "secondary"}
              onClick={() => {
                setMode("ca");
                navigate({ to: "/app/clients" });
              }}
            >
              CA
            </PillButton>
          </div>
          <p className="mt-2 text-sm text-ink-2">
            {mode === "ca"
              ? "CA mode opens the client list, then a keyboard-first review. Empty clients stay empty, and Approve stays off."
              : "Owner mode stays on this business. CA mode is the client list."}
          </p>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Theme</legend>
          <div className="mt-2 flex gap-2">
            <PillButton tone={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>
              Light
            </PillButton>
            <PillButton tone={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>
              Dark
            </PillButton>
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={haptics} onChange={(e) => setHaptics(e.target.checked)} />
          Short vibration on phone when a fix saves
        </label>
      </section>
      <section className="mt-6 max-w-xl">
        <h2 className="text-lg font-semibold">Start fresh</h2>
        <p className="mt-1 text-sm text-ink-2">Clears fixes for Shree Ganesh Traders and loads September again. You can undo.</p>
        {!ask ? (
          <PillButton className="mt-3" tone="danger" onClick={() => setAsk(true)}>
            Reset workspace
          </PillButton>
        ) : (
          <div className="mt-3 flex gap-2">
            <PillButton
              tone="danger"
              onClick={() => {
                reset();
                setAsk(false);
              }}
            >
              Yes, reset
            </PillButton>
            <PillButton tone="secondary" onClick={() => setAsk(false)}>
              Cancel
            </PillButton>
          </div>
        )}
      </section>
    </AppShell>
  );
}
