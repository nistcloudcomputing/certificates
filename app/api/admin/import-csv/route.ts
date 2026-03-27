import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { requireAdminFromRequest } from "@/lib/auth";
import { ensureDbSchema, getDbClient } from "@/lib/db";
import { listCertificateKeys } from "@/lib/s3";

type CsvRow = {
  email?: string;
  name?: string;
  fileKey?: string;
  keyid?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function makeKeyAlias(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function buildFallbackEmailFromName(name: string) {
  const normalizedName = normalize(name);
  const alias = makeKeyAlias(normalizedName) || "user";
  const suffix = hashText(normalizedName || "user");
  return `${alias}+${suffix}@missing-email.local`;
}

function createS3AliasMap(keys: string[]) {
  const map = new Map<string, string>();

  for (const key of keys) {
    const filename = key.split("/").pop() || key;
    const withoutExt = filename.replace(/\.[^.]+$/i, "");
    const withoutUuidPrefix = withoutExt.replace(/^[a-f0-9-]{36}-/, "");
    map.set(makeKeyAlias(withoutExt), key);
    map.set(makeKeyAlias(withoutUuidPrefix), key);
  }

  return map;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const autoMap = formData.get("autoMap") === "true";

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

    const keys = autoMap ? await listCertificateKeys() : [];
    const aliasMap = createS3AliasMap(keys);

    await ensureDbSchema();
    const sql = getDbClient();

    const seenRows = new Set<string>();
    let importedCount = 0;
    let mappedCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const emailRaw = row.email || "";
      const nameRaw = row.name || "";
      const normalizedEmail = normalize(emailRaw);
      const name = nameRaw.trim();
      const normalizedName = normalize(name);
      const rowKey = normalizedEmail ? `email:${normalizedEmail}` : `name:${normalizedName}`;

      if (!name) {
        errors.push(`Skipped row with missing name: ${emailRaw || "unknown"}`);
        continue;
      }

      if (seenRows.has(rowKey)) {
        errors.push(`Skipped duplicate row in CSV: ${normalizedEmail || normalizedName}`);
        continue;
      }

      seenRows.add(rowKey);

      const email = normalizedEmail || buildFallbackEmailFromName(name);

      let fileKey = (row.fileKey || row.keyid || "").trim();

      if (!fileKey && autoMap) {
        const candidates = [makeKeyAlias(name)];

        if (normalizedEmail) {
          const emailLocal = normalizedEmail.split("@")[0] || "";
          candidates.push(makeKeyAlias(normalizedEmail));
          candidates.push(makeKeyAlias(emailLocal));
          candidates.push(makeKeyAlias(`${name}-${emailLocal}`));
        }

        const mapped = candidates.map((candidate) => aliasMap.get(candidate)).find(Boolean);
        if (mapped) {
          fileKey = mapped;
          mappedCount += 1;
        }
      }

      if (!normalizedEmail) {
        const nameMatches = await sql<{ id: number }[]>`
          SELECT id
          FROM users
          WHERE LOWER(name) = ${normalizedName}
          LIMIT 2
        `;

        if (nameMatches.length > 1) {
          errors.push(`Skipped row with ambiguous name (multiple users): ${name}`);
          continue;
        }

        if (nameMatches.length === 1) {
          await sql`
            UPDATE users
            SET
              name = ${name},
              file_key = CASE
                WHEN ${fileKey} <> '' THEN ${fileKey}
                ELSE file_key
              END,
              updated_at = NOW()
            WHERE id = ${nameMatches[0].id}
          `;

          importedCount += 1;
          continue;
        }
      }

      await sql`
          INSERT INTO users (email, name, file_key, download_count, created_at, updated_at)
          VALUES (${email}, ${name}, ${fileKey}, 0, NOW(), NOW())
          ON CONFLICT (email)
          DO UPDATE SET
            name = EXCLUDED.name,
            file_key = CASE
              WHEN EXCLUDED.file_key <> '' THEN EXCLUDED.file_key
              ELSE users.file_key
            END,
            updated_at = NOW()
        `;

      importedCount += 1;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      mappedCount,
      skippedCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("CSV import failed:", error);
    return NextResponse.json({ success: false, message: "CSV import failed." }, { status: 500 });
  }
}
