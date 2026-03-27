import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminToken } from "@/lib/auth";

async function hasValidAdminToken(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;

  if (!token) {
    return false;
  }

  try {
    await verifyAdminToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  if (isLoginApi) {
    return NextResponse.next();
  }

  const isAuthenticated = await hasValidAdminToken(request);

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if ((isAdminPage && !isLoginPage) || isAdminApi) {
    if (!isAuthenticated) {
      if (isAdminApi) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
