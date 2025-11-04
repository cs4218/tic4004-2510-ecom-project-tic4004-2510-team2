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

const seedProducts = () => ({
  success: true,
  countTotal: 2,
  message: 'AllProducts',
  products: [
    {
      _id: '66db427fdb0119d9234b27f1',
      name: 'product001',
      slug: 'product001',
      description: 'description for product001',
      price: 79.99,
      category: { _id: '66db427fdb0119d9234b27ef', name: 'Book', slug: 'book' },
      quantity: 50,
      shipping: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
    },
    {
      _id: '66db427fdb0119d9234b27f5',
      name: 'product002',
      slug: 'product002',
      description: 'description for product002',
      price: 999.99,
      category: { _id: '66db427fdb0119d9234b27ed', name: 'Electronics', slug: 'electronics' },
      quantity: 30,
      shipping: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
    },
  ],
});

const seedCategories = () => ({
  success: true,
  message: 'All categories listed',
  category: [
    { _id: '66db427fdb0119d9234b27ed', name: 'Electronics', slug: 'electronics' },
    { _id: '66db427fdb0119d9234b27ef', name: 'Book', slug: 'book' }
  ],
});

test.describe('product page loads products', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    // Mock Auth routes
    await page.route('**/api/v1/auth/**', route => {
      const url = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: { role: 1 } }),
      });
    });

    // Mock categories
    await page.route('**/api/v1/category/get-category', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedCategories()),
      });
    });

    // Mock products
    await page.route('**/api/v1/product/get-product', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedProducts()),
      });
    });

    // Mock product photos
    await page.route('**/api/v1/product/product-photo/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: '',
      });
    });
  });

  test('loads products and show table', async ({ page }) => {
    await page.goto('/dashboard/admin/products');

    // Confirm title is visible
    await expect(page.getByRole('heading', { name: 'All Products List' })).toBeVisible();

    // Check products count
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(2);

    // Verify product names by description
    await expect(page.getByText('description for product001')).toBeVisible();
    await expect(page.getByText('description for product002')).toBeVisible();
  });
  
  test('clicking a product navigates to update page', async ({ page }) => {
    await page.goto('/dashboard/admin/products');
    await page.click('.product-link:first-child');
    await expect(page).toHaveURL(/\/dashboard\/admin\/product\/product001$/);
  });
});
