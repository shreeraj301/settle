import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  CircleHelp,
  Home,
  Landmark,
  ListChecks,
  Settings,
  Store,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect } from "react";
import { CLIENTS, openFlags, useSettle } from "@/lib/settle/store";
import { periodLabel } from "@/lib/settle/format";
import { DesignLink, Toasts } from "./ui";

const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "match", label: "Match" },
  { id: "review", label: "Review" },
  { id: "approve", label: "Approve" },
  { id: "export", label: "Export" },
];

export function AppShell({ children, step }: { children: ReactNode; step?: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const open = useSettle((s) => openFlags(s.flags).length);
  const business = useSettle((s) => s.businessName);
  const city = useSettle((s) => s.city);
  const period = useSettle((s) => s.period);
  const clientId = useSettle((s) => s.clientId);
  const setClient = useSettle((s) => s.setClient);
  const mode = useSettle((s) => s.mode);
  const undo = useSettle((s) => s.undo);
  const status = useSettle((s) => s.status);
  const setPeriod = useSettle((s) => s.setPeriod);

  useLayoutEffect(() => {
    const match = path.match(/^\/app\/(\d{4}-\d{2})(?:\/|$)/);
    if (match) setPeriod(match[1]);
  }, [path, setPeriod]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const pages = [
    { page: "review" as const, label: "Review", icon: ListChecks, badge: open },
    { page: "matched" as const, label: "Matched bills", icon: CheckCircle2 },
    { page: "bank" as const, label: "Bank", icon: Landmark },
    { page: "approve" as const, label: "Approve", icon: Home },
  ];

  return (
    <div className="min-h-screen bg-page text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
          <Link to="/" className="mb-6 flex items-baseline gap-2 px-2">
            <span className="font-display text-[28px] leading-none">Settle</span>
          </Link>
          <label className="mb-1 px-2 text-[13px] font-medium text-ink-2">Workspace</label>
          <select
            aria-label="Workspace"
            className="mb-4 h-11 rounded-md border border-line bg-page px-2 text-sm"
            value={clientId}
            onChange={(e) => setClient(e.target.value)}
          >
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="mb-4 rounded-xl bg-page px-3 py-3">
            <div className="text-sm font-medium">{business}</div>
            <div className="text-[13px] text-ink-2">
              {city} · {periodLabel(period)}
            </div>
            <div className="mt-1 text-[13px] text-ink-2">{mode === "ca" ? "CA mode. Clients first, then flags." : "Owner mode"}</div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {mode === "ca" && (
              <Link to="/app/clients" className={`flex h-11 items-center gap-3 rounded-full px-3 text-sm ${path.startsWith("/app/clients") ? "bg-accent-tint text-accent" : "hover:bg-page"}`}>
                <Building2 className="size-5" strokeWidth={1.5} /> Clients
              </Link>
            )}
            {pages.map((item) => {
              const href = `/app/${period}/${item.page}`;
              const active = path.startsWith(href);
              const Icon = item.icon;
              return (
                <PeriodLink
                  key={item.page}
                  period={period}
                  page={item.page}
                  className={`flex h-11 items-center gap-3 rounded-full px-3 text-sm ${active ? "bg-accent-tint text-accent" : "hover:bg-page"}`}
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-danger-tint px-2 text-[13px] font-medium text-danger">{item.badge}</span>
                  ) : null}
                </PeriodLink>
              );
            })}
            <Link to="/app/vendors" className={`flex h-11 items-center gap-3 rounded-full px-3 text-sm ${path.startsWith("/app/vendors") ? "bg-accent-tint text-accent" : "hover:bg-page"}`}>
              <Users className="size-5" strokeWidth={1.5} /> Vendors
            </Link>
          </nav>
          <div className="mt-auto flex flex-col gap-1">
            {mode !== "ca" && (
              <Link to="/app/clients" className="flex h-11 items-center gap-3 rounded-full px-3 text-sm hover:bg-page">
                <Building2 className="size-5" strokeWidth={1.5} /> Clients
              </Link>
            )}
            <Link to="/app/settings" className="flex h-11 items-center gap-3 rounded-full px-3 text-sm hover:bg-page">
              <Settings className="size-5" strokeWidth={1.5} /> Settings
            </Link>
            <Link to="/app/help" className="flex h-11 items-center gap-3 rounded-full px-3 text-sm hover:bg-page">
              <CircleHelp className="size-5" strokeWidth={1.5} /> Help
            </Link>
            <DesignLink className="px-3 py-2" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-line bg-page/95 px-4 py-3 backdrop-blur-sm lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-medium tracking-wide text-ink-2">
                  {business} · {periodLabel(period)}
                </div>
                <div className="text-sm">
                  {status === "approved"
                    ? "Approved. Read only until you reopen."
                    : mode === "ca"
                      ? "CA desk. Pick a client, then review flags."
                      : step
                        ? `Step: ${step}`
                        : "Books, 2B and bank"}
                </div>
              </div>
              <PeriodLink period={period} page="upload" className="hidden h-10 items-center rounded-full border border-line bg-surface px-4 text-sm sm:inline-flex">
                Files
              </PeriodLink>
            </div>
            {step && (
              <ol className="mt-3 hidden items-center gap-2 md:flex">
                {STEPS.map((s, i) => {
                  const on = s.id === step;
                  return (
                    <li key={s.id} className="flex items-center gap-2">
                      <span className={`text-[13px] ${on ? "font-semibold text-ink" : "text-ink-2"}`}>
                        {i + 1}. {s.label}
                      </span>
                      {i < STEPS.length - 1 && <span className="h-px w-6 bg-line" />}
                    </li>
                  );
                })}
              </ol>
            )}
          </header>
          <main id="main" className="flex-1 px-4 py-5 lg:px-8 lg:py-8">
            {children}
          </main>
          <footer className="border-t border-line px-4 py-4 lg:px-8">
            <DesignLink />
          </footer>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface lg:hidden">
        <PeriodTab period={period} page="review" label="Review" icon={ListChecks} badge={open} />
        <Tab to="/app/vendors" label="Vendors" icon={Store} />
        <PeriodTab period={period} page="approve" label="Home" icon={Home} />
        <Tab to="/app/settings" label="Settings" icon={Settings} />
      </nav>
      <Toasts />
    </div>
  );
}

function Tab({ to, label, icon: Icon, badge }: { to: "/app/vendors" | "/app/settings"; label: string; icon: typeof Home; badge?: number }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path.startsWith(to);
  return (
    <Link to={to} className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] ${active ? "text-accent" : "text-ink-2"}`}>
      <Icon className="size-5" strokeWidth={1.5} />
      {label}
      {badge ? <span className="absolute right-6 top-2 rounded-full bg-danger px-1.5 text-[13px] text-white">{badge}</span> : null}
    </Link>
  );
}

type AppPage = "upload" | "match" | "review" | "matched" | "bank" | "approve" | "export";

function PeriodLink({ period, page, className, children }: { period: string; page: AppPage; className?: string; children: ReactNode }) {
  if (page === "upload") return <Link to="/app/$period/upload" params={{ period }} className={className}>{children}</Link>;
  if (page === "match") return <Link to="/app/$period/match" params={{ period }} className={className}>{children}</Link>;
  if (page === "review") return <Link to="/app/$period/review" params={{ period }} className={className}>{children}</Link>;
  if (page === "matched") return <Link to="/app/$period/matched" params={{ period }} className={className}>{children}</Link>;
  if (page === "bank") return <Link to="/app/$period/bank" params={{ period }} className={className}>{children}</Link>;
  if (page === "approve") return <Link to="/app/$period/approve" params={{ period }} className={className}>{children}</Link>;
  return <Link to="/app/$period/export" params={{ period }} className={className}>{children}</Link>;
}

function PeriodTab({ period, page, label, icon: Icon, badge }: { period: string; page: "review" | "approve"; label: string; icon: typeof Home; badge?: number }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path.startsWith(`/app/${period}/${page}`);
  return (
    <PeriodLink period={period} page={page} className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] ${active ? "text-accent" : "text-ink-2"}`}>
      <Icon className="size-5" strokeWidth={1.5} />
      {label}
      {badge ? <span className="absolute right-6 top-2 rounded-full bg-danger px-1.5 text-[13px] text-white">{badge}</span> : null}
    </PeriodLink>
  );
}
