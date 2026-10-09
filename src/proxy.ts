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
  // Les routes `/api/**` sont exclues : un handler REST doit répondre du JSON
  // (401 compris), jamais une redirection HTML vers la connexion. Chaque
  // handler protégé appelle `requireSession()` lui-même.
  // Exclus aussi : assets, images et favicon.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
