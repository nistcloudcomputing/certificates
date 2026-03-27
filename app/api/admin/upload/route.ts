import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { ensureDbSchema, getDbClient } from "@/lib/db";
import { deleteCertificateFromS3, listCertificateKeys, uploadCertificateToS3 } from "@/lib/s3";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getDisplayNameFromKey(fileKey: string) {
  const filename = fileKey.split("/").pop() || fileKey;
  return filename.replace(/^[a-f0-9-]{36}-/, "");
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await listCertificateKeys();
    const files = keys.map((fileKey) => ({
      fileKey,
      fileName: getDisplayNameFromKey(fileKey),
    }));

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("Load uploaded files failed:", error);
    return NextResponse.json({ success: false, message: "Could not load uploaded files." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isBodyParseFailure = message.toLowerCase().includes("formdata")
        || message.toLowerCase().includes("body");

      if (isBodyParseFailure) {
        return NextResponse.json(
          {
            success: false,
            message: "Upload payload is too large or invalid. Try fewer/smaller files and retry.",
          },
          { status: 413 },
        );
      }

      throw error;
    }

    const entries = formData.getAll("files");
    const files = entries.filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json({ success: false, message: "No files uploaded." }, { status: 400 });
    }

    const uploaded: Array<{ fileName: string; fileKey: string }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, message: `File exceeds 10MB limit: ${file.name}` },
          { status: 400 },
        );
      }

      const fileKey = await uploadCertificateToS3(file);
      uploaded.push({ fileName: file.name, fileKey });
    }

    return NextResponse.json({
      success: true,
      message: "Upload complete.",
      uploaded,
    });
  } catch (error) {
    console.error("Upload API failed:", error);
    return NextResponse.json({ success: false, message: "Upload failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: { fileKey?: string; fileKeys?: string[]; deleteAll?: boolean } = {};

  try {
    body = (await request.json()) as { fileKey?: string; fileKeys?: string[]; deleteAll?: boolean };
  } catch {
    body = {};
  }

  const deleteAll = body.deleteAll === true;
  const requestedKeys = deleteAll
    ? await listCertificateKeys()
    : [...(Array.isArray(body.fileKeys) ? body.fileKeys : []), body.fileKey || ""]
        .map((key) => key.trim())
        .filter(Boolean);
  const fileKeys = Array.from(new Set(requestedKeys.map((key) => key.trim()).filter(Boolean)));

  if (!fileKeys.length && !deleteAll) {
    return NextResponse.json({ success: false, message: "fileKey is required." }, { status: 400 });
  }
  if (!fileKeys.length && deleteAll) {
    return NextResponse.json({
      success: true,
      message: "No uploaded certificates found.",
      requestedCount: 0,
      deletedCount: 0,
      failedCount: 0,
      clearedUserAssignments: 0,
      failed: [],
    });
  }

  const deleted: string[] = [];
  const failed: Array<{ fileKey: string; reason: string }> = [];

  for (const fileKey of fileKeys) {
    try {
      await deleteCertificateFromS3(fileKey);
      deleted.push(fileKey);
    } catch (error) {
      failed.push({
        fileKey,
        reason: error instanceof Error ? error.message : "Delete failed",
      });
    }
  }

  let unassignedCount = 0;

  if (deleted.length) {
    await ensureDbSchema();
    const sql = getDbClient();

    const rows = await sql<{ count: number }[]>`
      WITH updated AS (
        UPDATE users
        SET file_key = '',
            updated_at = NOW()
        WHERE file_key = ANY(${sql.array(deleted)})
        RETURNING id
      )
      SELECT COUNT(*)::int AS count FROM updated
    `;

    unassignedCount = rows[0]?.count || 0;
  }

  if (!deleted.length) {
    return NextResponse.json(
      {
        success: false,
        message: "No files were deleted.",
        requestedCount: fileKeys.length,
        deletedCount: 0,
        failedCount: failed.length,
        failed,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: failed.length === 0,
    message: failed.length ? "Some files could not be deleted." : "Files deleted successfully.",
    requestedCount: fileKeys.length,
    deletedCount: deleted.length,
    failedCount: failed.length,
    clearedUserAssignments: unassignedCount,
    failed,
  });
}
