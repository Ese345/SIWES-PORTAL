import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';

const prisma = new PrismaClient();

// Create logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

/**
 * Removes expired tokens from the blacklist
 * Should be run periodically to clean up the database
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const now = new Date();
    const result = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired tokens from the blacklist`);
    return result.count;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    throw error;
  }
}

export default cleanupExpiredTokens;
