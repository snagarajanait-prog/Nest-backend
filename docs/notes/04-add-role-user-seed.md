# Add a New Role and Seed a New User

These steps show how to add a new role constant and seed a new user in the Nest backend.

## 1. Add the new role constant

Update `src/common/constants/app.constants.ts`:

```ts
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MANAGER: 'manager',
} as const;

export const ROLE_LIST: { name: RoleName; description: string }[] = [
  { name: ROLES.ADMIN, description: 'Full access to all resources' },
  { name: ROLES.USER, description: 'Standard user with limited access' },
  { name: ROLES.MANAGER, description: 'Manager with intermediate permissions' },
];
```

## 2. Add manager seed configuration

Update `src/config/configuration.ts` to include manager credentials:

```ts
seed: {
  adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
  adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
  userEmail: process.env.SEED_USER_EMAIL ?? 'user@example.com',
  userPassword: process.env.SEED_USER_PASSWORD ?? 'User@123',
  managerEmail: process.env.SEED_MANAGER_EMAIL ?? 'manager@example.com',
  managerPassword: process.env.SEED_MANAGER_PASSWORD ?? 'Manager@123',
},
```

## 3. Update the user seeder service

Edit `src/database/seeds/user-seeder.service.ts` and add the new role user creation after the existing admin/user seeds:

```ts
const managerRole = await this.rolesService.findByName(ROLES.MANAGER);

await this.ensureUser(
  this.config.get<string>('seed.managerEmail') ?? 'manager@example.com',
  this.config.get<string>('seed.managerPassword') ?? 'Manager@123',
  'Manager',
  managerRole._id,
);
```

## 4. Add environment variables

In `.env.development` or the appropriate environment file, add:

```env
SEED_MANAGER_EMAIL=manager@example.com
SEED_MANAGER_PASSWORD=Manager@123
```

## 5. Run the seeder

Use one of the following commands:

```bash
npm run seed:roles
npm run seed:users
```

Or run the full seed:

```bash
npm run seed:all
```

## Notes

- `seed:roles` creates or updates role documents only.
- `seed:users` creates default users only.
- `seed:all` runs both role and user seeding.
- The seeder is idempotent: you can run it multiple times safely.
