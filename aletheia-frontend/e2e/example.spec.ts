import { test, expect } from '@playwright/test';

/**
 * Example E2E test using Playwright
 * 
 * Best practices demonstrated:
 * - Query by role, label, or text (not class names)
 * - Test user interactions and visible outcomes
 * - Use descriptive test names
 * - Keep tests focused on user flows
 */

test.describe('Home Page', () => {
  test('should display login form for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Query by role and label (best practice)
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByLabel(/^password$/i);
    const loginButton = page.getByRole('button', { name: /login/i });
    
    // Assert visible outcomes
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should show error message on invalid login', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@example.com');
    await page.getByLabel(/^password$/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Assert error message appears (query by role: alert)
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/invalid email or password/i);
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    await page.goto('/');
    
    // Fill in valid credentials (using MSW mock)
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for navigation and assert dashboard is visible
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});

test.describe('Form Validation', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: /login/i }).click();
    
    // Assert validation error appears
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/email is required/i);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid email
    await page.getByRole('textbox', { name: /email/i }).fill('invalid-email');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Assert email validation error
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/valid email/i);
  });
});
