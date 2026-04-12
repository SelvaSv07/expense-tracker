import { db } from "@/db";
import { categories, transactions, wallets } from "@/db/schema";
import { parseTimeFromSearchParams } from "@/lib/search-params-time";
import { getSession } from "@/lib/session";
import { getRangeFromPreset } from "@/lib/time-range";
import { resolveWalletId } from "@/lib/wallet-server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "excel";
  const sp = Object.fromEntries(searchParams.entries());
  const { preset, custom } = parseTimeFromSearchParams(sp);
  const range = getRangeFromPreset(preset, new Date(), custom);

  const walletId = await resolveWalletId(session.user.id);
  const [w] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, session.user.id)))
    .limit(1);
  if (!w) {
    return NextResponse.json({ error: "Wallet" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      note: transactions.note,
      paymentMethod: transactions.paymentMethod,
      categoryName: categories.name,
      categoryType: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    )
    .orderBy(desc(transactions.occurredAt));

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transactions");
    sheet.columns = [
      { header: "Category", key: "category", width: 24 },
      { header: "Type", key: "type", width: 10 },
      { header: "Date", key: "date", width: 20 },
      { header: "Amount (INR)", key: "amount", width: 14 },
      { header: "Method", key: "method", width: 16 },
      { header: "Note", key: "note", width: 30 },
    ];
    for (const r of rows) {
      sheet.addRow({
        category: r.categoryName,
        type: r.categoryType,
        date: r.occurredAt.toISOString(),
        amount: (r.amount / 100).toFixed(2),
        method: r.paymentMethod ?? "",
        note: r.note ?? "",
      });
    }
    const buf = await workbook.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="transactions.xlsx"',
      },
    });
  }

  if (format === "pdf") {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let y = 750;
    const left = 50;
    const lineH = 14;
    page.drawText("Transactions", {
      x: left,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 28;
    page.drawText(
      `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()}`,
      { x: left, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) },
    );
    y -= 24;
    for (const r of rows.slice(0, 40)) {
      const line = `${r.categoryName} | ${r.categoryType} | ${r.occurredAt.toLocaleString()} | ₹${(r.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      page.drawText(line.slice(0, 90), {
        x: left,
        y,
        size: 9,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= lineH;
      if (y < 60) {
        y = 750;
        pdf.addPage([612, 792]);
      }
    }
    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="transactions.pdf"',
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
