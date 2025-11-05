import { test, expect } from '@playwright/test';

async function loginAsAdmin(page) {
  await page.addInitScript(() => {
    const auth = {
      token: 'jwt.admin.token',
      user: { name: 'Admin User', email: 'admin@example.com', role: 1 },
    };
    localStorage.setItem('auth', JSON.stringify(auth));
  });
}

const seedCategories = () => ({
  success: true,
  message: 'All categories listed',
  category: [
    { _id: '66db427fdb0119d9234b27ed', name: 'Electronics', slug: 'electronics' },
    { _id: '66db427fdb0119d9234b27ef', name: 'Book', slug: 'book' },
  ],
});

const seedSingleProduct = () => ({
  success: true,
  message: 'Single product fetched',
  product: {
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
  },
});

test.describe('Update Product Page', () => {
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


    // Mock category API
    await page.route('**/api/v1/category/get-category', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedCategories()),
      });
    });

    // Mock single product API
    await page.route('**/api/v1/product/get-product/product001', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(seedSingleProduct()),
      });
    });

    // Mock product photos
    await page.route('**/api/v1/product/product-photo/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: '',
      });
    });

    // Mock delete product API
    await page.route('**/api/v1/product/delete-product/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Product deleted successfully',
        }),
      });
    });
  });
  test('loads product details and categories', async ({ page }) => {
    await page.goto('/dashboard/admin/product/product001');
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    await expect(page.locator('input[placeholder="write a name"]')).toHaveValue('product001');
    await expect(page.locator('textarea[placeholder="write a description"]')).toHaveValue('description for product001');
  });

  test('updates product successfully', async ({ page }) => {
    await page.route('**/api/v1/product/update-product/**', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Product updated successfully',
          products: {
            _id: '66db427fdb0119d9234b27f1',
            name: 'product001 updated',
          },
        }),
      });
    });
    await page.goto('/dashboard/admin/product/product001');
    await page.fill('input[placeholder="write a name"]', 'product001 updated');
    await page.click('button:has-text("UPDATE PRODUCT")');
    await expect(page.getByText('Product updated successfully')).toBeVisible();
  });

  test('updates product failed with `Price is empty`', async ({ page }) => {
    await page.route('**/api/v1/product/update-product/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Price is required' }),
      });
    });
    await page.goto('/dashboard/admin/product/product001');
    const priceInput = page.locator('input[placeholder="write a price"]');
    await priceInput.fill('');
    await expect(priceInput).toBeVisible();
    await page.click('button:has-text("UPDATE PRODUCT")');
    await expect(page.getByText('Price is required')).toBeVisible();
  });

  test('updates product failed with `Name is empty`', async ({ page }) => {
    await page.route('**/api/v1/product/update-product/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Name is required' }),
      });
    });
    await page.goto('/dashboard/admin/product/product001');
    const nameInput = page.locator('input[placeholder="write a name"]');
    await nameInput.fill('');
    await expect(nameInput).toBeVisible();
    await page.click('button:has-text("UPDATE PRODUCT")');
    await expect(page.getByText('Name is required')).toBeVisible();
  });

  test('updates product failed with `Description is empty`', async ({ page }) => {
    await page.route('**/api/v1/product/update-product/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Description is required' }),
      });
    });
    await page.goto('/dashboard/admin/product/product001');
    const descriptionInput = page.locator('textarea[placeholder="write a description"]');
    await descriptionInput.fill('');
    await expect(descriptionInput).toBeVisible();
    await page.click('button:has-text("UPDATE PRODUCT")');
    await expect(page.getByText('Description is required')).toBeVisible();
  });

  test('updates product failed with `Quantity is empty`', async ({ page }) => {
    await page.route('**/api/v1/product/update-product/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Quantity is required' }),
      });
    });
    await page.goto('/dashboard/admin/product/product001');
    const quantityInput = page.locator('input[placeholder="write a quantity"]');
    await quantityInput.fill('');
    await expect(quantityInput).toBeVisible();
    await page.click('button:has-text("UPDATE PRODUCT")');
    await expect(page.getByText('Quantity is required')).toBeVisible();
  });

  test('deletes product successfully', async ({ page }) => {
    await page.goto('/dashboard/admin/product/product001');
    page.once('dialog', (dialog) => dialog.accept('YES'));
    await page.click('button:has-text("DELETE PRODUCT")');
    await expect(page.getByText('Product deleted successfully')).toBeVisible();
  });

  test('deletes product failed when API returns error', async ({ page }) => {
    await page.route('**/api/v1/product/delete-product/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to delete product' }),
      });
    });
    await page.goto('/dashboard/admin/product/product001');
    page.once('dialog', (dialog) => dialog.accept('YES'));
    await page.click('button:has-text("DELETE PRODUCT")');
    await expect(page.getByText('Failed to delete product')).toBeVisible();
  });
});
