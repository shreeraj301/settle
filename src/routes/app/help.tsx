import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";

export const Route = createFileRoute("/app/help")({ component: Help });

const TERMS: [string, string][] = [
  ["ITC", "Input tax credit. The GST you already paid on purchases, which you can claim back."],
  ["GSTR-2B", "The monthly statement from the portal that lists bills your suppliers filed."],
  ["GSTIN", "The 15-character GST number of a business."],
  ["Books", "The purchase bills you keep, before they are compared with 2B."],
  ["Claimable", "Credit where books and 2B agree, or you have fixed the difference."],
  ["At risk", "Credit that is still open. Do not claim it until the row is clean."],
];

const KEYS: [string, string][] = [
  ["J / K", "Next or previous flag"],
  ["Ctrl+Z", "Undo the last action"],
  ["?", "Open this page"],
];

function Help() {
  return (
    <AppShell>
      <h1 className="text-[28px] font-semibold tracking-tight">Help</h1>
      <p className="mt-1 max-w-xl text-ink-2">Short meanings. Hover a confidence pill in Review to see why it is High, Medium or Low.</p>
      <dl className="mt-6 max-w-2xl divide-y divide-line rounded-2xl border border-line bg-surface">
        {TERMS.map(([t, d]) => (
          <div key={t} className="px-4 py-3">
            <dt className="font-medium">{t}</dt>
            <dd className="text-sm text-ink-2">{d}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-lg font-semibold">Keyboard</h2>
      <ul className="mt-3 max-w-md space-y-2 text-sm">
        {KEYS.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-4 border-b border-line py-2">
            <span className="font-mono-num">{k}</span>
            <span className="text-ink-2">{v}</span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
