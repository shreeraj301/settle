import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/settle/not-found";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [{ title: "This page isn't in the books · Settle" }],
  }),
  component: NotFoundPage,
});
