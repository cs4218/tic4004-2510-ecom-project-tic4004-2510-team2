import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('logs in successfully and persists after refresh', async ({ page }) => {
    // stub backend
    await page.route('**/api/v1/auth/login', async route => {
      const body = await route.request().postDataJSON();
      expect(body).toEqual(expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
      }));

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Login successful',
          token: 'jwt.fake.token',
          user: { name: 'Test User', email: body.email, role: 0 },
        }),
      });
    });

    // go to login page
    await page.goto('http://localhost:3000/login/');

    // fill and submit login form
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    // assert post-login UI
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('button', { name: /test user/i })).toHaveText(/test user/i);

    // auth persists after refresh
    await page.reload();
    await expect(page.getByRole('button', { name: /test user/i })).toHaveText(/test user/i);
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid Password'
        }),
      });
    });

    // go to login page
    await page.goto('http://localhost:3000/login');

    // fill and submit login form
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();

  // assert error message (app renders an alert)
    await expect(page.getByTestId('alert-error')).toHaveText(/invalid password/i);
    await expect(page).toHaveURL(/\/login$/);
  });
});