import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  DomainError,
  isDomainError,
  UnauthorizedError,
} from "@/lib/errors";

/**
 * The "context" passed to every service call. It bundles the
 * authenticated user with the request-scoped Supabase client so services
 * never have to know whether they were invoked from an API route or a
 * server component.
 */
export interface RequestContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Build a context for a server component. Redirects the user to /login
 * if they are not authenticated -- this is the universal landing for any
 * unauthenticated server-side render.
 */
export async function getServerContext(): Promise<RequestContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/login");
  }
  return { user, supabase };
}

/**
 * Build a context for an API route handler. Throws UnauthorizedError if
 * the user is not signed in -- `withAuth` catches this and emits a 401.
 */
async function getApiContext(): Promise<RequestContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new UnauthorizedError();
  }
  return { user, supabase };
}

type RouteParams = Record<string, string | string[] | undefined>;

interface AuthenticatedHandlerArgs<P extends RouteParams = RouteParams> {
  ctx: RequestContext;
  request: Request;
  params: Promise<P>;
}

interface NextRouteHandlerContext<P extends RouteParams = RouteParams> {
  params: Promise<P>;
}

/**
 * Wraps a route handler so it never has to repeat the auth + try/catch +
 * error-mapping boilerplate. Inside the handler:
 *   - `ctx`     -- authenticated user + Supabase client
 *   - `request` -- raw Request object
 *   - `params`  -- the dynamic route params (still a Promise, per Next 16)
 *
 * Any DomainError thrown by the service layer is mapped to a JSON
 * response with the right HTTP status. ZodErrors become a 400.
 */
export function withAuth<P extends RouteParams = RouteParams>(
  handler: (args: AuthenticatedHandlerArgs<P>) => Promise<Response>,
) {
  return async (
    request: Request,
    routeContext: NextRouteHandlerContext<P> = { params: Promise.resolve({} as P) },
  ): Promise<Response> => {
    try {
      const ctx = await getApiContext();
      return await handler({ ctx, request, params: routeContext.params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/**
 * Map any thrown error to a NextResponse. DomainError gets its own status
 * and code; ZodError becomes a 400 with the flattened issues; everything
 * else collapses to a generic 500. Always logs unexpected errors.
 */
export function errorResponse(err: unknown): NextResponse {
  if (isDomainError(err)) {
    return NextResponse.json(
      {
        error: err.message,
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_FAILED",
        details: err.flatten(),
      },
      { status: 400 },
    );
  }

  console.error("Unhandled API error:", err);
  const message =
    err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json(
    { error: message, code: "INTERNAL" },
    { status: 500 },
  );
}

/**
 * Convenience helper for server components that need to translate a
 * DomainError into a Next.js navigation effect (notFound() / redirect()).
 *
 * Re-exported here so server components don't have to import from three
 * different files.
 */
export { DomainError };
