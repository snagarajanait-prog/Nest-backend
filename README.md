# Nest-app — Backend (NestJS + MongoDB)

A training project backend built with **NestJS (TypeScript)** and **MongoDB (Mongoose)**.
It covers users/roles, JWT auth, and a full product CRUD with image upload and filtering.

> Frontend (React + Material UI + Redux) will live alongside this backend and consume these APIs.

---

## Tech stack
- **NestJS 11** (TypeScript) · **MongoDB 7** via **Mongoose 9**
- **JWT** auth (`@nestjs/jwt` + `passport-jwt`), passwords hashed with **bcryptjs**
- **class-validator / class-transformer** DTO validation
- **multer** single & multiple image upload, served statically from `/uploads`
- **ESLint 9** (type-checked) + **Prettier**, **Jest** for unit tests

## Prerequisites
- Node.js (use **nvm** to match versions) and npm
- A running **MongoDB** on `mongodb://127.0.0.1:27017`
  ```bash
  mongod --dbpath ~/.local/mongodb-data --port 27017 --fork \
         --logpath ~/.local/mongodb-data/mongod.log
  ```

## Setup & run
```bash
npm install

# 1. seed roles (admin/user) + default admin & user accounts
npm run seed                 # uses .env.development by default

# 2. start the API (watch mode)
npm run start:dev            # http://localhost:3000/api

# other envs
npm run start:staging        # uses .env.staging  (port 3001)
npm run build && npm run start:prod   # uses .env.production (port 8080)

# quality
npm run lint                 # ESLint --fix
npm test                     # Jest unit tests
```

### Default seeded accounts
| Role | Email | Password |
|------|-------|----------|
| admin | `admin@example.com` | `Admin@123` |
| user | `user@example.com` | `User@123` |

## Environments
`.env.development`, `.env.staging`, `.env.production` are selected by `NODE_ENV`
and loaded in `src/app.module.ts`. `.env.example` documents every variable.
> These files hold **placeholder** secrets on purpose (learning project). In a
> real app, secrets come from a secret manager and are never committed.

---

## API reference (base path: `/api`)

### Auth
| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| POST | `/auth/register` | – | firstName, email, password, [lastName, phone] | 201 |
| POST | `/auth/login` | – | email, password | 200 + `accessToken` |
| GET | `/auth/profile` | Bearer | – | 200 (current user) |

### Products
Send `Authorization: Bearer <token>` on every product route.
Write routes (POST/PATCH/DELETE) require the **admin** role.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/products` | admin | `multipart/form-data`; field `images` = 0..5 files |
| GET | `/products` | user+ | filters & sort (below) |
| GET | `/products/:id` | user+ | single product |
| PATCH | `/products/:id` | admin | partial update; new `images` replace old |
| POST | `/products/:id/image` | admin | single image (field `image`) |
| DELETE | `/products/:id` | admin | also removes image files |

**Filter / sort query params on `GET /products`:**
`name` (contains, case-insensitive) · `category` · `inStock` (`true`=in stock, `false`=out)
· `createdFrom` / `createdTo` (ISO dates) · `page` · `limit`
· `sortBy` (`name|price|stock|createdAt`) · `sortOrder` (`asc|desc`)

```bash
# example
curl "http://localhost:3000/api/products?name=mouse&inStock=true&sortBy=price&sortOrder=asc" \
     -H "Authorization: Bearer $TOKEN"
```

Uploaded images are served at `http://localhost:3000/uploads/<filename>`.

### Mail (nodemailer + Handlebars)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/mail/test` | admin | Body: `to`, optional `name`, optional `template` (`welcome`\|`reset-password`\|`invoice`). Sends the HTML template **with a text attachment**. |

- Templates live in `src/modules/mail/templates/*.hbs` and are copied to `dist` via `nest-cli.json` assets.
- Transport is chosen automatically: real **SMTP** if `MAIL_HOST` is set → else an
  **Ethereal** test inbox (returns a `previewUrl` you can open) → else a **JSON**
  transport when offline (so the app always boots).
- A **welcome email** is sent automatically on registration (fire-and-forget; a
  mail failure never breaks the registration request).

---

## Project structure
```
src/
├─ main.ts                    # bootstrap: global prefix, CORS, validation, logger, filter
├─ app.module.ts             # config, Mongo, static files, feature modules
├─ config/configuration.ts   # env → typed config
├─ common/
│  ├─ constants/             # all strings/messages/roles (no hard-coded strings)
│  ├─ decorators/            # @Roles, @CurrentUser
│  ├─ guards/                # JwtAuthGuard, RolesGuard
│  ├─ filters/               # global exception filter
│  ├─ middleware/            # request logger (applied to all routes)
│  ├─ config/multer.config.ts
│  └─ utils/errors.ts        # shared try/catch error normaliser
├─ modules/
│  ├─ roles/ · users/ · auth/ · products/   # schema + dto + service + controller + module
└─ database/seeds/           # roles + users seeder (npm run seed)
```

## How this maps to the task list
| Task | Where |
|------|-------|
| NestJS + MongoDB project | whole `src/`, `app.module.ts` |
| User schema, admin/user roles | `modules/users/schemas`, `modules/roles/schemas` |
| Seed roles & users | `database/seeds/`, `npm run seed` |
| Register/login with JWT | `modules/auth/` |
| try/catch on all APIs | service layer + `common/utils/errors.ts` + global filter |
| Constants for strings | `common/constants/app.constants.ts` |
| Products CRUD + image upload | `modules/products/`, `common/config/multer.config.ts` |
| Single & multiple upload | `POST /products` (multiple), `POST /products/:id/image` (single) |
| Filters (name/date/stock) | `dto/filter-product.dto.ts`, `products.service.buildConditions` |
| Middleware for all APIs | `common/middleware/logger.middleware.ts` (global `app.use`) |
| Nodemailer w/ templates + attachments | `modules/mail/`, `POST /mail/test`, welcome email on register |
| OOP | services/guards/DTOs are classes with DI; shared base helpers |
| .env dev/staging/prod | `.env.*`, `configuration.ts` |
| ESLint | `eslint.config.mjs`, `npm run lint` (currently clean) |
| Concept notes | `docs/notes/` |

## Still to do (next sessions, in order)
Cron jobs & queues · Jest unit-test coverage · then the **React + MUI + Redux**
frontend consuming these APIs.
