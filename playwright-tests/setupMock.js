const cart = [
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
];

export async function mockProductPhoto(page) {
    await page.route('**/api/v1/product/product-photo/**', route => {
        route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: '',
        });
    });
}

export async function mockProductList(page) {
    await page.route('**/api/v1/product/product-list/**', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                products: cart,
            }),
        });
    });
}

export async function mockCategory(page) {
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
                        __v: 0,
                    },
                ],
            }),
        });
    });
}

export async function mockProductCount(page) {
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
}

export async function mockLogin(page, mockResponse) {
    await page.route('**/api/v1/auth/login', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
        });
    });
}

export async function mockCart(page) {
    await page.addInitScript(value => {
        window.localStorage.setItem('cart', JSON.stringify(value));
    }, cart);
}

