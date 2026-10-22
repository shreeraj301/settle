import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/settle/shell";
import { Evidence } from "@/components/settle/evidence";
import { ConfidencePill } from "@/components/settle/ui";
import { FLAG_LABEL } from "@/lib/settle/engine";
import { formatInr } from "@/lib/settle/format";
import { useSettle } from "@/lib/settle/store";

export const Route = createFileRoute("/app/2026-09/review/$flagId")({ component: FlagPage });

function FlagPage() {
  const { flagId } = Route.useParams();
  const flag = useSettle((s) => s.flags.find((f) => f.id === flagId));
  const invoice = useSettle((s) => s.invoices.find((i) => i.id === flag?.invoiceId));
  const two = useSettle((s) => s.twoB.find((t) => t.id === flag?.twoBId));
  const bank = useSettle((s) => s.bank.filter((b) => flag?.bankTxnIds.includes(b.id)));
  if (!flag) {
    return (
      <AppShell step="review">
        <p>That flag is not in this period.</p>
        <Link to="/app/2026-09/review" className="text-accent">Back to review</Link>
      </AppShell>
    );
  }
  return (
    <AppShell step="review">
      <Link to="/app/2026-09/review" className="text-sm text-accent">All flags</Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="settle-h2">{FLAG_LABEL[flag.type]}</h1>
        <ConfidencePill level={flag.level} />
        <span className="font-mono-num ml-auto">{formatInr(flag.itcImpact)}</span>
      </div>
      <p className="mt-2 text-ink-2">{flag.reason}</p>
      <div className="mt-4">
        <Evidence flag={flag} invoice={invoice} twoB={two} bank={bank} />
      </div>
    </AppShell>
  );
}
