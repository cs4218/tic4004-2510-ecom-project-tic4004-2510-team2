import { test, expect } from '@playwright/test';

test('Normal user is redirected when accessing admin pages', async ({ page }) => {
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

  // go to login page and submit login form
  await page.goto('http://localhost:3000/login/');
  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();

  // assert post-login UI
  await expect(page).toHaveURL('http://localhost:3000/');
  await expect(page.getByRole('button', { name: /test user/i })).toHaveText(/test user/i);

  // try to access admin dashboard directly
  await page.goto('http://localhost:3000/dashboard/admin');

  // normal users should not see the admin panel
  await expect(page).not.toHaveURL(/.*dashboard\/admin/);

  // confirm they get redirected to login page
  await expect(page).toHaveURL('http://localhost:3000/login');

  // verify page content
  await expect(page.getByText(/Admin Panel/i)).not.toBeVisible();
});