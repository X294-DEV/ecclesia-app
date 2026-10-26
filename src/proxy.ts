import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// En Next.js 16 "middleware" se llama "proxy".
// Aquí solo hay una comprobación OPTIMISTA (¿existe la cookie de sesión?) para mandar
// al login sin tocar la base de datos. La validación real (sesión válida, usuario activo,
// permisos del rol) se hace en el servidor: getCurrentUser() / requireCan() de src/server/session.ts.

const PUBLIC_PATHS = ["/login", "/recuperar", "/restablecer"];
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!isPublic && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluye rutas de API (incluye /api/auth), archivos estáticos e imágenes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
