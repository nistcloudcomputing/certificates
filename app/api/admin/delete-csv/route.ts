import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { requireAdminFromRequest } from "@/lib/auth";
import { ensureDbSchema, getDbClient } from "@/lib/db";

type CsvRow = {
  email?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "CSV file is required." }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    if (!rows.length) {
      return NextResponse.json({ success: false, message: "CSV has no rows." }, { status: 400 });
    }

    const seenEmails = new Set<string>();
    const emails: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const email = normalize(row.email || "");

      if (!email) {
        errors.push("Skipped row with missing email.");
        continue;
      }

      if (seenEmails.has(email)) {
        errors.push(`Skipped duplicate email in CSV: ${email}`);
        continue;
      }

      seenEmails.add(email);
      emails.push(email);
    }

    if (!emails.length) {
      return NextResponse.json(
        { success: false, message: "No valid email rows found in CSV.", skippedCount: errors.length, errors },
        { status: 400 },
      );
    }

    await ensureDbSchema();
    const sql = getDbClient();

    const deletedRows = await sql<{ email: string }[]>`
      DELETE FROM users
      WHERE email = ANY(${sql.array(emails)})
      RETURNING email
    `;

    const deletedSet = new Set(deletedRows.map((row) => row.email));
    const notFoundCount = emails.filter((email) => !deletedSet.has(email)).length;

    return NextResponse.json({
      success: true,
      requestedCount: emails.length,
      deletedCount: deletedRows.length,
      notFoundCount,
      skippedCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("CSV delete failed:", error);
    return NextResponse.json({ success: false, message: "CSV delete failed." }, { status: 500 });
  }
}
