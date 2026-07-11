/**
 * All user-facing strings and magic values live here so they are never
 * hard-coded across the codebase (task requirement: "Use constants variable
 * for strings inside the codebase").
 */

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST: { name: RoleName; description: string }[] = [
  { name: ROLES.ADMIN, description: 'Full access to all resources' },
  { name: ROLES.USER, description: 'Standard user with limited access' },
];

export const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
  PRODUCTS: 'products',
} as const;

/** Keys used with ConfigService.get(...) */
export const CONFIG = {
  PORT: 'port',
  MONGODB_URI: 'mongodbUri',
  JWT_SECRET: 'jwt.secret',
  JWT_EXPIRES_IN: 'jwt.expiresIn',
  UPLOAD_DIR: 'uploadDir',
} as const;

/** Metadata key read by the RolesGuard */
export const ROLES_KEY = 'roles';

export const MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_EXISTS: 'A user with this email already exists',
    UNAUTHORIZED: 'Authentication is required to access this resource',
    FORBIDDEN: 'You do not have permission to perform this action',
    ACCOUNT_DISABLED: 'This account has been disabled',
  },
  USER: {
    NOT_FOUND: 'User not found',
    FETCHED: 'User fetched successfully',
  },
  ROLE: {
    NOT_FOUND: 'Role not found',
    DEFAULT_MISSING:
      'Default role is missing. Run the seeder before registering users.',
  },
  PRODUCT: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully',
    FETCHED: 'Products fetched successfully',
    FETCHED_ONE: 'Product fetched successfully',
    NOT_FOUND: 'Product not found',
  },
  UPLOAD: {
    INVALID_TYPE: 'Only image files (jpg, png, webp, gif) are allowed',
    TOO_LARGE: 'File is too large',
  },
  MAIL: {
    SENT: 'Email sent successfully',
    WELCOME_SUBJECT: 'Welcome to Nest App 🎉',
    RESET_SUBJECT: 'Reset your Nest App password',
    INVOICE_SUBJECT: 'Your Nest App invoice',
  },
  GENERIC: {
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again later.',
  },
} as const;

export const APP = {
  NAME: 'Nest App',
} as const;

export const UPLOAD = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_FILES: 5,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

/** Default pagination / sorting for list endpoints */
export const DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc' as 'asc' | 'desc',
} as const;
