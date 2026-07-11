/**
 * Central place that reads raw environment variables (already loaded by
 * ConfigModule from the correct `.env.<NODE_ENV>` file) and turns them into a
 * typed, nested config object. Access it with `ConfigService.get(...)`.
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nest_app_dev',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change_me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  mail: {
    host: process.env.MAIL_HOST ?? '',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: (process.env.MAIL_SECURE ?? 'false') === 'true',
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Nest App <no-reply@nest-app.local>',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
    userEmail: process.env.SEED_USER_EMAIL ?? 'user@example.com',
    userPassword: process.env.SEED_USER_PASSWORD ?? 'User@123',
  },
});

export type AppConfig = ReturnType<typeof import('./configuration').default>;
