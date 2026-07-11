# Nest Backend Project Documentation

## Overview

This is a NestJS backend application with MongoDB, JWT authentication, role-based authorization, products CRUD, file uploads, and email templates.

- Base API path: `http://localhost:3000/api`
- Main technologies: NestJS, Mongoose, Passport JWT, Multer, Nodemailer, Class Validator
- Default seed accounts: `admin@example.com` / `Admin@123`, `user@example.com` / `User@123`

## Project Structure

- `src/main.ts` — application bootstrap and global configuration
- `src/app.module.ts` — root module that imports all feature modules
- `src/common` — shared utilities, middleware, guards, decorators, constants, and configuration
- `src/modules/auth` — authentication controller, service, JWT strategy, DTOs
- `src/modules/users` — user schema and user service
- `src/modules/roles` — role schema and role service
- `src/modules/products` — product controller, service, schema, and DTOs
- `src/modules/mail` — email sender service and mail controller
- `src/database/seeds` — database seeder to create roles and default users

## Application Startup

The app starts in `src/main.ts`:

- `app.setGlobalPrefix('api')` → every controller route is under `/api`
- CORS is enabled for any origin
- `loggerMiddleware` is applied globally for request logging
- `ValidationPipe` validates DTOs and strips unknown properties
- `HttpExceptionFilter` returns a consistent JSON error response

Run the app:

```bash
npm run start:dev
```

## Environment Configuration

Settings are loaded from `.env.<NODE_ENV>` via `src/config/configuration.ts`.

Important keys:

- `MONGODB_URI` — database connection string
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRES_IN` — token expiration
- `UPLOAD_DIR` — upload directory for images
- `MAIL_*` — optional mail transport configuration
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`

## Seed Command

Run the seeder to create roles and default users:

```bash
npm run seed
```

What it does:

1. Loads `SeedModule`, which connects to MongoDB and imports `RolesModule` and `UsersModule`
2. `SeederService.seedRoles()` creates or updates roles from `ROLE_LIST`:
   - `admin`
   - `user`
3. `SeederService.seedUsers()` ensures default users exist with seeded roles.

Default credentials:

- Admin: `admin@example.com` / `Admin@123`
- User: `user@example.com` / `User@123`

If `.env` sets seed values, those override the defaults.

## Authentication Flow

### Register (`POST /api/auth/register`)

Controller: `src/modules/auth/auth.controller.ts`

Request body:

```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice@example.com",
  "password": "secret123",
  "phone": "1234567890"
}
```

DTO: `src/modules/auth/dto/register.dto.ts`

- `firstName` required
- `lastName` optional
- `email` required, valid email
- `password` required, 6–64 chars
- `phone` optional

Service behavior:

- checks if email already exists
- looks up the `user` role via `RolesService.findByName(ROLES.USER)`
- hashes password with bcrypt
- creates a new user with role ID
- returns an auth payload with `user` and `accessToken`
- triggers a welcome email asynchronously without failing registration

### Login (`POST /api/auth/login`)

Request body:

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

DTO: `src/modules/auth/dto/login.dto.ts`

Behavior:

- finds the user by email and selects the hashed password
- validates password with bcrypt
- rejects inactive accounts
- updates `lastLoginAt`
- returns `accessToken` and `user` info

### Profile (`GET /api/auth/profile`)

Protected route: requires `Authorization: Bearer <token>`

- uses `JwtAuthGuard`
- returns the authenticated user from the JWT payload

## JWT Strategy

Defined in `src/modules/auth/strategies/jwt.strategy.ts`.

- extracts JWT from `Authorization: Bearer <token>`
- verifies using `JWT_SECRET`
- attaches the payload to `request.user`
- payload includes `sub` (user ID), `email`, and `role`

## Authorization and Guards

### `JwtAuthGuard`

- extends `AuthGuard('jwt')`
- protects routes by requiring a valid JWT

### `RolesGuard`

Defined in `src/common/guards/roles.guard.ts`

- reads required roles from `@Roles(...)` metadata
- checks `request.user.role`
- throws `ForbiddenException` if the role is not allowed

### `@Roles` decorator

Defined in `src/common/decorators/roles.decorator.ts`

- attaches roles metadata to handlers

### `@CurrentUser` decorator

Defined in `src/common/decorators/current-user.decorator.ts`

- returns authenticated user data from the request
- can also return a specific field like `userId`

## Product API

Controller: `src/modules/products/products.controller.ts`

All product routes are under `/api/products`.

### Create product (`POST /api/products`)

- requires JWT auth and admin role
- request type: `multipart/form-data`
- fields:
  - `name` (text)
  - `description` (text, optional)
  - `price` (text, numeric string)
  - `stock` (text, numeric string)
  - `category` (text, optional)
  - `images` (file) — can upload up to 5 images

`CreateProductDto` validates the fields.

Service creates a product document with image paths and optional `createdBy` user ID.

### List products (`GET /api/products`)

Public route that accepts query filters:

- `name`
- `category`
- `createdFrom`
- `createdTo`
- `inStock=true|false`
- `page`
- `limit`
- `sortBy=name|price|stock|createdAt`
- `sortOrder=asc|desc`

Returns paginated products.

### Get product by ID (`GET /api/products/:id`)

Returns a single product by MongoDB ID.

### Update product (`PATCH /api/products/:id`)

- requires admin role
- can update any product fields
- if new `images` are uploaded, existing product image list is replaced

### Upload single image (`POST /api/products/:id/image`)

- requires admin role
- accepts one file under field name `image`
- appends the uploaded file path to the product's `images` array

### Delete product (`DELETE /api/products/:id`)

- requires admin role
- removes the product and attempts to delete stored image files from disk

### Product schema

Defined in `src/modules/products/schemas/product.schema.ts`

Fields:

- `name`
- `description`
- `price`
- `stock`
- `images`
- `category`
- `createdBy`
- `isActive`

## File Uploads

Upload configuration in `src/common/config/multer.config.ts`:

- storage: disk storage under `UPLOAD_DIR` or `uploads`
- file name: `product-<timestamp>-<random>.<ext>`
- allowed mime types: `jpeg`, `png`, `webp`, `gif`
- max file size: 5 MB
- uses `filesToPaths()` to convert saved files into `/uploads/<filename>` URLs

Static file serving is enabled in `src/app.module.ts`:

- `ServeStaticModule.forRoot({ rootPath: join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'), serveRoot: '/uploads' })`

## Mail / Email

Mail service: `src/modules/mail/mail.service.ts`

- chooses SMTP transport when `MAIL_HOST` is configured
- else uses Ethereal test SMTP
- falls back to JSON transport if mailing fails
- renders templates from `src/modules/mail/templates/*.hbs`
- exposes `sendTemplate()` with subject, template, context, and attachments

Mail controller: `src/modules/mail/mail.controller.ts`

Route: `POST /api/mail/test`

- requires JWT auth and admin role
- body fields:
  - `to` (email)
  - `name` (optional)
  - `template` (`welcome`, `reset-password`, or `invoice`)

The controller builds template-specific email context and sends an attachment.

## Roles and Users

### Role schema

Defined in `src/modules/roles/schemas/role.schema.ts`

- `name` (required, unique, lowercase)
- `description`

### Roles service

- `findByName(name)` → returns role document or throws `Role not found`
- `upsert(name, description)` → ensures role exists
- `findAll()` → returns all roles

### User schema

Defined in `src/modules/users/schemas/user.schema.ts`

Fields:

- `firstName`
- `lastName`
- `email`
- `password` (selected only when explicitly requested)
- `role` (ObjectId reference to `roles`)
- `phone`
- `isActive`
- `lastLoginAt`

### User service

- `create(data)`
- `findByEmail(email)`
- `findByEmailWithPassword(email)`
- `findById(id)`
- `existsByEmail(email)`
- `updateLastLogin(id)`

## Middleware

### `loggerMiddleware`

Defined in `src/common/middleware/logger.middleware.ts`

- logs every request method and URL
- logs response status code and duration
- attached globally in `main.ts`

## Error Handling

- DTO validation errors are handled by Nest's `ValidationPipe`
- `HttpExceptionFilter` returns consistent JSON error structure
- Service helpers normalize unexpected errors into generic server errors

## API Summary

### Public / Authentication

- `GET /api` — health check
- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login and receive JWT
- `GET /api/auth/profile` — get authenticated user info

### Products

- `GET /api/products` — list products with filters and pagination
- `GET /api/products/:id` — get product by ID
- `POST /api/products` — create product (admin only)
- `PATCH /api/products/:id` — update product (admin only)
- `POST /api/products/:id/image` — upload one image (admin only)
- `DELETE /api/products/:id` — delete product (admin only)

### Mail

- `POST /api/mail/test` — send a test templated email (admin only)

## How Register Works

1. Client sends `POST /api/auth/register` with JSON body.
2. `AuthController.register()` calls `AuthService.register()`.
3. Service verifies email uniqueness.
4. Looks up the `user` role.
5. Hashes password with bcrypt.
6. Creates a new user document.
7. Builds and returns JWT payload + user data.
8. Sends welcome email asynchronously.

## How Login Works

1. Client sends `POST /api/auth/login`.
2. `AuthService.login()` fetches user with password.
3. Verifies password and active status.
4. Updates `lastLoginAt`.
5. Builds JWT and returns it.

## How Seeding Works

1. `npm run seed` builds the app and runs `dist/database/seeds/seed.js`.
2. `SeederService.run()` calls `seedRoles()` and `seedUsers()`.
3. Roles are created/updated with `RolesService.upsert()`.
4. Default admin and user accounts are created if missing.

## How Product APIs Work

- Product creation and updates use request validation via DTOs.
- Admin-only routes are protected by `JwtAuthGuard` and `RolesGuard`.
- File uploads are managed by Multer and saved to disk.
- Product list supports filters, sorting, and pagination.
- Deletion removes the database record and attempts to remove uploaded image files.

## Notes

- The app serves uploaded images from `/uploads/<filename>`.
- Use `Authorization: Bearer <token>` for protected routes.
- If `Role not found` appears, run the seeder and confirm the app uses the same database as the seed command.
- Default mail transport is Ethereal when SMTP is not configured.

## Quick Postman Test Flow

1. Run `npm run start:dev`.
2. Register a user with `POST /api/auth/register`.
3. Login with `POST /api/auth/login` and copy the `accessToken`.
4. Use the token for protected requests with `Authorization: Bearer <token>`.
5. Admin routes require the seeded admin account.

---

*Project documentation generated from the current source code.*
