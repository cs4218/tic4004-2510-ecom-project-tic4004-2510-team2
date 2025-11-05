import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  // test.beforeEach(async ({ page }) => {
  //   await page.addInitScript(() => localStorage.clear());
  // });

  test('registers successfully', async ({ page }) => {
    // stub backend
    await page.route('**/api/v1/auth/register', async route => {
      const payload = await route.request().postDataJSON();
      expect(payload).toEqual(expect.objectContaining({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '123',
        address: '123 Test St',
        answer: 'Test Answer',
      }));

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Registered',
          user: { name: payload.name, email: payload.email, role: 0 },
        }),
      });
    });

    // go to register page
    await page.goto('http://localhost:3000/register/');

    // fill and submit register form
    await page.getByRole('textbox', { name: /name/i }).fill('New User');
    await page.getByRole('textbox', { name: /email/i }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('password123');
    await page.getByRole('textbox', { name: /phone/i }).fill('123');
    await page.getByRole('textbox', { name: /address/i }).fill('123 Test St');
    await page.locator('input[type="date"]').fill('1990-01-01');
    await page.getByRole('textbox', { name: /Favorite sports/i }).fill('Test Answer');
    await page.getByRole('button', { name: /register/i }).click();

    // assert post-registration UI
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByText(/Register Successfully, please login/i)).toBeVisible();
  });

  test('registers with existing email', async ({ page }) => {
    // stub backend
    await page.route('**/api/v1/auth/register', async route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Already registered, please login',
        }),
      });
    });

    // go to register page
    await page.goto('http://localhost:3000/register/');

    // fill and submit register form
    await page.getByRole('textbox', { name: /name/i }).fill('Existing User');
    await page.getByRole('textbox', { name: /email/i }).fill('existinguser@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('password123');
    await page.getByRole('textbox', { name: /phone/i }).fill('123');
    await page.getByRole('textbox', { name: /address/i }).fill('123 Test St');
    await page.locator('input[type="date"]').fill('1990-01-01');
    await page.getByRole('textbox', { name: /Favorite sports/i }).fill('Test Answer');
    await page.getByRole('button', { name: /register/i }).click();

    // assert error toast
    await expect(page.getByText(/Already registered, please login/i)).toBeVisible();
  });
});