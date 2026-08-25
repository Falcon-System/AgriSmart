import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Allow requests to /login and /api/auth/* to pass through
  if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
