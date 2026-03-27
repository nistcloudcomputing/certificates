import { NextRequest, NextResponse } from "next/server";
import { verifyPreviewToken } from "@/lib/auth";
import { getSignedUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, message: "Missing preview token." }, { status: 400 });
    }

    const payload = await verifyPreviewToken(token);
    const previewUrl = await getSignedUrl(payload.fileKey);
    const downloadUrl = await getSignedUrl(payload.fileKey, { download: true });

    return NextResponse.json({
      success: true,
      email: payload.email,
      name: payload.name,
      previewUrl,
      downloadUrl,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid or expired preview token." }, { status: 401 });
  }
}
