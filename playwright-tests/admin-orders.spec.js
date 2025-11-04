import { test, expect} from '@playwright/test';

async function loginAsAdmin(page) {
  await page.addInitScript(() => {
    const auth = {
      token: 'jwt.admin.token',
      user: { name: 'Admin User', email: 'admin@example.com', role: 1 },
    };
    localStorage.setItem('auth', JSON.stringify(auth));
  });
}

const seedOrders = () => ([
  {
    _id: 'order001',
    status: 'Not Process',
    buyer: { name: 'Alice' },
    createAt: new Date().toISOString(),
    payment: { success: true },
    products: [
      { _id: 'p1', name: 'Product 1', description: 'Description for Product 1', price: 100 },
      { _id: 'p1', name: 'Product 1', description: 'Description for Product 1', price: 100 }
    ],
  },
  {
    _id: 'order002',
    status: 'Processing',
    buyer: { name: 'Bob' },
    createAt: new Date().toISOString(),
    payment: { success: false },
    products: [
      { _id: 'p2', name: 'Product 2', description: 'Description for Product 2', price: 50 }
    ],
  },
]);

test.describe('Admin processes an order', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    await page.route('**/api/v1/auth/**', route => {
      const url = route.request().url();
      if (url.endsWith('/all-orders')) return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: { role: 1 } }),
      });
    });
  });

  test('loads orders and shows table', async ({ page }) => {
    await page.route('**/api/v1/auth/all-orders', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedOrders()),
      });
    });

    await page.goto('/dashboard/admin/orders');

    await expect(page.getByRole('heading', { name: /all orders/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '#' })).toHaveCount(2);
    await expect(page.getByRole('columnheader', { name: /status/i })).toHaveCount(2);
    await expect(page.getByRole('columnheader', { name: /buyer/i })).toHaveCount(2);
    await expect(page.getByRole('columnheader', { name: /payment/i })).toHaveCount(2);
    await expect(page.getByRole('columnheader', { name: /quantity/i })).toHaveCount(2);

    // check both orders are shown
    await expect(page.getByRole('cell', { name: /alice/i })).toBeVisible();
    await expect(page.getByRole('cell', { name: /bob/i })).toBeVisible();

    // check each order's status
    await expect(page.getByRole('row', { name: /alice/i })).toContainText(/Not Process/i);
    await expect(page.getByRole('row', { name: /bob/i })).toContainText(/Processing/i);

    // check each order's quantity
    await expect(page.getByRole('row', { name: /alice/i })).toContainText('2');
    await expect(page.getByRole('row', { name: /bob/i })).toContainText('1');
  });

  test('changes order status', async ({ page }) => {
    await page.route('**/api/v1/auth/all-orders', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedOrders()),
      });
    });

    await page.goto('/dashboard/admin/orders');

    const statusCell = page.locator('tbody > tr').first().locator('td').nth(1);
    await expect(statusCell).toContainText('Not Process');
    await statusCell.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(statusCell).toContainText('Processing');
  });

});
