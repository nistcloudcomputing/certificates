import { NextRequest, NextResponse } from "next/server";
import { ensureDbSchema, getDbClient } from "@/lib/db";
import { getClientIp, normalizeInput } from "@/lib/request";
import { getSignedUrl } from "@/lib/s3";

const GENERIC_ERROR_MESSAGE = "Invalid credentials. Please check your details and try again.";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const DEFAULT_DOWNLOAD_LIMIT = 2;

const requestLog = new Map<string, number[]>();
type UserRecord = {
  id: number;
  email: string;
  name: string;
  file_key: string;
  download_count: number;
  download_limit: number;
};

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const records = requestLog.get(clientIp) ?? [];
  const recentRecords = records.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (recentRecords.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientIp, recentRecords);
    return true;
  }

  recentRecords.push(now);
  requestLog.set(clientIp, recentRecords);
  return false;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const sql = getDbClient();

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again in a minute.",
      },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as { email?: string; name?: string };

    const normalizedEmail = normalizeInput(body.email || "");
    const normalizedName = normalizeInput(body.name || "");
    const logIdentifier = normalizedEmail || (normalizedName ? `name:${normalizedName}` : "unknown");

    if (!normalizedEmail && !normalizedName) {
      await ensureDbSchema();
      await sql`
        INSERT INTO logs (email, ip, status, timestamp)
        VALUES (${logIdentifier}, ${clientIp}, 'failure', NOW())
      `;

      return NextResponse.json(
        {
          success: false,
          message: "Please provide email or name.",
        },
        { status: 400 },
      );
    }

    await ensureDbSchema();
    const matchedByEmail = normalizedEmail
      ? await sql<UserRecord[]>`
          SELECT id, email, name, file_key, download_count, download_limit
          FROM users
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 2
        `
      : [];
    const matchedByName = normalizedName
      ? await sql<UserRecord[]>`
          SELECT id, email, name, file_key, download_count, download_limit
          FROM users
          WHERE LOWER(name) = ${normalizedName}
          LIMIT 2
        `
      : [];

    const matchedByBoth =
      normalizedEmail && normalizedName
        ? await sql<UserRecord[]>`
            SELECT id, email, name, file_key, download_count, download_limit
            FROM users
            WHERE LOWER(email) = ${normalizedEmail}
              AND LOWER(name) = ${normalizedName}
            LIMIT 1
          `
        : [];

    let user = matchedByBoth[0];
    let ambiguousNameMatch = false;

    if (!user) {
      if (matchedByEmail.length === 1) {
        user = matchedByEmail[0];
      } else if (matchedByName.length === 1) {
        user = matchedByName[0];
      } else if (!normalizedEmail && normalizedName && matchedByName.length > 1) {
        ambiguousNameMatch = true;
      }
    }

    if (ambiguousNameMatch) {
      await sql`
        INSERT INTO logs (email, ip, status, timestamp)
        VALUES (${logIdentifier}, ${clientIp}, 'failure', NOW())
      `;

      return NextResponse.json(
        {
          success: false,
          message: "Multiple users found for this name. Please enter email too.",
        },
        { status: 409 },
      );
    }

    if (!user || !user.file_key) {
      await sql`
        INSERT INTO logs (email, ip, status, timestamp)
        VALUES (${logIdentifier}, ${clientIp}, 'failure', NOW())
      `;

      return NextResponse.json(
        {
          success: false,
          message: GENERIC_ERROR_MESSAGE,
        },
        { status: 401 },
      );
    }

    const incremented = await sql<{ download_count: number }[]>`
      UPDATE users
      SET download_count = download_count + 1,
          updated_at = NOW()
      WHERE id = ${user.id}
        AND download_count < download_limit
      RETURNING download_count
    `;

    if (!incremented[0]) {
      await sql`
        INSERT INTO logs (email, ip, status, timestamp)
        VALUES (${user.email}, ${clientIp}, 'failure', NOW())
      `;

      return NextResponse.json(
        {
          success: false,
          message: `Download limit reached. You can only download your certificate ${user.download_limit ?? DEFAULT_DOWNLOAD_LIMIT} times.`,
        },
        { status: 403 },
      );
    }

    await sql`
      INSERT INTO logs (email, ip, status, timestamp)
      VALUES (${user.email}, ${clientIp}, 'success', NOW())
    `;

    const downloadUrl = await getSignedUrl(user.file_key, { download: true });

    return NextResponse.json({
      success: true,
      message: "Verification successful. Download will start shortly.",
      downloadUrl,
    });
  } catch (error) {
    console.error("Verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process request at the moment. Please try again.",
      },
      { status: 500 },
    );
  }
}
