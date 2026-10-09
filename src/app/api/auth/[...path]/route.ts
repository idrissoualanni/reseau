import { getAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ path: string[] }> };

// Handler généré paresseusement : `getAuth()` lit la config à la première
// requête (le build ne doit pas exiger les secrets Neon Auth).
let handlers: ReturnType<ReturnType<typeof getAuth>["handler"]> | undefined;

function getHandlers() {
  handlers ??= getAuth().handler();
  return handlers;
}

export function GET(request: Request, context: RouteContext) {
  return getHandlers().GET(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return getHandlers().POST(request, context);
}

export function PUT(request: Request, context: RouteContext) {
  return getHandlers().PUT(request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return getHandlers().DELETE(request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return getHandlers().PATCH(request, context);
}
