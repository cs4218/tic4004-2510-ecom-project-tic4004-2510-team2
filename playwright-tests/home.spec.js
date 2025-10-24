import { test, expect } from '@playwright/test';

// Just to test playwright works.
test.describe('Home page', () => {
  test('should load and show the All Products header', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root');

    const heading = page.getByRole('heading', { name: /All Products/i, level: 1 });
    await expect(heading).toBeVisible();
  });
});
