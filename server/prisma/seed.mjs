import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed packages (existing feature)
  const packageCount = await prisma.package.count();
  if (packageCount === 0) {
    await prisma.package.createMany({
      data: [
        {
          title: 'Hyderabadi Biryani Spread',
          cuisine: 'Hyderabadi',
          minPax: 100,
          basePrice: 500000,
          perPax: 4500,
          isVeg: false,
          images: [],
        },
        {
          title: 'South Indian Breakfast Feast',
          cuisine: 'South Indian',
          minPax: 50,
          basePrice: 200000,
          perPax: 3000,
          isVeg: true,
          images: [],
        },
      ],
    });
  }

  // Seed bowls catalog (MVP)
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

  // Seed add-ons (per bowl)
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
