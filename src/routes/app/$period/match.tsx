import { createFileRoute } from "@tanstack/react-router";
import { OtherPeriod } from "@/components/settle/other-period";

export const Route = createFileRoute("/app/$period/match")({
  component: function PeriodMatch() {
    const { period } = Route.useParams();
    return <OtherPeriod period={period} page="match" />;
  },
});
