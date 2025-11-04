import { test, expect } from '@playwright/test';
import {mockCart, mockCategory, mockLogin, mockProductCount, mockProductList, mockProductPhoto} from "./setupMock.js";

test('Given products when navigate to homepage should display products', async ({ page }) => {
  await mockProductPhoto(page);
  await mockProductList(page);
  await mockCategory(page);
  await mockProductCount(page);

  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(2);
  await expectProductCard(page, 'Mock Phone', 54.99, 'Mock Phone Description');
  await expectProductCard(page, 'Mock Laptop', 79.5, 'Mock Laptop Description');
});

test('Given a logged in user When add cart Then cart should be updated with correct items and amount', async ({ page }) => {
  const loginUrl = 'http://localhost:3000/login';
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
      role: 0,
    },
    token: 'someToken',
  };

  await mockLogin(page, mockLoginResponse);
  await mockProductPhoto(page);
  await mockProductList(page);
  await mockCategory(page);
  await mockProductCount(page);

  await page.goto(loginUrl);
  await page.getByPlaceholder('Enter Your Email').fill(loginCreds.email);
  await page.getByPlaceholder('Enter Your Password').fill(loginCreds.password);

  const [resp] = await Promise.all([
    page.waitForResponse('**/auth/login'),
    page.getByRole('button', { name: 'login' }).click(),
  ]);
  expect(resp.ok()).toBeTruthy();

  await expect(page).toHaveURL('http://localhost:3000/');
  expect(await page.evaluate(() => localStorage.getItem('auth'))).toBeTruthy();

  const addToCartButtons = page.getByRole('button', { name: 'ADD TO CART' });
  await expect(addToCartButtons).toHaveCount(2);
  await addToCartButtons.nth(0).click();
  await addToCartButtons.nth(1).click();

  await page.goto('http://localhost:3000/cart');

  const cartSummary = page.locator('.cart-summary');
  await expect(cartSummary).toBeVisible();
  await expect(cartSummary.getByText('Total : $134.49', { exact: false })).toBeVisible();
  await expect(cartSummary.getByRole('heading', { level: 5, name: 'test@gmail.com' })).toBeVisible();

  const cartItems = page.locator('.col-md-7 .row.card.flex-row');
  await expect(cartItems).toHaveCount(2);
  await expect(cartItems.nth(0)).toContainText('Mock Phone');
  await expect(cartItems.nth(1)).toContainText('Mock Laptop');
});

test('Given a logged in user has items in cart When remove item Then cart should be updated with correct items and amount', async ({ page }) => {
  const loginUrl = 'http://localhost:3000/login';
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
      role: 0,
    },
    token: 'someToken',
  };

  await mockLogin(page, mockLoginResponse);
  await mockProductPhoto(page);
  await mockProductList(page);
  await mockCategory(page);
  await mockProductCount(page);

  await page.goto(loginUrl);
  await page.getByPlaceholder('Enter Your Email').fill(loginCreds.email);
  await page.getByPlaceholder('Enter Your Password').fill(loginCreds.password);

  await Promise.all([
    page.waitForResponse('**/auth/login'),
    page.getByRole('button', { name: 'login' }).click(),
  ]);
  await expect(page).toHaveURL('http://localhost:3000/');

  await mockCart(page);
  await page.goto('http://localhost:3000/cart');

  const removeButtons = page.getByRole('button', { name: 'remove' });
  await expect(removeButtons).toHaveCount(2);
  await removeButtons.nth(0).click();

  const cartItems = page.locator('.col-md-7 .row.card.flex-row');
  await expect(cartItems).toHaveCount(1);
  await expect(cartItems.nth(0)).toContainText('Mock Laptop');

  const cartSummary = page.locator('.cart-summary');
  await expect(cartSummary.getByText('Total : $79.50', { exact: false })).toBeVisible();

  const storedCart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart')));
  expect(storedCart).toHaveLength(1);
  expect(storedCart[0].name).toBe('Mock Laptop');
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
