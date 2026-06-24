import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY = "placeholder-anon-key";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_ANON_KEY;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // If env vars are unset (placeholder mode), skip auth gating so the build/dev
  // remains usable. Real deployments must set both NEXT_PUBLIC_SUPABASE_URL and
  // NEXT_PUBLIC_SUPABASE_ANON_KEY for the proxy to enforce auth.
  const envConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!envConfigured) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/documents/");

  // Unauthenticated users hitting protected routes go to /login (with a redirect hint).
  if (!user && !isAuthPage && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated users hitting auth pages are bounced to the app.
  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/document-review";
    return NextResponse.redirect(redirectUrl);
  }

  // Tool access control: if the user has explicit tool_access claims that don't
  // include "document-review", deny access. Empty/missing claims fall through (MVP).
  if (user && request.nextUrl.pathname.startsWith("/document-review")) {
    const appMetadata = user.app_metadata ?? {};
    const toolAccess = (appMetadata.tool_access ??
      appMetadata.tool ??
      []) as string[];

    const hasToolAccessInfo =
      Array.isArray(toolAccess) && toolAccess.length > 0;
    if (hasToolAccessInfo && !toolAccess.includes("document-review")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set(
        "error",
        "Access Denied: You do not have permission to access Document Review Room",
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
