// Dump every row of the statement as raw cells so we can see what the
// "unparseable date" rows actually contain.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(
  __dirname,
  "..",
  "docs",
  "Acct_Statement_XXXXXXXX3152_21062026(1).xls",
);
const buf = readFileSync(file);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const wb = XLSX.read(ab, { type: "array", cellDates: true, cellNF: false, cellText: false });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
  header: 1,
  raw: true,
  defval: null,
  blankrows: false,
});

console.log(`Sheet: ${wb.SheetNames[0]}, rows: ${rows.length}`);
// Print all rows with their 1-based index and a repr of each cell.
for (let i = 0; i < rows.length; i++) {
  const r = rows[i] ?? [];
  if (r.length === 0) continue;
  const cells = r.map((c) => {
    if (c == null) return "∅";
    if (c instanceof Date) return `Date(${c.toISOString()})`;
    return JSON.stringify(String(c).slice(0, 60));
  });
  console.log(`R${i + 1}:`, cells.join(" | "));
}