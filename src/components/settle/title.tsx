import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const TITLES: [RegExp, string][] = [
  [/^\/app\/2026-09\/review\/.+$/, "Flag detail · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/review$/, "Review flags · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/upload$/, "Upload files · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/match$/, "Match · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/matched$/, "Matched bills · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/bank$/, "Bank lines · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/approve$/, "Approve · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/export$/, "Export · Sep 2026 · Settle"],
  [/^\/app\/vendors\/.+$/, "Vendor · Sep 2026 · Settle"],
  [/^\/app\/vendors$/, "Vendors · Sep 2026 · Settle"],
  [/^\/app\/clients$/, "Clients · Settle"],
  [/^\/app\/settings$/, "Settings · Settle"],
  [/^\/app\/help$/, "Help · Settle"],
  [/^\/app\/start$/, "Choose a month · Settle"],
  [/^\/app\/?$/, "Home · Sep 2026 · Settle"],
  [/^\/$/, "Which credit can you claim · Settle"],
];

export function pageTitle(pathname: string): string {
  for (const [re, title] of TITLES) if (re.test(pathname)) return title;
  return "Settle";
}

export function TitleSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    document.title = pageTitle(pathname);
  }, [pathname]);
  return null;
}
