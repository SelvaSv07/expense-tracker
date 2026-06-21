// Smoke-test the statement parser against the bundled HDFC .xls sample.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStatementBuffer } from "../lib/statement-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(
  __dirname,
  "..",
  "public",
  "Acct_Statement_XXXXXXXX3152_21062026(1).xls",
);
const buf = readFileSync(file);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const result = parseStatementBuffer(ab);
console.log("Sheet:", result.sheetName);
console.log("Detected columns:", result.detectedColumns);
console.log("Transactions:", result.transactions.length);
console.log("Warnings:", result.warnings.length);
console.log("First 5:");
for (const t of result.transactions.slice(0, 5)) {
  console.log({
    row: t.rowIndex,
    occurredAt: t.occurredAt.toISOString().slice(0, 10),
    direction: t.direction,
    amount: t.amount,
    description: t.description.slice(0, 80),
    balance: t.balance,
  });
}
console.log("Last 3:");
for (const t of result.transactions.slice(-3)) {
  console.log({
    row: t.rowIndex,
    occurredAt: t.occurredAt.toISOString().slice(0, 10),
    direction: t.direction,
    amount: t.amount,
    description: t.description.slice(0, 80),
  });
}
if (result.warnings.length) {
  console.log("Warnings (first 10):");
  for (const w of result.warnings.slice(0, 10)) console.log("  -", w);
}