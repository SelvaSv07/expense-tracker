// Smoke-test the categorizer against a couple of HDFC descriptions.
import { parseStatementBuffer } from "../lib/statement-parser";
import {
  annotateWithSuggestedCategories,
  suggestCategoryForText,
  parseKeywords,
} from "../lib/statement-categorizer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(
  path.join(
    __dirname,
    "..",
    "public",
    "Acct_Statement_XXXXXXXX3152_21062026(1).xls",
  ),
);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const result = parseStatementBuffer(ab);

const categories = [
  {
    id: "c-food",
    name: "Food",
    type: "expense",
    icon: null,
    color: "#64748b",
    keywords: parseKeywords("swiggy, zomato, mcaffeine, restaurant"),
  },
  {
    id: "c-shopping",
    name: "Shopping",
    type: "expense",
    icon: null,
    color: "#64748b",
    keywords: parseKeywords("amazon, flipkart, myntra"),
  },
  {
    id: "c-cc",
    name: "Credit card payment",
    type: "expense",
    icon: null,
    color: "#64748b",
    keywords: parseKeywords("cred club, hdfc card"),
  },
  {
    id: "c-income",
    name: "Salary",
    type: "income",
    icon: null,
    color: "#64748b",
    keywords: parseKeywords("selvalingeshwaran, neft, imps"),
  },
];

const annotated = annotateWithSuggestedCategories(
  result.transactions,
  categories,
);

let matched = 0;
for (const t of annotated) {
  if (t.suggestedCategoryId) matched++;
}
console.log(`Matched ${matched}/${annotated.length} transactions`);

console.log("\nFirst 10 suggestions:");
for (const t of annotated.slice(0, 10)) {
  const cat = categories.find((c) => c.id === t.suggestedCategoryId);
  console.log(
    `  [${t.direction}] ${t.description.slice(0, 50).padEnd(50)} → ${cat?.name ?? "(none)"}`,
  );
}

// Direct test for a tricky case
console.log("\nDirect heuristic checks:");
console.log(
  "  swiggy →",
  suggestCategoryForText("UPI-SWIGGY-...-PAID VIA CR", "expense", categories)
    ?.name,
);
console.log(
  "  cred club →",
  suggestCategoryForText("UPI-CRED CLUB-CRED.CLUB@AXISB-...-PAYMENT", "expense", categories)
    ?.name,
);
console.log(
  "  amazon (no match) →",
  suggestCategoryForText("AMAZON PAY UPI-...-PAYMENT", "expense", categories)?.name ??
    "none",
);