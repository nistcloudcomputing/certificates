import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { ensureDbSchema, getDbClient } from "@/lib/db";

export async function GET(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await ensureDbSchema();
  const sql = getDbClient();

  const [totalDownloads] = await sql<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM logs`;
  const [successfulDownloads] = await sql<{ total: number }[]>`
    SELECT COUNT(*)::int AS total FROM logs WHERE status = 'success'
  `;
  const [failedAttempts] = await sql<{ total: number }[]>`
    SELECT COUNT(*)::int AS total FROM logs WHERE status = 'failure'
  `;
  const [uniqueUsers] = await sql<{ total: number }[]>`
    SELECT COUNT(DISTINCT email)::int AS total FROM logs
  `;

  const timeSeries = await sql<
    {
      day: string;
      total: number;
      success: number;
      failure: number;
    }[]
  >`
    SELECT
      TO_CHAR(DATE_TRUNC('day', timestamp), 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::int AS success,
      SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END)::int AS failure
    FROM logs
    WHERE timestamp >= NOW() - INTERVAL '14 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const recentLogs = await sql<
    {
      id: number;
      email: string;
      ip: string;
      status: "success" | "failure";
      timestamp: string;
    }[]
  >`
    SELECT id, email, ip, status, timestamp
    FROM logs
    ORDER BY timestamp DESC
    LIMIT 20
  `;

  return NextResponse.json({
    success: true,
    totals: {
      totalDownloads: totalDownloads?.total || 0,
      successfulDownloads: successfulDownloads?.total || 0,
      failedAttempts: failedAttempts?.total || 0,
      uniqueUsers: uniqueUsers?.total || 0,
    },
    downloadsOverTime: timeSeries,
    recentActivity: recentLogs.map((item) => ({
      id: String(item.id),
      email: item.email,
      ip: item.ip,
      status: item.status,
      timestamp: item.timestamp,
    })),
  });
}
