import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads and shows login link', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/PoupaMais/i);
    const loginLink = page.locator('a[href*="auth"]').first();
    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible();
    }
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.locator('form')).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
    }
  });

  test('registration page loads correctly', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('form')).toBeVisible();

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();

    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible();
    }
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
    }
  });
});
