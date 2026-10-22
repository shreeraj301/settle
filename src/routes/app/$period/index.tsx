import { createFileRoute, redirect } from "@tanstack/react-router";
import { OtherPeriod } from "@/components/settle/other-period";

export const Route = createFileRoute("/app/$period/")({
  beforeLoad: ({ params }) => {
    if (params.period === "2026-09") throw redirect({ to: "/app/2026-09/review" });
  },
  component: function PeriodHome() {
    const { period } = Route.useParams();
    return <OtherPeriod period={period} page="review" />;
  },
});
