import { createFileRoute } from "@tanstack/react-router";
import { OtherPeriod } from "@/components/settle/other-period";

export const Route = createFileRoute("/app/$period/approve")({
  component: function PeriodApprove() {
    const { period } = Route.useParams();
    return <OtherPeriod period={period} page="approve" />;
  },
});
