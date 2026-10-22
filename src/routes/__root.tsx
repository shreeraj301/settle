import { configureZod } from "@/lib/zod-config";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/settle/not-found";
import { ThemeBoot } from "@/components/settle/theme-boot";
import { TitleSync } from "@/components/settle/title";
import appCss from "../styles.css?url";

configureZod();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Settle" },
      { name: "description", content: "See which GST input credit you can claim this month, and what to fix." },
      { name: "theme-color", content: "#F5F3EE" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preload", href: "/fonts/instrument-serif-latin.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: "/fonts/inter-latin.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  notFoundComponent: NotFoundPage,
  component: () => (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeBoot />
        <TitleSync />
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
