import { PrismaClient, ProductKind, ProductOptionGroupType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOptionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.locationTable.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.establishment.deleteMany();

  const establishment = await prisma.establishment.create({
    data: {
      name: 'Le Bistrot Demo',
      slug: 'le-bistrot-demo',
      timezone: 'Europe/Paris',
    },
  });

  const tables = await prisma.locationTable.createManyAndReturn({
    data: [
      { establishmentId: establishment.id, label: 'Table 1' },
      { establishmentId: establishment.id, label: 'Table 2' },
      { establishmentId: establishment.id, label: 'Chambre 101' },
    ],
  });

  const categories = await prisma.category.createManyAndReturn({
    data: [
      { establishmentId: establishment.id, name: 'Entrées', sortOrder: 1 },
      { establishmentId: establishment.id, name: 'Plats', sortOrder: 2 },
      { establishmentId: establishment.id, name: 'Boissons', sortOrder: 3 },
    ],
  });

  const [entrees, plats, boissons] = categories;

  const products = await prisma.product.createManyAndReturn({
    data: [
      { establishmentId: establishment.id, categoryId: entrees.id, name: 'Soupe du jour', description: 'Légumes de saison', price: 800, sortOrder: 1, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: entrees.id, name: 'Salade César', description: 'Poulet, parmesan, croûtons', price: 1100, sortOrder: 2, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: entrees.id, name: 'Bruschetta', description: 'Tomate, basilic, ail', price: 900, sortOrder: 3, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: entrees.id, name: 'Carpaccio', description: 'Boeuf, huile d\'olive, roquette', price: 1200, sortOrder: 4, isActive: true, kind: ProductKind.MEAT },
      { establishmentId: establishment.id, categoryId: entrees.id, name: 'Assiette mixte', description: 'Charcuterie et fromages', price: 1400, sortOrder: 5, isActive: true, kind: ProductKind.STANDARD },

      { establishmentId: establishment.id, categoryId: plats.id, name: 'Burger maison', description: 'Steak haché, cheddar, frites', price: 1700, sortOrder: 1, isActive: true, kind: ProductKind.MEAT },
      { establishmentId: establishment.id, categoryId: plats.id, name: 'Steak frites', description: 'Boeuf grillé, sauce au poivre', price: 2200, sortOrder: 2, isActive: true, kind: ProductKind.MEAT },
      { establishmentId: establishment.id, categoryId: plats.id, name: 'Pâtes pesto', description: 'Basilic, parmesan, pignons', price: 1500, sortOrder: 3, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: plats.id, name: 'Risotto champignons', description: 'Crème et parmesan', price: 1650, sortOrder: 4, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: plats.id, name: 'Tartare de boeuf', description: 'Préparation minute', price: 2100, sortOrder: 5, isActive: true, kind: ProductKind.MEAT },

      { establishmentId: establishment.id, categoryId: boissons.id, name: 'Eau minérale', description: '50cl', price: 300, sortOrder: 1, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: boissons.id, name: 'Soda', description: '33cl', price: 450, sortOrder: 2, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: boissons.id, name: 'Jus d\'orange', description: '25cl', price: 500, sortOrder: 3, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: boissons.id, name: 'Verre de vin', description: '12cl', price: 650, sortOrder: 4, isActive: true, kind: ProductKind.STANDARD },
      { establishmentId: establishment.id, categoryId: boissons.id, name: 'Bière pression', description: '25cl', price: 600, sortOrder: 5, isActive: true, kind: ProductKind.STANDARD }
    ]
  });

  const meatProducts = products.filter((p) => p.kind === ProductKind.MEAT);
  for (const p of products) {
    await prisma.productOptionGroup.create({
      data: {
        productId: p.id,
        name: 'Retirer ingrédients',
        type: ProductOptionGroupType.REMOVE_INGREDIENTS,
        rules: {
          options: ['Oignons', 'Tomates', 'Fromage', 'Sauce'],
          maxSelections: 4,
        },
      },
    });
  }

  for (const p of meatProducts) {
    await prisma.productOptionGroup.create({
      data: {
        productId: p.id,
        name: 'Cuisson',
        type: ProductOptionGroupType.COOKING,
        rules: {
          options: ['Bleu', 'Saignant', 'A point', 'Bien cuit'],
          required: true,
        },
      },
    });
  }

  const hash = await bcrypt.hash('admin1234', 10);
  await prisma.adminUser.create({
    data: {
      establishmentId: establishment.id,
      email: 'admin@scan-eat.local',
      passwordHash: hash,
    },
  });

  console.log('Seed done');
  console.log('Admin:', 'admin@scan-eat.local / admin1234');
  console.log('Establishment slug:', establishment.slug);
  console.log('Table id sample:', tables[0]?.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
