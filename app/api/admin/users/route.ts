import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { ensureDbSchema, getDbClient } from "@/lib/db";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.trunc(value);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await ensureDbSchema();
  const sql = getDbClient();
  const search = request.nextUrl.searchParams.get("search")?.trim() || "";

  const users = search
    ? await sql<
        {
          id: number;
          email: string;
          name: string;
          file_key: string;
          download_count: number;
          download_limit: number;
          updated_at: string;
        }[]
      >`
        SELECT id, email, name, file_key, download_count, download_limit, updated_at
        FROM users
        WHERE email ILIKE ${`%${search}%`}
        ORDER BY created_at DESC
        LIMIT 300
      `
    : await sql<
        {
          id: number;
          email: string;
          name: string;
          file_key: string;
          download_count: number;
          download_limit: number;
          updated_at: string;
        }[]
      >`
        SELECT id, email, name, file_key, download_count, download_limit, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 300
      `;

  return NextResponse.json({
    success: true,
    users: users.map((user) => ({
      id: String(user.id),
      email: user.email,
      name: user.name,
      fileKey: user.file_key,
      downloadCount: user.download_count,
      downloadLimit: user.download_limit,
      certificateStatus: user.file_key ? "assigned" : "unassigned",
      updatedAt: user.updated_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await ensureDbSchema();
  const sql = getDbClient();

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    fileKey?: string;
    keyId?: string;
  };

  const email = normalize(body.email || "");
  const name = (body.name || "").trim();
  const fileKey = (body.fileKey || body.keyId || "").trim();

  if (!email || !isLikelyEmail(email)) {
    return NextResponse.json(
      { success: false, message: "A valid email is required." },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json({ success: false, message: "Name is required." }, { status: 400 });
  }

  if (!fileKey) {
    return NextResponse.json(
      { success: false, message: "Certificate keyId (fileKey) is required." },
      { status: 400 },
    );
  }

  const rows = await sql<
    {
      id: number;
      email: string;
      name: string;
      file_key: string;
      download_count: number;
      download_limit: number;
    }[]
  >`
    INSERT INTO users (email, name, file_key, download_count, created_at, updated_at)
    VALUES (${email}, ${name}, ${fileKey}, 0, NOW(), NOW())
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      file_key = EXCLUDED.file_key,
      updated_at = NOW()
    RETURNING id, email, name, file_key, download_count, download_limit
  `;

  const user = rows[0];

  return NextResponse.json({
    success: true,
    message: "User saved.",
    user: {
      id: String(user.id),
      email: user.email,
      name: user.name,
      fileKey: user.file_key,
      downloadCount: user.download_count,
      downloadLimit: user.download_limit,
      certificateStatus: user.file_key ? "assigned" : "unassigned",
    },
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await ensureDbSchema();
  const sql = getDbClient();

  const body = (await request.json()) as {
    id?: string;
    email?: string;
    name?: string;
    fileKey?: string;
    downloadLimit?: number;
    downloadLimitDelta?: number;
  };

  if (!body.id) {
    return NextResponse.json({ success: false, message: "User id is required." }, { status: 400 });
  }

  const nextEmail = typeof body.email === "string" ? normalize(body.email) : null;
  const nextName = typeof body.name === "string" ? body.name.trim() : null;
  const nextFileKey = typeof body.fileKey === "string" ? body.fileKey.trim() : null;
  const requestedDownloadLimit = parseInteger(body.downloadLimit);
  const downloadLimitDelta = parseInteger(body.downloadLimitDelta);
  const nextDownloadLimit = requestedDownloadLimit === null ? null : Math.max(0, requestedDownloadLimit);

  if (
    nextEmail === null
    && nextName === null
    && nextFileKey === null
    && nextDownloadLimit === null
    && downloadLimitDelta === null
  ) {
    return NextResponse.json({ success: false, message: "No updates provided." }, { status: 400 });
  }

  try {
    const updated = await sql<
      {
        id: number;
        email: string;
        name: string;
        file_key: string;
        download_count: number;
        download_limit: number;
      }[]
    >`
      UPDATE users
      SET
        email = COALESCE(${nextEmail}, email),
        name = COALESCE(${nextName}, name),
        file_key = COALESCE(${nextFileKey}, file_key),
        download_limit = GREATEST(
          download_count,
          COALESCE(${nextDownloadLimit}, download_limit) + COALESCE(${downloadLimitDelta}, 0),
          0
        ),
        updated_at = NOW()
      WHERE id = ${Number(body.id)}
      RETURNING id, email, name, file_key, download_count, download_limit
    `;

    if (!updated[0]) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const row = updated[0];

    return NextResponse.json({
      success: true,
      user: {
        id: String(row.id),
        email: row.email,
        name: row.name,
        fileKey: row.file_key,
        downloadCount: row.download_count,
        downloadLimit: row.download_limit,
        certificateStatus: row.file_key ? "assigned" : "unassigned",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return NextResponse.json({ success: false, message: "Email already exists." }, { status: 409 });
    }

    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await ensureDbSchema();
  const sql = getDbClient();

  const deleteAll = request.nextUrl.searchParams.get("all") === "true";

  if (deleteAll) {
    const rows = await sql<{ count: number }[]>`
      WITH deleted AS (
        DELETE FROM users
        RETURNING id
      )
      SELECT COUNT(*)::int AS count FROM deleted
    `;

    const deletedCount = rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      message: deletedCount ? "All users deleted." : "No users found.",
      deletedCount,
    });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, message: "User id is required." }, { status: 400 });
  }

  const deleted = await sql<{ id: number }[]>`
    DELETE FROM users
    WHERE id = ${Number(id)}
    RETURNING id
  `;

  if (!deleted[0]) {
    return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "User deleted." });
}
