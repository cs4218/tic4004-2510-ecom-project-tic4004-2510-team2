import { test, expect } from '@playwright/test';

test('Given products when navigate to homepage should display products', async ({ page }) => {
  await page.route('**/api/v1/product/product-photo/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: '',
    });
  });

  await page.route('**/api/v1/product/product-list/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        products: [
          {
            _id: 'mock-id1',
            name: 'Mock Phone',
            description: 'Mock Phone Description',
            price: 54.99,
            category: 'mock-category',
            quantity: 10,
            shipping: true,
            slug: 'mock-phone',
            createdAt: '2024-09-06T17:57:19.992Z',
            updatedAt: '2024-09-06T17:57:19.992Z',
            __v: 0,
          },
          {
            _id: 'mock-id2',
            name: 'Mock Laptop',
            description: 'Mock Laptop Description',
            price: 79.5,
            category: 'mock-category',
            quantity: 20,
            shipping: true,
            slug: 'mock-laptop',
            createdAt: '2024-09-10T11:10:00.000Z',
            updatedAt: '2024-09-10T11:10:00.000Z',
            __v: 0,
          },
        ],
      }),
    });
  });

  await page.route('**/api/v1/category/get-category', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'All Categories List',
        category: [
          {
            _id: 'mock-category',
            name: 'Electronics',
            slug: 'Electronics',
            __v: 0
          }
        ]
      }),
    });
  });

  await page.route('**/api/v1/product/product-count', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        total: 2,
      }),
    });
  });

  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(2);
  await expectProductCard(page, 'Mock Phone', 54.99, 'Mock Phone Description');
  await expectProductCard(page, 'Mock Laptop', 79.5, 'Mock Laptop Description');
});

test('User add cart [WIP]', async ({ page }) => {
  const loginUrl = 'http://localhost:3000/login';
  const loginApiUrl = '**/auth/login';

  const loginCreds = { email: 'test@gmail.com', password: 'test@gmail.com' };
  const mockLoginResponse = {
    success: true,
    message: 'login successfully',
    user: {
      _id: 'someId',
      name: 'test@gmail.com',
      email: 'test@gmail.com',
      phone: 'test@gmail.com',
      address: 'test@gmail.com',
      role: 0
    },
    token: 'someToken'
  };

  await page.route(loginApiUrl, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLoginResponse),
    });
  });

  await page.goto(loginUrl);
  await page.getByPlaceholder('Enter Your Email').fill(loginCreds.email);
  await page.getByPlaceholder('Enter Your Password').fill(loginCreds.password);

  const [resp] = await Promise.all([
    page.waitForResponse(loginApiUrl),
    page.getByRole('button', { name: /^login$/i }).click(),
  ]);
  expect(resp.ok()).toBeTruthy();

  await expect(page).toHaveURL('http://localhost:3000/');
  const auth = await page.evaluate(() => localStorage.getItem('auth'));
  expect(auth).toBeTruthy();

  const addToCartButtons = page.getByRole('button', { name: 'ADD TO CART' });
  await expect(addToCartButtons).toHaveCount(2);

  await addToCartButtons.nth(0).click();
  await addToCartButtons.nth(1).click();

  await page.goto('http://localhost:3000/cart');

  const cartSummary = page.locator('.cart-summary');
  await expect(cartSummary).toBeVisible();
  await expect(cartSummary.getByText('Total : $69.98', { exact: false })).toBeVisible();
  await expect(cartSummary.getByRole('heading', { level: 5, name: 'test@gmail.com' })).toBeVisible();


  const cartItems = page.locator('.col-md-7 .row.card.flex-row');
  await expect(cartItems).toHaveCount(2);
  await expect(cartItems.nth(0)).toContainText('The Law of Contract in Singapore');
  await expect(cartItems.nth(1)).toContainText('Novel');
});



async function expectProductCard(page, name, price, description) {
  const card = page.locator('.card').filter({
    has: page.getByRole('heading', { name }),
  });

  await expect(card).toBeVisible();
  await expect(card.getByRole('img', { name })).toBeVisible();
  await expect(card.getByRole('heading', { name })).toBeVisible();
  await expect(card.getByText(description)).toBeVisible();
  await expect(card.locator('.card-price')).toHaveText('$' + price.toFixed(2).toString());

  await expect(card.getByRole('button', { name: 'more details' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'add to cart' })).toBeVisible();
}
