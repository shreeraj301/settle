import { configureZod } from "@/lib/zod-config";
import type { LocationRewrite } from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

const PATH_BASED_PREVIEW_HOSTS = new Set(["preview.grok.genai.mil", "preview.grok.mil", "preview.grokgsac.com"]);
const PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;

function previewPathRewrite(): LocationRewrite | undefined {
  if (typeof window === "undefined") return undefined;
  if (!PATH_BASED_PREVIEW_HOSTS.has(window.location.hostname.toLowerCase())) return undefined;
  const prefix = PORT_ID_PREFIX.exec(window.location.pathname)?.[0];
  if (!prefix) return undefined;
  return {
    input: ({ url }) => {
      if (url.pathname === prefix) url.pathname = "/";
      else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
      return url;
    },
    output: ({ url }) => {
      url.pathname = `${prefix}${url.pathname}`;
      return url;
    },
  };
}

configureZod();

export function getRouter() {
  return createRouter({
    routeTree,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}
