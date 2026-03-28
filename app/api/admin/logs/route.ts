import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { ensureDbSchema, getDbClient } from "@/lib/db";

type LogStatus = "success" | "failure";

function toPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const safe = Math.trunc(parsed);
  return safe > 0 ? safe : fallback;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await ensureDbSchema();
  const sql = getDbClient();

  const rawPage = request.nextUrl.searchParams.get("page");
  const rawPageSize = request.nextUrl.searchParams.get("pageSize");
  const rawSearch = request.nextUrl.searchParams.get("search")?.trim() || "";
  const rawStatus = (request.nextUrl.searchParams.get("status") || "all").trim().toLowerCase();

  const page = toPositiveInteger(rawPage, 1);
  const pageSize = Math.min(200, toPositiveInteger(rawPageSize, 50));
  const offset = (page - 1) * pageSize;
  const searchPattern = `%${rawSearch}%`;
  const status = rawStatus === "success" || rawStatus === "failure" ? (rawStatus as LogStatus) : "all";

  const [totalRows] =
    status !== "all" && rawSearch
      ? await sql<{ total: number }[]>`
          SELECT COUNT(*)::int AS total
          FROM logs
          WHERE status = ${status}
            AND (email ILIKE ${searchPattern} OR ip ILIKE ${searchPattern})
        `
      : status !== "all"
        ? await sql<{ total: number }[]>`
            SELECT COUNT(*)::int AS total
            FROM logs
            WHERE status = ${status}
          `
        : rawSearch
          ? await sql<{ total: number }[]>`
              SELECT COUNT(*)::int AS total
              FROM logs
              WHERE email ILIKE ${searchPattern}
                 OR ip ILIKE ${searchPattern}
            `
          : await sql<{ total: number }[]>`
              SELECT COUNT(*)::int AS total
              FROM logs
            `;

  const logs =
    status !== "all" && rawSearch
      ? await sql<
          {
            id: number;
            email: string;
            ip: string;
            status: LogStatus;
            timestamp: string;
          }[]
        >`
          SELECT id, email, ip, status, timestamp
          FROM logs
          WHERE status = ${status}
            AND (email ILIKE ${searchPattern} OR ip ILIKE ${searchPattern})
          ORDER BY timestamp DESC
          LIMIT ${pageSize}
          OFFSET ${offset}
        `
      : status !== "all"
        ? await sql<
            {
              id: number;
              email: string;
              ip: string;
              status: LogStatus;
              timestamp: string;
            }[]
          >`
            SELECT id, email, ip, status, timestamp
            FROM logs
            WHERE status = ${status}
            ORDER BY timestamp DESC
            LIMIT ${pageSize}
            OFFSET ${offset}
          `
        : rawSearch
          ? await sql<
              {
                id: number;
                email: string;
                ip: string;
                status: LogStatus;
                timestamp: string;
              }[]
            >`
              SELECT id, email, ip, status, timestamp
              FROM logs
              WHERE email ILIKE ${searchPattern}
                 OR ip ILIKE ${searchPattern}
              ORDER BY timestamp DESC
              LIMIT ${pageSize}
              OFFSET ${offset}
            `
          : await sql<
              {
                id: number;
                email: string;
                ip: string;
                status: LogStatus;
                timestamp: string;
              }[]
            >`
              SELECT id, email, ip, status, timestamp
              FROM logs
              ORDER BY timestamp DESC
              LIMIT ${pageSize}
              OFFSET ${offset}
            `;

  const total = totalRows?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    success: true,
    page,
    pageSize,
    total,
    totalPages,
    logs: logs.map((item) => ({
      id: String(item.id),
      email: item.email,
      ip: item.ip,
      status: item.status,
      timestamp: item.timestamp,
    })),
  });
}
