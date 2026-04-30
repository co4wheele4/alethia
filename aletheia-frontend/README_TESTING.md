# Testing Setup Summary

## ✅ Industry-Standard Testing Stack Implemented

Your Aletheia frontend now uses the recommended testing stack:

### 1. **Vitest** - Test Runner ✅
- Fast, near-instant startup via Vite
- Jest-compatible API
- Native ESM support
- Built-in mocking and coverage

### 2. **React Testing Library** - Component/Integration Tests ✅
- Tests user-visible behavior
- Queries by role, label, and text (best practices)
- Avoids testing implementation details

### 3. **MSW (Mock Service Worker)** - API Mocking ✅
- Realistic API mocking at the network level
- No need to modify application code
- Handlers defined in `app/lib/test-utils/handlers.ts`
- Automatically loaded in all tests via `vitest.setup.ts`

### 4. **Playwright** - End-to-End Tests ✅
- Cross-browser testing (Chromium, Firefox, WebKit)
- Real browser environment
- Example tests in `e2e/example.spec.ts`

## Quick Start

### Run Tests
```bash
# Unit/Integration tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e

# E2E UI mode (interactive)
npm run test:e2e:ui
```

## Best Practices Followed

✅ **Query by role, label, text** (not class names)
```tsx
screen.getByRole('button', { name: /login/i })
screen.getByLabelText('Email')
```

✅ **Test user interactions**
```tsx
await userEvent.click(loginButton)
await waitFor(() => {
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})
```

✅ **Assert visible outcomes**
```tsx
expect(screen.getByRole('alert')).toHaveTextContent(/error/i)
```

✅ **Use MSW for API mocking**
```tsx
server.use(
  graphql.mutation('Login', () => {
    return HttpResponse.json({ data: { login: 'token' } })
  })
)
```

## Files Created

- `app/lib/test-utils/handlers.ts` - MSW request handlers
- `app/lib/test-utils/server.ts` - MSW server setup for Vitest
- `app/lib/test-utils/browser.ts` - MSW worker setup for browser
- `playwright.config.ts` - Playwright configuration
- `e2e/example.spec.ts` - Example E2E tests
- `TESTING_GUIDE.md` - Comprehensive testing guide

## Notes

- **Playwright webServer stability**: `playwright.config.ts` runs `npm run build && npm run start` (production server) and uses `http://127.0.0.1:3030` to avoid Windows `localhost`/IPv6 flakiness. Playwright E2E uses `page.route` interception for `/graphql`, so the browser MSW worker is disabled for E2E runs.

## Next Steps

1. **Migrate existing tests to use MSW** (optional)
   - Replace manual Apollo Client mocks with MSW handlers
   - See `app/features/auth/__tests__/LoginForm-msw.test.tsx` for example

2. **Add more E2E tests**
   - Critical user flows
   - Cross-browser compatibility
   - Mobile viewports

## Documentation

See `TESTING_GUIDE.md` for detailed testing practices and examples.
