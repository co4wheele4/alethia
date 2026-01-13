# Testing Guide

This guide outlines the testing strategy and best practices for the Aletheia frontend.

## Testing Stack

We follow industry-standard testing practices:

- **Jest** → Test runner (fast, reliable, well-integrated with Next.js)
- **React Testing Library** → Component and integration tests
- **MSW (Mock Service Worker)** → API mocking
- **Playwright** → E2E tests

## Testing Philosophy

### ✅ DO

1. **Query by role, label, or text**
   ```tsx
   // ✅ Good
   screen.getByRole('button', { name: /login/i })
   screen.getByLabelText('Email')
   screen.getByText('Welcome')
   
   // ❌ Bad
   screen.getByClassName('login-button')
   ```

2. **Test user interactions**
   ```tsx
   // ✅ Good - tests what user sees and does
   fireEvent.click(loginButton)
   await waitFor(() => {
     expect(screen.getByText('Welcome')).toBeInTheDocument()
   })
   ```

3. **Assert visible outcomes**
   ```tsx
   // ✅ Good - tests user-visible behavior
   expect(screen.getByRole('alert')).toHaveTextContent(/error/i)
   expect(screen.queryByText('Loading')).not.toBeInTheDocument()
   ```

4. **Use MSW for API mocking**
   ```tsx
   // ✅ Good - realistic API mocking
   import { server } from '../mocks/server'
   server.use(
     graphql.mutation('Login', () => {
       return HttpResponse.json({ data: { login: 'token' } })
     })
   )
   ```

### ❌ DON'T

1. **Don't query by class names**
   ```tsx
   // ❌ Bad
   screen.getByClassName('MuiButton-root')
   ```

2. **Don't test implementation details**
   ```tsx
   // ❌ Bad - tests internal state
   expect(component.state.isLoading).toBe(true)
   
   // ✅ Good - tests visible outcome
   expect(screen.getByText('Loading...')).toBeInTheDocument()
   ```

3. **Don't mock React internals**
   ```tsx
   // ❌ Bad
   jest.mock('react', () => ({ ... }))
   ```

4. **Don't overuse snapshots**
   ```tsx
   // ❌ Bad - snapshots break easily and don't test behavior
   expect(component).toMatchSnapshot()
   ```

## Test Structure

### Unit Tests
Test individual functions, utilities, and hooks in isolation.

**Location**: `app/__tests__/lib/`, `app/__tests__/hooks/`

**Example**:
```tsx
describe('validatePassword', () => {
  it('should return false for passwords shorter than 8 characters', () => {
    const result = validatePassword('short');
    expect(result.isValid).toBe(false);
  });
});
```

### Component Tests
Test React components in isolation with React Testing Library.

**Location**: `app/__tests__/components/`

**Example**:
```tsx
describe('LoginForm', () => {
  it('should display error message on invalid login', async () => {
    render(<LoginForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i);
    });
  });
});
```

### Integration Tests
Test interactions between multiple components or modules.

**Location**: `app/__tests__/integration/`

**Example**:
```tsx
describe('Authentication Flow', () => {
  it('should complete login flow successfully', async () => {
    render(<LoginForm />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert navigation
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

### E2E Tests
Test complete user flows in a real browser environment.

**Location**: `e2e/`

**Example**:
```tsx
test('should complete login and navigate to dashboard', async ({ page }) => {
  await page.goto('/');
  
  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByLabel(/^password$/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  
  await expect(page).toHaveURL(/\/dashboard/);
});
```

## MSW (Mock Service Worker)

MSW intercepts network requests at the service worker level, providing realistic API mocking.

### Setup

Handlers are defined in `app/__tests__/mocks/handlers.ts` and automatically loaded in `jest.setup.js`.

### Usage in Tests

```tsx
import { server } from '../mocks/server'
import { graphql, HttpResponse } from 'msw'

test('handles API error', async () => {
  // Override default handler for this test
  server.use(
    graphql.mutation('Login', () => {
      return HttpResponse.json(
        { errors: [{ message: 'Network error' }] },
        { status: 500 }
      )
    })
  )
  
  // Your test code
})
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

## Coverage Goals

We aim for:
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

Current coverage is tracked in `jest.config.js` with thresholds.

## Best Practices Checklist

- [ ] Query by role, label, or text (not class names)
- [ ] Test user interactions, not implementation details
- [ ] Use MSW for API mocking
- [ ] Assert visible outcomes
- [ ] Keep tests independent and isolated
- [ ] Use descriptive test names
- [ ] Clean up after tests (mocks, timers, etc.)
- [ ] Use `waitFor` for async operations
- [ ] Test error cases and edge cases
- [ ] Write E2E tests for critical user flows

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [MSW Docs](https://mswjs.io/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
