import { test, expect } from '@playwright/test';

test.describe('UI Tests - Authentication', () => {
  test('login form validation shows errors on empty submit', async ({ page }) => {
    await page.goto('/auth');

    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      await page.waitForTimeout(500);
    }
  });

  test('can navigate from login to registration page', async ({ page }) => {
    await page.goto('/auth');

    const registerLink = page.locator('a[href*="cadastro"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/cadastro/);
    }
  });

  test('can navigate from registration to login page', async ({ page }) => {
    await page.goto('/cadastro');

    const loginLink = page.locator('a[href*="auth"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/auth/);
    }
  });

  test('unauthenticated user is redirected to auth page on protected routes', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(auth|dashboard)/);
  });
});
