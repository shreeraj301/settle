import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkspace } from "./dataset.ts";
import { FLAG_ORDER, runMatch } from "./engine.ts";
import { formatDate, formatInr, gstinChecksumOk, parseDate, toPaise } from "./format.ts";

test("formatters", () => {
  assert.equal(formatInr(toPaise(123456)), "₹1,23,456.00");
  assert.equal(formatInr(toPaise(-4000)), "-₹4,000.00");
  assert.equal(formatDate("2026-09-15"), "15-09-2026");
  assert.equal(parseDate("15/09/2026"), "2026-09-15");
  assert.equal(parseDate("15-Sep-2026"), "2026-09-15");
  assert.equal(gstinChecksumOk("27AAPFU0939F1ZV"), true);
  assert.equal(gstinChecksumOk("27SGTXA0001K1ZZ"), false);
});

test("demo workspace covers every flag type", () => {
  const data = buildWorkspace();
  const result = runMatch({
    invoices: data.invoices,
    twoB: data.twoB,
    bank: data.bank,
    period: "2026-09",
  });
  const types = new Set(result.flags.map((f) => f.type));
  for (const t of FLAG_ORDER) {
    assert.ok(types.has(t), `missing flag ${t}; have ${[...types].join(",")}`);
  }
  const dateFlag = result.flags.find((f) => f.type === "DATE_PERIOD" && f.level === "medium");
  assert.ok(dateFlag);
  assert.equal(dateFlag.reason.includes("28-08-2026 in books, 28-08-2026"), false);
  assert.match(dateFlag.reason, /Booked in 09-2026, filed in 08-2026\. Claim it in 08-2026, not 09-2026\./);
  const amount = result.flags.find((f) => f.type === "AMOUNT_MISMATCH" && f.level === "high");
  assert.match(amount?.reason ?? "", /Bill taxable ₹74,000\.00, 2B ₹47,000\.00\. ₹27,000\.00 difference at 5% GST: ₹1,350\.00 tax at stake\./);
  assert.ok(result.matches.length >= 10, `matches ${result.matches.length}`);
  assert.ok(result.flags.length >= 8, `flags ${result.flags.length}`);
  const cn = data.invoices.find((i) => i.invoiceNo === "AOD/CN-07");
  assert.ok(cn && cn.total < 0);
  assert.ok(data.bank.length >= 28);
});
