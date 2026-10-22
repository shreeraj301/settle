import { Link } from "@tanstack/react-router";
import { Check, Copy, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useSettle } from "@/lib/settle/store";
import type { Confidence } from "@/lib/settle/types";

export function PillButton({
  children,
  tone = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "secondary" | "ghost" | "danger" }) {
  const tones: Record<string, string> = {
    primary: "bg-accent text-[var(--color-accent-ink)] hover:brightness-95",
    secondary: "bg-surface text-ink border border-line hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]",
    ghost: "bg-transparent text-ink hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]",
    danger: "bg-transparent text-danger hover:bg-danger-tint",
  };
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ConfidencePill({ level }: { level: Confidence }) {
  const map = {
    high: { label: "High", cls: "bg-success-tint text-success", hint: "GSTIN, invoice number and amount line up." },
    medium: { label: "Medium", cls: "bg-warning-tint text-warning", hint: "Some fields match. Check the difference." },
    low: { label: "Low", cls: "bg-danger-tint text-danger", hint: "Weak match. Read the evidence before you act." },
  }[level];
  return (
    <span title={map.hint} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${map.cls}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {map.label}
    </span>
  );
}

export function Money({ paise, compact = false, className = "" }: { paise: number; compact?: boolean; className?: string }) {
  const { formatInr, formatInrCompact, spokenInr } = requireMoney();
  const text = compact ? formatInrCompact(paise) : formatInr(paise);
  return (
    <span className={`font-mono-num ${className}`} aria-label={spokenInr(paise)}>
      {text}
    </span>
  );
}

function requireMoney() {
  return {
    formatInr: (n: number) => {
      const neg = n < 0;
      const abs = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Math.abs(n) / 100);
      return neg ? `-${abs}` : abs;
    },
    formatInrCompact: (n: number) => {
      const sign = n < 0 ? "-" : "";
      const abs = Math.abs(n) / 100;
      if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)} Cr`;
      if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)} L`;
      const v = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(abs);
      return sign ? `-${v}` : v;
    },
    spokenInr: (n: number) => `rupees ${Math.abs(n) / 100}`,
  };
}

export function Toasts() {
  const toasts = useSettle((s) => s.toasts);
  const undo = useSettle((s) => s.undo);
  const dismiss = useSettle((s) => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-start md:px-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 shadow-[var(--shadow-2)]"
        >
          <Check className="size-4 text-success" aria-hidden />
          <span className="text-sm">{t.text}</span>
          {t.undo && (
            <button className="text-sm font-medium text-accent" onClick={() => undo()}>
              Undo
            </button>
          )}
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-ink-2">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  }
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm"
      onClick={() => void copyText(text)}
    >
      <Copy className="size-4" />
      {label}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-12 rounded-md border border-line bg-surface px-3 text-base text-ink outline-none focus:border-accent ${props.className ?? ""}`}
    />
  );
}

export { Link };
