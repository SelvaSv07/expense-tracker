import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.rewrite(new URL("/overview", request.url));
  }

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/overview", "/transactions", "/budget", "/goals", "/ai"],
};
