import { createFileRoute } from "@tanstack/react-router";
import { OtherPeriod } from "@/components/settle/other-period";

export const Route = createFileRoute("/app/$period/export")({
  component: function PeriodExport() {
    const { period } = Route.useParams();
    return <OtherPeriod period={period} page="export" />;
  },
});
