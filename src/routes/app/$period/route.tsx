import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$period")({
  beforeLoad: ({ params }) => {
    if (!/^\d{4}-\d{2}$/.test(params.period)) throw notFound();
  },
  component: () => <Outlet />,
});
