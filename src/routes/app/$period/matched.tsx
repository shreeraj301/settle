import { createFileRoute } from "@tanstack/react-router";
import { OtherPeriod } from "@/components/settle/other-period";

export const Route = createFileRoute("/app/$period/matched")({
  component: function PeriodMatched() {
    const { period } = Route.useParams();
    return <OtherPeriod period={period} page="matched" />;
  },
});
