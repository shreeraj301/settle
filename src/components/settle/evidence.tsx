import { formatDate, formatInr, taxOf } from "@/lib/settle/format";
import type { BankTxn, Diff, Flag, Invoice, TwoBEntry } from "@/lib/settle/types";

export function Evidence({
  flag,
  invoice,
  twoB,
  bank,
}: {
  flag: Flag;
  invoice?: Invoice;
  twoB?: TwoBEntry;
  bank: BankTxn[];
}) {
  const cols = [
    { title: "Books", rows: invoice ? billRows(invoice) : [["Status", "Not in books"]] },
    { title: "GSTR-2B", rows: twoB ? twoRows(twoB) : [["Status", "Not in 2B"]] },
    {
      title: "Bank",
      rows: bank.length
        ? bank.flatMap((b) => [
            ["Date", formatDate(b.date)],
            ["Narration", b.narration],
            ["Amount", b.debit ? formatInr(b.debit) : formatInr(b.credit)],
          ])
        : [["Status", "No bank line"]],
    },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {cols.map((col) => (
        <section key={col.title} className="rounded-xl border border-line bg-page p-3">
          <h3 className="text-[12px] font-medium tracking-wide text-ink-2">{col.title}</h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {col.rows.map(([k, v]) => {
                const diff = flag.diffs.some((d) => d.field.toLowerCase().includes(k.toLowerCase().slice(0, 4)));
                return (
                  <tr key={k + v} className={diff ? "bg-warning-tint" : undefined}>
                    <th scope="row" className="w-24 py-1 pr-2 text-left text-[12px] font-medium text-ink-2">
                      {k}
                    </th>
                    <td className={`py-1 ${diff ? "font-medium" : ""}`}>{v}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function billRows(i: Invoice): [string, string][] {
  return [
    ["Vendor", i.vendorName],
    ["GSTIN", i.vendorGstin],
    ["Invoice", i.invoiceNo],
    ["Date", formatDate(i.date)],
    ["Taxable", formatInr(i.taxable)],
    ["Tax", formatInr(taxOf(i))],
    ["Total", formatInr(i.total)],
  ];
}

function twoRows(i: TwoBEntry): [string, string][] {
  return [
    ["Vendor", i.vendorName],
    ["GSTIN", i.vendorGstin],
    ["Invoice", i.invoiceNo],
    ["Date", formatDate(i.date)],
    ["Period", i.returnPeriod],
    ["Taxable", formatInr(i.taxable)],
    ["Tax", formatInr(taxOf(i))],
    ["Filing", i.filingStatus === "not_filed" || !i.itcAvailable ? "Not filed" : "Filed"],
  ];
}

export function diffSummary(diffs: Diff[]) {
  return diffs.map((d) => d.field).join(", ");
}
