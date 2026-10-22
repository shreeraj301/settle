import { createFileRoute } from "@tanstack/react-router";
import { OtherPeriod } from "@/components/settle/other-period";

export const Route = createFileRoute("/app/$period/bank")({
  component: function PeriodBank() {
    const { period } = Route.useParams();
    return <OtherPeriod period={period} page="bank" />;
  },
});
