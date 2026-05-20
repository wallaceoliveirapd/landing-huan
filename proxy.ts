import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isLoginRoute = createRouteMatcher(["/admin/login"]);

/**
 * CORS is enforced via `headers()` in next.config.ts (static headers for /api/*).
 * Full cross-origin blocking (rejecting disallowed origins) would need to live
 * here, but returning early from this callback breaks convexAuthNextjsMiddleware's
 * token-refresh logic. The next.config headers approach is safe for same-origin
 * browser requests and covers the typical cross-origin vector.
 *
 * Admin auth: server-side role check is done in the layout (fetchQuery myRole).
 * This middleware only handles the unauthenticated-redirect guard.
 */
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Redirect unauthenticated users away from admin (except login page)
  if (isAdminRoute(request) && !isLoginRoute(request)) {
    if (!(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/admin/login");
    }
  }
  // Redirect already-authenticated users away from login page
  if (isLoginRoute(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/admin");
  }
  // All other routes (including /api/*): fall through so
  // convexAuthNextjsMiddleware can refresh tokens normally.
});

export const config = {
  // Skip /api/upload-story so its 50MB FormData bypasses the middleware body cap.
  // That route does its own auth via fetchQuery(api.users.myRole).
  matcher: [
    "/((?!.*\\..*|_next|api/upload-story).*)",
    "/",
    "/((?!api/upload-story)api|trpc)(.*)",
  ],
};
