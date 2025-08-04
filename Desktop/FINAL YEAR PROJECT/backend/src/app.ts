/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import userRoutes from './routes/user.routes';
import notificationsRoutes from './routes/notifications.routes';
import attendanceRoutes from './routes/attendance.routes';
import authRoutes from './routes/auth.routes';
import adminUsersCsvRoutes from './routes/admin.users.csv.routes';
import studentLogbookRoutes from './routes/student.logbook.routes';
import studentProfileRoutes from './routes/student.profile.routes';
import itfFormsRoutes from './routes/itf.forms.routes';
import { default as supervisorAssignmentRoutes } from './routes/supervisor.assignment.routes';
import industrySupervisorCsvRoutes from './routes/industry.supervisor.csv.routes';
import { authenticateJWT, requirePasswordChange } from './middleware/auth';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import supervisorAnalyticsRoutes from './routes/supervisor.analytics.routes';
import supervisorRoutes from './routes/supervisor.routes';
import logbookReviewRoutes from './routes/logbook.review';

dotenv.config();

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later.',
// });
// app.use(limiter);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  }),
);

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.url}`, {
    query: req.query,
    body: req.body,
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Apply requirePasswordChange after authenticateJWT for all protected routes except auth
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/auth/change-password') ||
    req.path.startsWith('/api/auth/signup') ||
    req.path.startsWith('/api/docs') ||
    req.path.startsWith('/health')
  ) {
    return next();
  }
  authenticateJWT(req, res, err => {
    if (err) return next(err);
    requirePasswordChange(req, res, next);
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminUsersCsvRoutes);
app.use('/api/logbook', logbookReviewRoutes);
app.use('/api/students', studentLogbookRoutes);
app.use('/api/students', studentProfileRoutes);
app.use('/api/itf-forms', itfFormsRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/notifications', notificationsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/supervisors', supervisorAssignmentRoutes);
app.use('/api/supervisors', supervisorAnalyticsRoutes);
app.use('/api/industry-supervisors', industrySupervisorCsvRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/supervisors', supervisorRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const errorResponse = {
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(500).json(errorResponse);
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

export default app;
