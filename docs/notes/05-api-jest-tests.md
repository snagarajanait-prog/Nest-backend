# API Unit Testing with Jest

This project uses Jest for unit tests and Nest's testing utilities to test API controllers.

## What is covered

The following controller test files are defined:

- `src/app.controller.spec.ts`
- `src/modules/auth/auth.controller.spec.ts`
- `src/modules/products/products.controller.spec.ts`
- `src/modules/mail/mail.controller.spec.ts`

Each file tests one controller and focuses on the controller behavior, not the full application stack.

## How these tests work

### 1. Nest testing module setup

Each controller test creates a minimal `TestingModule`:

- imports the controller under test
- provides mocked versions of the controller dependencies

Example from `MailController`:

```ts
const module: TestingModule = await Test.createTestingModule({
  controllers: [MailController],
  providers: [
    { provide: MailService, useValue: mockMailService },
    { provide: MailQueueService, useValue: mockMailQueueService },
  ],
}).compile();
```

This isolates the controller from real services, so tests stay fast and deterministic.

### 2. Mocking service methods

Each controller dependency is replaced with a plain object whose methods are Jest mock functions:

```ts
const mockMailService = {
  sendTemplate: jest.fn(),
};
```

The test sets return values for these mock methods, then verifies the controller returns the expected response.

### 3. Testing controller methods

Controller tests call the controller methods directly, using DTO objects for input.

Example:

```ts
const response = await controller.test(dto);
expect(response).toEqual({
  success: true,
  message: 'Email sent successfully',
  data: { messageId: 'id', previewUrl: false, transport: 'json' },
});
```

This checks the controller:

- picks the correct status and message
- delegates work to the right service method
- returns the expected shape

### 4. Verifying service calls

After calling the controller method, the tests also verify that the dependency mocks were called with the correct data:

```ts
expect(mockMailService.sendTemplate).toHaveBeenCalled();
```

That ensures the controller is wired to the service properly.

## What each controller test covers

### `AppController`

- tests the health endpoint via `getHealth()`
- verifies the response contains `status: 'ok'` and the correct service name

### `AuthController`

- tests `register()` returns the expected success payload
- tests `login()` returns the expected success payload
- tests `getProfile()` returns the current user payload

### `ProductsController`

- tests `create()` returns the product create payload
- tests `findAll()` returns the paginated product list payload
- tests `findOne()` returns a product payload
- tests `update()` returns the updated product payload
- tests `uploadSingle()` returns the updated product payload after image upload
- tests `remove()` returns the deleted product response

### `MailController`

- tests `test()` sends a mail template and returns email result data
- tests `queue()` enqueues a mail job and returns a queue response

## How to run the tests

Use the existing Jest script:

```bash
npm test
```

To run a single file, use:

```bash
npx jest src/modules/auth/auth.controller.spec.ts
```

## Why this is a good pattern

- Each API has its own test file, so failure points are easy to locate.
- Controllers are tested without starting the full HTTP server.
- Service dependencies are mocked, so tests do not need a database, SMTP server, or Redis.
- The test files document how each controller should behave.

## Next improvements

You can extend this coverage by adding:

- `*.service.spec.ts` tests for service business logic
- negative tests for error conditions
- integration tests for full request/response flows
- tests for guards and decorators if needed
