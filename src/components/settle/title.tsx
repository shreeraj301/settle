import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { periodLabel } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

const TITLES: [RegExp, string][] = [
  [/^\/app\/2026-09\/review\/.+$/, "Flag · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/review$/, "Review flags · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/upload$/, "Upload files · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/match$/, "Match · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/matched$/, "Matched bills · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/bank$/, "Bank lines · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/approve$/, "Approve · Sep 2026 · Settle"],
  [/^\/app\/2026-09\/export$/, "Export · Sep 2026 · Settle"],
  [/^\/app\/vendors$/, "Vendors · Settle"],
  [/^\/app\/clients$/, "Clients · Settle"],
  [/^\/app\/settings$/, "Settings · Settle"],
  [/^\/app\/help$/, "Help · Settle"],
  [/^\/app\/start$/, "Choose a month · Settle"],
  [/^\/app\/?$/, "Home · Sep 2026 · Settle"],
  [/^\/$/, "Which credit can you claim · Settle"],
];

export function pageTitle(pathname: string): string {
  const other = pathname.match(/^\/app\/(\d{4}-\d{2})\/([a-z-]+)/);
  if (other && other[1] !== "2026-09") {
    const labels: Record<string, string> = {
      upload: "Upload files",
      match: "Match",
      review: "Review flags",
      matched: "Matched bills",
      bank: "Bank lines",
      approve: "Approve",
      export: "Export",
    };
    return `${labels[other[2]] ?? "Month"} · ${periodLabel(other[1])} · Settle`;
  }
  for (const [re, title] of TITLES) if (re.test(pathname)) return title;
  return "This page isn't in the books · Settle";
}

export function TitleSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const vendors = useSettle((s) => s.vendors);
  useEffect(() => {
    const match = pathname.match(/^\/app\/vendors\/([^/]+)$/);
    if (match) {
      const gstin = decodeURIComponent(match[1]);
      const name = vendors.find((v) => v.gstin === gstin)?.name;
      document.title = name ? `${name} · Settle` : "Vendor · Settle";
      return;
    }
    document.title = pageTitle(pathname);
  }, [pathname, vendors]);
  return null;
}
