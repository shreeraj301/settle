import { FLAG_LABEL } from "./engine.ts";
import type { Flag, Invoice } from "./types.ts";

export type ExportRow = {
  type: string;
  status: string;
  confidence: string;
  explanation: string;
  Reason: string;
  itc: string;
  invoice: string;
};

export function flagExportRows(flags: Flag[], invoices: Invoice[]): ExportRow[] {
  return flags.map((f) => ({
    type: FLAG_LABEL[f.type],
    status: f.status,
    confidence: f.level,
    explanation: f.reason,
    Reason: f.ignoreReason ?? "",
    itc: (f.itcImpact / 100).toFixed(2),
    invoice: invoices.find((i) => i.id === f.invoiceId)?.invoiceNo ?? "",
  }));
}

const CSV_HEADER = "type,status,confidence,explanation,Reason,itc,invoice";

function csvCell(value: string) {
  return `"${value.replaceAll('"', "'")}"`;
}

export function flagsToCsv(rows: ExportRow[]): string {
  return [CSV_HEADER, ...rows.map((r) => [r.type, r.status, r.confidence, csvCell(r.explanation), csvCell(r.Reason), r.itc, r.invoice].join(","))].join("\n");
}

function crc32(data: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function xmlEscape(value: string) {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const quot = "&" + "quot;";
  return value.split("&").join(amp).split("<").join(lt).split(">").join(gt).split('"').join(quot);
}

function sheetXml(rows: ExportRow[]): string {
  const headers = ["type", "status", "confidence", "explanation", "Reason", "itc", "invoice"];
  const body = rows
    .map((r) => {
      const cells = [r.type, r.status, r.confidence, r.explanation, r.Reason, r.itc, r.invoice]
        .map((value) => `<c t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`)
        .join("");
      return `<row>${cells}</row>`;
    })
    .join("");
  const head = headers.map((h) => `<c t="inlineStr"><is><t>${h}</t></is></c>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row>${head}</row>${body}</sheetData></worksheet>`;
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + name.length + file.data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(8, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, file.data.length, true);
    view.setUint32(22, file.data.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(file.data, 30 + name.length);
    locals.push(local);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const total = offset + centralSize + end.length;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

export function flagsToXlsx(rows: ExportRow[]): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s);
  return zipStore([
    {
      name: "[Content_Types].xml",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Flags" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: enc(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      ),
    },
    { name: "xl/worksheets/sheet1.xml", data: enc(sheetXml(rows)) },
  ]);
}
