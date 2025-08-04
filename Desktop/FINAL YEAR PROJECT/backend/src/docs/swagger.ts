import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Covenant University Logbook API',
    version: '1.0.0',
    description: 'API documentation for the Covenant University Logbook System',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // User, LogbookEntry, ITFForm, Notification, Attendance, etc.
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['Student', 'IndustrySupervisor', 'SchoolSupervisor', 'Admin'] },
          imageUrl: { type: 'string', nullable: true },
          mustChangePassword: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LogbookEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          studentId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          submitted: { type: 'boolean' },
          imageUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ITFForm: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          fileUrl: { type: 'string' },
          uploadedAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          message: { type: 'string' },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Attendance: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          studentId: { type: 'string' },
          supervisorId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          present: { type: 'boolean' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication and user management' },
    { name: 'Users', description: 'User management' },
    { name: 'Logbook', description: 'Student logbook' },
    { name: 'ITFForms', description: 'ITF forms' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Attendance', description: 'Attendance marking and viewing' },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts', // You can add JSDoc comments in your route files for more detail
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 