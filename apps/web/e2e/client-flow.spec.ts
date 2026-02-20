import { test, expect } from '@playwright/test';

test('client happy path: menu -> panier -> commande', async ({ page }) => {
  await page.route('**/public/establishments/le-bistrot-demo/menu**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        establishment: { id: 'e1', name: 'Le Bistrot Demo', slug: 'le-bistrot-demo', timezone: 'Europe/Paris' },
        table: { id: 't1', label: 'Table 1' },
        categories: [
          {
            id: 'c1',
            name: 'Plats',
            sortOrder: 1,
            products: [
              {
                id: 'p1',
                name: 'Burger maison',
                description: 'Test',
                price: 1200,
                isActive: true,
                kind: 'MEAT',
                optionGroups: [
                  { id: 'g1', name: 'Retirer ingrédients', type: 'REMOVE_INGREDIENTS', rules: { options: ['Oignons'] } },
                  { id: 'g2', name: 'Cuisson', type: 'COOKING', rules: { options: ['A point'] } },
                ],
              },
            ],
          },
        ],
      }),
    });
  });

  await page.route('**/public/establishments/le-bistrot-demo/orders', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'order_123',
        establishmentId: 'e1',
        tableId: 't1',
        status: 'NOUVELLE',
        total: 1200,
        seen: false,
        createdAt: new Date().toISOString(),
        table: { id: 't1', label: 'Table 1' },
        items: [],
      }),
    });
  });

  await page.goto('/e/le-bistrot-demo?t=t1&sig=test&exp=4102444800000');
  await page.getByText('Burger maison').click();
  await page.getByRole('button', { name: /Ajouter/ }).click();
  await page.getByRole('button', { name: 'Valider commande' }).click();

  await expect(page).toHaveURL(/\/e\/le-bistrot-demo\/order\/order_123/);
});
