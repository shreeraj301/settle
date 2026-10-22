import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const asked = `${pathname}${searchStr}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter" && tag === "A") return;
      if (e.key === "j" || e.key === "J" || e.key === "Enter") {
        e.preventDefault();
        navigate({ to: "/app/2026-09/review" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <main className="min-h-screen bg-page px-5 py-10 text-ink">
      <article className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-1)] lg:p-8">
        <h1 className="settle-h1">This page isn't in the books.</h1>
        <p className="mt-4 max-w-xl text-base">Nothing is lost. Your September work is saved on this device.</p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#F5F3EE] px-2 py-0.5 text-[13px] font-medium text-[#121826]">
            Note only
          </span>
          <span className="inline-flex items-center rounded-full border border-line bg-surface px-2 py-0.5 text-[13px] font-medium text-ink">
            Match: None
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-line bg-page p-3">
            <h2 className="text-[13px] font-medium text-ink-2">You asked for</h2>
            <p className="font-mono-num mt-2 text-sm wrap-anywhere">{asked}</p>
          </section>
          <section className="rounded-xl border border-line bg-page p-3">
            <h2 className="text-[13px] font-medium text-ink-2">Settle has</h2>
            <p className="mt-2 text-base">No page at this address</p>
          </section>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
          <Link
            to="/app/2026-09/review"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-[15px] font-medium text-[var(--color-accent-ink)] [transition:background-color_150ms] hover:bg-accent-hover"
          >
            Back to review
          </Link>
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-surface px-5 text-[15px] font-medium [transition:background-color_150ms] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]"
          >
            Go home
          </Link>
        </div>
        <p className="mt-3 text-[13px] text-ink-2">Press J or Enter to go back to review.</p>
      </article>
    </main>
  );
}
