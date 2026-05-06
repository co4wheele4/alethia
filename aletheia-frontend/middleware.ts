import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Cursor/VS Code Simple Browser loads dev URLs inside a cross-origin iframe.
 * Strip framing headers in development so the embedded preview can render.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  if (process.env.NODE_ENV !== "production") {
    response.headers.delete("x-frame-options");
    response.headers.delete("X-Frame-Options");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
