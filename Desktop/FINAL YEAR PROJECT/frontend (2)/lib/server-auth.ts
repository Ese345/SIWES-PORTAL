// filepath: e:\Projects_CU\Ese\frontend\lib\server-auth.ts
import { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { Role } from "@/types";

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  exp: number;
  iat: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
}

/**
 * Extract and verify JWT token from request
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try cookies
  const cookieToken = request.cookies.get("siwes_access_token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwtDecode<TokenPayload>(token);

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp <= currentTime) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Get authenticated user from request
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: Role): boolean {
  return user?.role === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(
  user: AuthUser | null,
  requiredRoles: Role[]
): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Role hierarchy check - Admin can access everything, etc.
 */
export function hasPermission(
  user: AuthUser | null,
  requiredRole: Role
): boolean {
  if (!user) return false;

  // Admin has access to everything
  if (user.role === Role.Admin) return true;

  // Supervisor roles can access student resources
  if (
    requiredRole === Role.Student &&
    (user.role === Role.SchoolSupervisor ||
      user.role === Role.IndustrySupervisor)
  ) {
    return true;
  }

  // Exact role match
  return user.role === requiredRole;
}

/**
 * Create response for unauthorized access
 */
export function createUnauthorizedResponse(
  message: string = "Unauthorized"
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: "UNAUTHORIZED",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Create response for forbidden access
 */
export function createForbiddenResponse(
  message: string = "Insufficient permissions"
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: "FORBIDDEN",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: AuthUser
  ) => Promise<Response> | Response,
  requiredRole?: Role
) {
  return async (request: NextRequest): Promise<Response> => {
    const user = getAuthUser(request);

    if (!user) {
      return createUnauthorizedResponse("Authentication required");
    }

    if (requiredRole && !hasPermission(user, requiredRole)) {
      return createForbiddenResponse(
        "Insufficient permissions for this resource"
      );
    }

    return handler(request, user);
  };
}

/**
 * Middleware to require specific roles
 */
export function requireRole(roles: Role | Role[]) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return (
    handler: (
      request: NextRequest,
      user: AuthUser
    ) => Promise<Response> | Response
  ) => {
    return async (request: NextRequest): Promise<Response> => {
      const user = getAuthUser(request);

      if (!user) {
        return createUnauthorizedResponse("Authentication required");
      }

      if (!hasAnyRole(user, requiredRoles)) {
        return createForbiddenResponse(
          `This resource requires one of the following roles: ${requiredRoles.join(
            ", "
          )}`
        );
      }

      return handler(request, user);
    };
  };
}

/**
 * Extract user ID from token for database queries
 */
export function getUserId(request: NextRequest): string | null {
  const user = getAuthUser(request);
  return user?.userId || null;
}

/**
 * Check if request is from admin user
 */
export function isAdmin(request: NextRequest): boolean {
  const user = getAuthUser(request);
  return user?.role === Role.Admin;
}

/**
 * Check if request is from supervisor (any type)
 */
export function isSupervisor(request: NextRequest): boolean {
  const user = getAuthUser(request);
  return (
    user?.role === Role.SchoolSupervisor ||
    user?.role === Role.IndustrySupervisor
  );
}

/**
 * Check if request is from student
 */
export function isStudent(request: NextRequest): boolean {
  const user = getAuthUser(request);
  return user?.role === Role.Student;
}

/**
 * Validate token expiry with buffer time
 */
export function isTokenNearExpiry(
  token: string,
  bufferMinutes: number = 5
): boolean {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    const bufferTime = bufferMinutes * 60;

    return decoded.exp <= currentTime + bufferTime;
  } catch {
    return true; // If we can't decode, consider it expired
  }
}
