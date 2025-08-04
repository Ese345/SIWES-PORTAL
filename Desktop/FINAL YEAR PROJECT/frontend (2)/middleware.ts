import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { APP_ROUTES } from "./constants";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from cookies first (for server-side authentication)
  const cookieToken = request.cookies.get("siwes_access_token")?.value;
  if (cookieToken) return cookieToken;

  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
}

export function middleware(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const { pathname } = request.nextUrl;
  // Public routes that don't require authentication
  const publicRoutes = [
    APP_ROUTES.AUTH.LOGIN,
    APP_ROUTES.AUTH.FORGOT_PASSWORD,
    APP_ROUTES.AUTH.CHANGE_PASSWORD,
    "/",
  ];

  // Admin-only routes
  const adminOnlyRoutes = [APP_ROUTES.AUTH.REGISTER];

  // API routes that should be handled by the backend
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an admin-only route
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Validate token if it exists
  const hasValidToken = token && isTokenValid(token);

  // Get user role from token
  let userRole: string | null = null;
  if (hasValidToken && token) {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      userRole = decoded.role;
    } catch (error) {
      console.error("Failed to decode token in middleware:", error);
    }
  }

  if (!hasValidToken && isAdminOnlyRoute) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access a protected route
  if (!hasValidToken && !isPublicRoute) {
    const loginUrl = new URL(APP_ROUTES.AUTH.LOGIN, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but not admin and trying to access admin-only route
  if (hasValidToken && isAdminOnlyRoute && userRole !== "Admin") {
    return NextResponse.redirect(new URL(APP_ROUTES.DASHBOARD, request.url));
  }
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  // Exception: allow admins to access register page
  if (
    hasValidToken &&
    isPublicRoute &&
    pathname !== "/" &&
    !(isAdminOnlyRoute && userRole === "Admin")
  ) {
    return NextResponse.redirect(new URL(APP_ROUTES.DASHBOARD, request.url));
  }

  // Add token information to request headers for debugging
  if (hasValidToken && token) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-token", token);

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      requestHeaders.set("x-user-id", decoded.userId);
      requestHeaders.set("x-user-role", decoded.role);
    } catch (error) {
      console.error("Failed to decode token in middleware:", error);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
