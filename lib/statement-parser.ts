/**
 * Generic bank statement parser.
 *
 * Accepts an ArrayBuffer / Buffer of an .xls or .xlsx file (read via SheetJS)
 * and returns a normalized list of `ParsedTransaction` rows. Designed to be
 * versatile across Indian bank statement formats:
 *
 * - Auto-detects header rows by scanning for keywords like "date", "narration",
 *   "description", "withdrawal", "deposit", "amount", "balance", etc.
 * - Supports single "Amount" columns as well as paired Debit / Credit (or
 *   Withdrawal / Deposit) columns.
 * - For Indian statements, dates are commonly `DD/MM/YY` or `DD/MM/YYYY` or
 *   `DD-MMM-YY`. We try a list of formats and finally fall back to native
 *   `Date` parsing.
 * - Tolerates merged header cells, stray asterisks, and trailing footer rows.
 *
 * The parser is intentionally tolerant; rows it cannot interpret are surfaced
 * via `warnings` so the UI can prompt the user to confirm / discard them.
 */

import * as XLSX from "xlsx";

export type ParsedTransaction = {
  /** 1-based row index within the sheet (for diagnostics). */
  rowIndex: number;
  /** Date of the transaction (UTC midnight if only a date was provided). */
  occurredAt: Date;
  /** Clean, human-friendly label (recipient / merchant). */
  name: string;
  /** Raw bank description / narration (e.g. "UPI/SWIGGY/..."). */
  description: string;
  /** Channel / rail detected from the description (UPI, Card, NEFT, …). */
  detectedPaymentMethod: string | null;
  /** UPI handle / merchant handle if present. */
  handle: string | null;
  /** Amount in whole rupees (always > 0). */
  amount: number;
  /** "expense" (money out) or "income" (money in). */
  direction: "expense" | "income";
  /** Optional closing / running balance if the statement provided it. */
  balance?: number | null;
  /** Optional cheque / reference number. */
  reference?: string | null;
};

export type StatementParseResult = {
  transactions: ParsedTransaction[];
  warnings: string[];
  /** Detected / chosen sheet name (for user feedback). */
  sheetName: string;
  /** Detected column mapping. */
  detectedColumns: DetectedColumns | null;
};

export type ColumnRole =
  | "date"
  | "description"
  | "amount"
  | "withdrawal"
  | "deposit"
  | "balance"
  | "reference"
  | "ignore";

export type DetectedColumns = Record<ColumnRole, number>;

const HEADER_HINTS: Record<ColumnRole, RegExp[]> = {
  date: [/^date$/i, /\btrans(?:action)?\.?\s*date/i, /value\s*date/i, /posted/i],
  description: [
    /^description$/i,
    /^narration$/i,
    /^particulars$/i,
    /^details$/i,
    /^transaction\s*details?$/i,
    /^remarks?$/i,
  ],
  amount: [/^amount$/i, /transaction\s*amount/i, /^inr\s*amount$/i],
  withdrawal: [
    /^withdrawal/i,
    /^debit/i,
    /^dr\.?\b/i,
    /^paid\s*out/i,
    /^money\s*out/i,
  ],
  deposit: [
    /^deposit/i,
    /^credit/i,
    /^cr\.?\b/i,
    /^paid\s*in/i,
    /^money\s*in/i,
  ],
  balance: [/^closing\s*balance/i, /^balance$/i, /^running\s*balance/i],
  reference: [
    /chq\.?\s*\/?\s*ref/i,
    /^reference/i,
    /^ref(?:erence)?\.?\s*no/i,
    /^txn\s*id/i,
    /^utr$/i,
  ],
  ignore: [],
};

function normalizeHeaderText(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectColumnRoles(headerRow: unknown[]): DetectedColumns {
  const roles: DetectedColumns = {
    date: -1,
    description: -1,
    amount: -1,
    withdrawal: -1,
    deposit: -1,
    balance: -1,
    reference: -1,
    ignore: -1,
  };
  headerRow.forEach((cell, idx) => {
    const text = normalizeHeaderText(cell);
    if (!text) return;
    for (const role of [
      "date",
      "description",
      "reference",
      "withdrawal",
      "deposit",
      "balance",
      "amount",
    ] as const) {
      if (roles[role] !== -1) continue;
      for (const re of HEADER_HINTS[role]) {
        if (re.test(text)) {
          roles[role] = idx;
          break;
        }
      }
    }
  });
  return roles;
}

function isHeaderLikeRow(row: unknown[]): boolean {
  const textCells = row.map(normalizeHeaderText).filter(Boolean);
  if (textCells.length < 2) return false;
  let hits = 0;
  for (const cell of textCells) {
    for (const role of [
      "date",
      "description",
      "amount",
      "withdrawal",
      "deposit",
      "balance",
      "reference",
    ] as const) {
      for (const re of HEADER_HINTS[role]) {
        if (re.test(cell)) {
          hits++;
          break;
        }
      }
    }
  }
  return hits >= 2;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i];
    if (!r) continue;
    if (isHeaderLikeRow(r)) return i;
  }
  return -1;
}

/** Parse a date that may be a JS Date, a number (Excel serial), or a string. */
export function parseStatementDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value;
  }
  if (typeof value === "number") {
    // Excel serial date: days since 1899-12-30 (with the famous Lotus 1900 bug
    // already corrected by SheetJS via `mode: "1900"`).
    const d = XLSX.SSF.parse_date_code(value);
    if (d) {
      return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H ?? 0, d.M ?? 0, d.S ?? 0));
    }
  }
  const text = normalizeHeaderText(value);
  if (!text) return null;

  // Indian DD/MM/YY or DD/MM/YYYY (also tolerates DD-MM-YYYY).
  const dmy = text.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmy) {
    const [, ddStr, mmStr, yyStr] = dmy;
    let yy = Number(yyStr);
    if (yy < 100) yy += yy >= 70 ? 1900 : 2000;
    const dd = Number(ddStr);
    const mm = Number(mmStr);
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      const d = new Date(Date.UTC(yy, mm - 1, dd));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  // ISO YYYY-MM-DD
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const yy = Number(iso[1]);
    const mm = Number(iso[2]);
    const dd = Number(iso[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      const d = new Date(Date.UTC(yy, mm - 1, dd));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  // Fallback: native parser (handles "12 May 2026", etc.).
  const native = new Date(text);
  if (!Number.isNaN(native.getTime())) return native;

  return null;
}

/** Parse a number that may be a JS number, a string with separators, or null. */
export function parseStatementAmount(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.round(value);
  }
  const text = normalizeHeaderText(value).replace(/,/g, "");
  if (!text) return null;
  // Handle accounting parens for negative numbers (e.g. "(1,234.50)" -> -1234.50).
  const m = text.match(/^\(?-?[\d.]+\)?$/);
  if (!m) return null;
  let n = Number(text.replace(/[()]/g, ""));
  if (Number.isNaN(n)) return null;
  if (text.startsWith("(") && text.endsWith(")")) n = -Math.abs(n);
  return Math.round(n);
}

export type ParsedTransactionDetails = {
  /** Short, human-friendly label (recipient / merchant). */
  name: string;
  /** Channel / rail detected from the raw description (UPI, POS, NEFT, …). */
  detectedPaymentMethod: string | null;
  /** Cleaned-up reference / UPI handle, if any. */
  handle: string | null;
};

/**
 * Extract a clean transaction name and payment method from a bank narration.
 *
 * Handles the common Indian bank statement shapes:
 *  - `UPI-<RECIPIENT>-<HANDLE>@<BANK>-<BANKCODE>-<REF>-<NOTE>` → name = recipient
 *  - `POS <merchant> <rest>` → name = merchant fragment before the long number
 *  - `DC INTL POS TXN …` / `ACH D- …` / `NEFT CR-…` / `IMPS-…` / `RTGS-…` → name = first chunk
 *  - Anything else: first ~60 chars, trimmed at the first long ref number.
 */
export function parseTransactionDetails(
  raw: string,
): ParsedTransactionDetails {
  const text = normalizeHeaderText(raw);
  if (!text) return { name: "", detectedPaymentMethod: null, handle: null };

  // UPI-RECIPIENT-HANDLE@BANK-BANKCODE-REF-NOTE
  const upi = text.match(/^UPI[\s\-]+([^\-@]+?)(?:[\-@]|$)/i);
  if (upi) {
    const recipient = upi[1].trim();
    const handleMatch = text.match(/[\-]([A-Z0-9._]+@[A-Z0-9]+)/i);
    return {
      name: recipient,
      detectedPaymentMethod: "UPI",
      handle: handleMatch ? handleMatch[1] : null,
    };
  }

  // IMPS-… / RTGS-…
  const imps = text.match(/^(IMPS|RTGS)[\s\-]+(.+)/i);
  if (imps) {
    return {
      name: cleanNameTail(imps[2]),
      detectedPaymentMethod: imps[1].toUpperCase(),
      handle: null,
    };
  }

  // NEFT CR-<BANKCODE>-<ACCTHOLDER>-<REF> / NEFT DR-…
  const neft = text.match(/^NEFT\s+(CR|DR)[\s\-]+[^\-]+[\-\s]+(.+)/i);
  if (neft) {
    return {
      name: cleanNameTail(neft[2]),
      detectedPaymentMethod: "NEFT",
      handle: null,
    };
  }

  // ACH D-… / ACH C-…
  const ach = text.match(/^ACH\s+([DC])[\s\-]+(.+)/i);
  if (ach) {
    return {
      name: cleanNameTail(ach[2]),
      detectedPaymentMethod: "ACH",
      handle: null,
    };
  }

  // POS … (card swipe) or DC INTL POS TXN …
  const pos = text.match(/^(POS|DC)(\s+.+)/i);
  if (pos) {
    return {
      name: cleanNameTail(pos[2]),
      detectedPaymentMethod: "Card",
      handle: null,
    };
  }

  // SBY31075385_… / INF12345-… / etc. — 2-4 uppercase letters followed by a digit.
  const generic = text.match(/^([A-Z]{2,4})(\d.+)/);
  if (generic) {
    return {
      name: cleanNameTail(generic[2].replace(/[_\-]+/g, " ")),
      detectedPaymentMethod: generic[1].toUpperCase(),
      handle: null,
    };
  }

  // 2-4 uppercase letters followed by space/dash + rest
  const genericSpace = text.match(/^([A-Z]{2,4})[\s\-]+(.+)/);
  if (genericSpace) {
    return {
      name: cleanNameTail(genericSpace[2]),
      detectedPaymentMethod: genericSpace[1].toUpperCase(),
      handle: null,
    };
  }

  return {
    name: cleanNameTail(text),
    detectedPaymentMethod: null,
    handle: null,
  };
}

function cleanNameTail(rest: string): string {
  const cleaned = rest.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  // Find the earliest position where a bank reference begins. We only cut at
  // patterns that are clearly not human names:
  //   - 6+ consecutive digits (UPI ref, RRN, token)
  //   - 2+ letters then 6+ digits (e.g. CMS1282600349814)
  //   - masked card (digits, X's, digits)
  //   - @bank handle
  // Optionally preceded by space / dash / slash.
  const refMatch = cleaned.match(
    /[\s\-\/]+(\d{6,}|[A-Z]{2,}\d{6,}|\d{4,}X{2,}\d{2,}|[A-Z0-9._]+@[A-Z0-9]+)/,
  );
  if (refMatch && typeof refMatch.index === "number") {
    const cutPos = refMatch.index;
    return cleaned.slice(0, cutPos).replace(/[\s,\-\/]+$/, "").slice(0, 60);
  }
  return cleaned.replace(/[\s,\-\/]+$/, "").slice(0, 60);
}

function isLikelyFooterRow(row: unknown[]): boolean {
  const text = row.map(normalizeHeaderText).join(" ").toLowerCase();
  if (!text) return true;
  return (
    text.includes("statement summary") ||
    text.includes("opening balance") ||
    text.includes("closing balance") ||
    text.includes("closing bal") ||
    text.includes("dr count") ||
    text.includes("cr count") ||
    text.includes("requesting branch") ||
    text.includes("end of statement") ||
    text.includes("generated by") ||
    text.includes("generated :")
  );
}

/** Heuristic: a row whose only meaningful content is numbers is probably a footer / totals row. */
function isAllNumericRow(row: unknown[]): boolean {
  let nonEmpty = 0;
  let numeric = 0;
  for (const cell of row) {
    const text = normalizeHeaderText(cell);
    if (!text) continue;
    nonEmpty++;
    if (/^-?[\d,.]+$/.test(text)) numeric++;
  }
  return nonEmpty >= 2 && numeric === nonEmpty;
}

export function parseStatementBuffer(buffer: ArrayBuffer): StatementParseResult {
  const warnings: string[] = [];

  // SheetJS handles .xls (BIFF8), .xlsx (OOXML), and .csv.
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  if (!workbook.SheetNames.length) {
    return {
      transactions: [],
      warnings: ["The file contains no sheets."],
      sheetName: "",
      detectedColumns: null,
    };
  }

  // Prefer the first sheet that has any rows.
  let chosenSheet = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (sheet && sheet["!ref"]) {
      chosenSheet = name;
      break;
    }
  }
  const sheet = workbook.Sheets[chosenSheet];
  if (!sheet) {
    return {
      transactions: [],
      warnings: ["The chosen sheet is empty."],
      sheetName: chosenSheet ?? "",
      detectedColumns: null,
    };
  }

  // Pull rows as arrays of raw values. `header: 1` gives an AoA.
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  const headerIdx = findHeaderRow(rows);
  if (headerIdx === -1) {
    return {
      transactions: [],
      warnings: [
        "Could not detect a header row. Expected columns like Date, Narration, Withdrawal, Deposit.",
      ],
      sheetName: chosenSheet,
      detectedColumns: null,
    };
  }

  const detected = detectColumnRoles(rows[headerIdx] ?? []);
  if (detected.date === -1) {
    warnings.push("No date column detected — those rows will be skipped.");
  }
  if (
    detected.amount === -1 &&
    detected.withdrawal === -1 &&
    detected.deposit === -1
  ) {
    warnings.push(
      "No amount, withdrawal, or deposit column detected — cannot infer amounts.",
    );
  }
  if (detected.description === -1) {
    warnings.push(
      "No description column detected — descriptions may be empty.",
    );
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (isLikelyFooterRow(row)) continue;
    if (isAllNumericRow(row)) continue;

    const rawDate = detected.date >= 0 ? row[detected.date] : null;
    const occurredAt = parseStatementDate(rawDate);
    if (!occurredAt) {
      warnings.push(`Row ${i + 1}: skipped (unparseable date).`);
      continue;
    }

    let amount = 0;
    let direction: "expense" | "income" = "expense";

    if (detected.amount >= 0) {
      const n = parseStatementAmount(row[detected.amount]);
      if (n == null || n === 0) {
        warnings.push(`Row ${i + 1}: skipped (missing amount).`);
        continue;
      }
      if (n < 0) {
        amount = Math.abs(n);
        direction = "income";
      } else {
        amount = n;
        direction = "expense";
      }
    } else {
      const withdrawal = detected.withdrawal
        ? parseStatementAmount(row[detected.withdrawal]) ?? 0
        : 0;
      const deposit = detected.deposit
        ? parseStatementAmount(row[detected.deposit]) ?? 0
        : 0;
      if (!withdrawal && !deposit) {
        warnings.push(`Row ${i + 1}: skipped (no withdrawal/deposit).`);
        continue;
      }
      if (withdrawal && deposit) {
        // Both filled — treat the larger absolute value as the actual amount and
        // pick direction by which is non-zero. Most banks don't do this.
        amount = Math.max(Math.abs(withdrawal), Math.abs(deposit));
        direction = withdrawal ? "expense" : "income";
      } else if (withdrawal) {
        amount = Math.abs(withdrawal);
        direction = "expense";
      } else {
        amount = Math.abs(deposit);
        direction = "income";
      }
    }

    const descriptionParts: string[] = [];
    if (detected.description >= 0) {
      const raw = row[detected.description];
      const text = normalizeHeaderText(raw);
      if (text) descriptionParts.push(text);
    }
    // Always include the cheque/reference cell in the description fallback so
    // UPI ref numbers are visible to the user even when no narration is given.
    if (detected.reference >= 0) {
      const raw = row[detected.reference];
      const text = normalizeHeaderText(raw);
      if (text && !descriptionParts.includes(text)) {
        descriptionParts.push(text);
      }
    }
    const description = descriptionParts.join(" ").trim();
    const { name, detectedPaymentMethod, handle } =
      parseTransactionDetails(description);

    let balance: number | null = null;
    if (detected.balance >= 0) {
      const b = parseStatementAmount(row[detected.balance]);
      if (b != null) balance = b;
    }
    let reference: string | null = null;
    if (detected.reference >= 0) {
      const text = normalizeHeaderText(row[detected.reference]);
      if (text) reference = text;
    }

    transactions.push({
      rowIndex: i + 1,
      occurredAt,
      name,
      description,
      detectedPaymentMethod,
      handle,
      amount,
      direction,
      balance,
      reference,
    });
  }

  return {
    transactions,
    warnings,
    sheetName: chosenSheet,
    detectedColumns: detected,
  };
}