import { test, expect} from '@playwright/test';

test.describe('User Logout', () => {
  // test.beforeEach(async ({ page }) => {
  //   await page.addInitScript(() => localStorage.clear());
  // });

  test('clears session and UI on logout', async ({ page }) => {
    // stub login state
    await page.addInitScript(() => {
      const auth = {
        token: 'jwt.fake.token',
        user: { name: 'Test User', email: 'test@example.com', role: 0 }
      };
      localStorage.setItem('auth', JSON.stringify(auth));
    });

    // go to home page and assert logged-in username
    await page.goto('http://localhost:3000/');
    await expect(page.getByRole('button', { name: /test user/i })).toHaveText(/test user/i);

  // click logout: open dropdown, wait for logout link to be visible, then click
  await page.getByRole('button', { name: /test user/i }).click();
  const logout = page.getByRole('link', { name: /logout/i });
  await expect(logout).toBeVisible();
  await logout.click();

    // assert logged-out UI
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();

    // assert localStorage cleared
    const authAfter = await page.evaluate(() => localStorage.getItem('auth'));
    expect(authAfter).toBeNull();
  });
});
