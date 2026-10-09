import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";

// Routes publiques explicites (security.md §9) : tout le reste est protégé.
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/verify-email", "/forgot-password"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

let authProxy: ReturnType<ReturnType<typeof getAuth>["middleware"]> | undefined;

function protect(request: NextRequest) {
  authProxy ??= getAuth().middleware({ loginUrl: "/sign-in" });
  return authProxy(request);
}

export default function proxy(request: NextRequest) {
  if (isPublic(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return protect(request);
}

export const config = {
  // Exclus : assets, images, handler d'auth et sonde de santé.
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
