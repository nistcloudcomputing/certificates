import { NextRequest, NextResponse } from "next/server";
import { verifyPreviewToken } from "@/lib/auth";
import { getSignedUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, message: "Missing preview token." }, { status: 400 });
  }

  let payload: Awaited<ReturnType<typeof verifyPreviewToken>>;

  try {
    payload = await verifyPreviewToken(token);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid or expired preview token." }, { status: 401 });
  }

  try {
    const previewUrl = await getSignedUrl(payload.fileKey);
    let downloadUrl = previewUrl;

    try {
      downloadUrl = await getSignedUrl(payload.fileKey, { download: true });
    } catch (error) {
      console.error("Preview download URL signing failed, using preview URL as fallback:", error);
    }

    return NextResponse.json({
      success: true,
      email: payload.email,
      name: payload.name,
      previewUrl,
      downloadUrl,
    });
  } catch (error) {
    console.error("Preview signing failed:", error);
    return NextResponse.json({ success: false, message: "Could not generate certificate preview." }, { status: 500 });
  }
}
