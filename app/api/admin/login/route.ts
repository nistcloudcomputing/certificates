import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, isValidAdminCredentials, signAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    const isValid = isValidAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
    }

    const token = await signAdminToken(email);
    const response = NextResponse.json({ success: true, message: "Logged in successfully." });

    response.cookies.set({
      name: getAdminCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ success: false, message: "Login failed." }, { status: 500 });
  }
}
