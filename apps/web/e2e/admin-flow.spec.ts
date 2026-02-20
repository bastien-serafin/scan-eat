import { test, expect } from '@playwright/test';

test('admin happy path: login -> orders board', async ({ page }) => {
  await page.route('**/admin/auth/login', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'fake_jwt',
        admin: { establishmentId: 'e1', email: 'admin@scan-eat.local' },
      }),
    });
  });

  await page.route('**/admin/orders?establishmentId=e1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'order_1',
          establishmentId: 'e1',
          tableId: 't1',
          status: 'NOUVELLE',
          total: 900,
          seen: false,
          createdAt: new Date().toISOString(),
          table: { id: 't1', label: 'Table 1' },
          items: [
            {
              id: 'i1',
              qty: 1,
              unitPrice: 900,
              chosenOptions: {},
              product: { id: 'p1', name: 'Soupe' },
            },
          ],
        },
      ]),
    });
  });

  await page.goto('/admin/login');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/admin/orders');
  await expect(page.getByText('Dashboard commandes')).toBeVisible();
  await expect(page.getByText('#rder_1')).toBeVisible();
});
