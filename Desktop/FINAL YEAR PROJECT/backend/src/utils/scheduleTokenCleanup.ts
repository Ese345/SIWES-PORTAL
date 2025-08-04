import { cleanupExpiredTokens } from './tokenCleanup';
import cron from 'node-cron';
import { createLogger, format, transports } from 'winston';

// Create logger for token cleanup
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'token-cleanup.log' }),
  ],
});

/**
 * Sets up scheduled token cleanup
 * Should be called once when the application starts
 */

export function setupTokenCleanup(): void {
  // Schedule the cleanup to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const cleanedUpCount = await cleanupExpiredTokens();
      logger.info(`Scheduled token cleanup completed. Cleaned up ${cleanedUpCount} tokens.`);
    } catch (error) {
      logger.error('Error during scheduled token cleanup:', error);
    }
  });
  logger.info('Scheduled token cleanup set up to run every day at midnight.');
}
