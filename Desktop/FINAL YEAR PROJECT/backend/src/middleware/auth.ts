import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: Role;
    mustChangePassword?: boolean;
  };
  token?: string;
}

export async function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if token is blacklisted
    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: { token },
    });

    if (blacklistedToken) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: Role;
      mustChangePassword?: boolean;
    };
    req.user = decoded;
    req.token = token; // Store the token for potential blacklisting on logout
    next();
  } catch (err) {
    console.log('JWT verification error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(
  ...roles: Role[]
): (req: AuthRequest, res: Response, next: NextFunction) => void | Response {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

export function requirePasswordChange(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void | Response {
  // Allow password change and logout endpoints
  if (
    req.user &&
    (req.path === '/change-password' || req.path === '/logout' || req.path === '/login')
  ) {
    return next();
  }
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({ error: 'You must change your password before continuing.' });
  }
  next();
}

// Helper function to extract JWT expiration
export function getTokenExpiryDate(token: string): Date {
  try {
    const decoded = jwt.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000); // Convert Unix timestamp to JavaScript Date
    }
  } catch (error) {
    // If decoding fails, default to 24 hours from now
    console.error('Failed to decode token:', error);
  }

  // Default expiry time (24 hours from now)
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  return expiryDate;
}
