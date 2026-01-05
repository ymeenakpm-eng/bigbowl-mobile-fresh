import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed packages (existing feature)
  const ensurePackage = async (data) => {
    const title = String(data?.title ?? '').trim();
    if (!title) return;
    const existing = await prisma.package.findFirst({ where: { title } });
    if (existing) {
      await prisma.package.update({ where: { id: existing.id }, data });
      return;
    }
    await prisma.package.create({ data });
  };

  const deactivateByTitle = async (title) => {
    const t = String(title ?? '').trim();
    if (!t) return;
    const existing = await prisma.package.findFirst({ where: { title: t } });
    if (!existing) return;
    await prisma.package.update({ where: { id: existing.id }, data: { isActive: false } });
  };

  await deactivateByTitle('Hyderabadi Biryani Spread');
  await deactivateByTitle('South Indian Breakfast Feast');
  await deactivateByTitle('Veg Snacks Platter');
  await deactivateByTitle('Non-Veg Snacks Platter');

  await ensurePackage({
    title: 'Snacks Platter',
    cuisine: 'Snacks',
    minPax: 50,
    basePrice: 0,
    perPax: 12900,
    isVeg: true,
    images: [],
    isActive: true,
  });

  // Seed bowls catalog (MVP)
  if (prisma.bowl && typeof prisma.bowl.count === 'function') {
    const bowlCount = await prisma.bowl.count();
    if (bowlCount === 0) {
      await prisma.bowl.createMany({
        data: [
          {
            title: 'Classic South Indian Veg Bowl',
            pricePerUnit: 21900,
            minQty: 10,
            isVeg: true,
            images: [],
            inclusions: ['Steamed Rice', 'Vegetable Sambar', 'Poriyal (Seasonal Veg)', 'Curd', 'Sweet (small)'],
          },
          {
            title: 'Andhra Veg Meals Bowl',
            pricePerUnit: 24900,
            minQty: 10,
            isVeg: true,
            images: [],
            inclusions: ['Rice', 'Pappu (Dal)', 'Vegetable Curry', 'Pickle & Chutney', 'Sweet'],
          },
          {
            title: 'North Indian Veg Bowl',
            pricePerUnit: 26900,
            minQty: 10,
            isVeg: true,
            images: [],
            inclusions: ['Jeera Rice / Roti', 'Paneer Curry', 'Dal Fry', 'Salad', 'Gulab Jamun (1 pc)'],
          },
          {
            title: 'Jain-Friendly Veg Bowl',
            pricePerUnit: 27900,
            minQty: 10,
            isVeg: true,
            images: [],
            inclusions: ['Rice', 'Jain Dal', 'Gobi / Capsicum Sabzi', 'Curd', 'Sweet'],
          },
          {
            title: 'Andhra Chicken Bowl',
            pricePerUnit: 31900,
            minQty: 10,
            isVeg: false,
            images: [],
            inclusions: ['Rice', 'Chicken Curry', 'Dal', 'Fry Piece (small)', 'Sweet'],
          },
          {
            title: 'Chicken Dum Bowl',
            pricePerUnit: 33900,
            minQty: 10,
            isVeg: false,
            images: [],
            inclusions: ['Chicken Dum Curry', 'Rice', 'Raita', 'Sweet'],
          },
          {
            title: 'Egg Curry Bowl',
            pricePerUnit: 28900,
            minQty: 10,
            isVeg: false,
            images: [],
            inclusions: ['Rice', 'Egg Curry', 'Dal', 'Salad', 'Sweet'],
          },
          {
            title: 'Fish Curry Bowl',
            pricePerUnit: 35900,
            minQty: 10,
            isVeg: false,
            images: [],
            inclusions: ['Rice', 'Fish Curry', 'Vegetable Side', 'Sweet'],
          },
        ],
      });
    }
  }

  if (prisma.bowlAddOn && typeof prisma.bowlAddOn.count === 'function') {
    const addOnCount = await prisma.bowlAddOn.count();
    if (addOnCount === 0) {
      await prisma.bowlAddOn.createMany({
        data: [
          { title: 'Extra Sweet', pricePerUnit: 3500 },
          { title: 'Starter', pricePerUnit: 5900 },
          { title: 'Extra Roti (2 pcs)', pricePerUnit: 3000 },
          { title: 'Curd Add-on', pricePerUnit: 2500 },
          { title: 'Fruit Bowl', pricePerUnit: 4900 },
        ],
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
