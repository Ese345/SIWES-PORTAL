import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';
import app from './app';
import { setupTokenCleanup } from '@/utils/scheduleTokenCleanup';

// Load environment variables
dotenv.config();

// Create logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        }),
      ),
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

const port = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  // Get the cron job for token cleanup
  setupTokenCleanup();

  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port} in ${process.env.NODE_ENV} mode`);
  });

  // Handle graceful shutdown
  const shutdown = async (): Promise<void> => {
    logger.info('Received shutdown signal');
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        const prisma = new PrismaClient();
        await prisma.$disconnect();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
  });
}

export default app;
