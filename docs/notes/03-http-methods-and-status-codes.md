# HTTP methods & status codes (API practice)

## HTTP request methods
| Method | Purpose | Idempotent? | Has body? | In this project |
|--------|---------|-------------|-----------|-----------------|
| **GET** | Read a resource / list | Yes | No | `GET /api/products`, `GET /api/products/:id` |
| **POST** | Create a new resource / actions | No | Yes | `POST /api/auth/login`, `POST /api/products` |
| **PUT** | Replace a resource entirely | Yes | Yes | (not used; we prefer PATCH) |
| **PATCH** | Partial update | No* | Yes | `PATCH /api/products/:id` |
| **DELETE** | Remove a resource | Yes | Sometimes | `DELETE /api/products/:id` |

*"Idempotent" = calling it repeatedly has the same effect as calling it once.

## Status codes you must know for APIs
### 2xx — Success
- **200 OK** — request succeeded (GET, login, update).
- **201 Created** — a new resource was created (register, create product).
- **204 No Content** — success but nothing to return (some deletes).

### 3xx — Redirection
- **301 Moved Permanently**, **302 Found**, **304 Not Modified** (cache).

### 4xx — Client error (the caller did something wrong)
- **400 Bad Request** — validation failed / malformed input. (Our `ValidationPipe` returns this.)
- **401 Unauthorized** — not authenticated (missing/invalid JWT). *"Who are you?"*
- **403 Forbidden** — authenticated but not allowed (a `user` hitting an admin route). *"I know you, but no."*
- **404 Not Found** — resource doesn't exist (bad product id).
- **409 Conflict** — conflicts with current state (registering a duplicate email).
- **422 Unprocessable Entity** — semantically invalid (alternative to 400 in some APIs).
- **429 Too Many Requests** — rate limited.

### 5xx — Server error (our fault)
- **500 Internal Server Error** — unhandled exception. Our global filter returns a safe 500.
- **502 / 503 / 504** — bad gateway / service unavailable / gateway timeout.

## 401 vs 403 (the classic interview question)
- **401** = authentication problem → log in / send a valid token.
- **403** = authorization problem → you're logged in, but your role can't do this.

## Verified in this project
| Scenario | Expected | Result |
|----------|----------|--------|
| Login OK | 200 | ✅ |
| Register new user | 201 | ✅ |
| Wrong password | 401 | ✅ |
| Create product without token | 401 | ✅ |
| `user` role creating a product | 403 | ✅ |
| Get non-existent product | 404 | ✅ |
| Create product with no price | 400 (validation) | ✅ |

## Postman tips
- Create a **Collection** per project and an **Environment** with a `{{baseUrl}}` and `{{token}}` variable.
- After login, use a **Test script** to auto-save the token:
  ```js
  pm.environment.set("token", pm.response.json().data.accessToken);
  ```
- Then set Authorization → Bearer Token → `{{token}}` on protected requests.
- For file upload requests use **Body → form-data**, set the field type to **File**.
