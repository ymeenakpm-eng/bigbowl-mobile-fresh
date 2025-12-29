-- CreateEnum
CREATE TYPE "BowlOrderStatus" AS ENUM ('PAYMENT_PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT,
    "landmark" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bowl" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pricePerUnit" INTEGER NOT NULL,
    "minQty" INTEGER NOT NULL,
    "isVeg" BOOLEAN NOT NULL,
    "images" TEXT[],
    "inclusions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bowl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BowlAddOn" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pricePerUnit" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BowlAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BowlOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bowlId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" "BowlOrderStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "deliveryFee" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BowlOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BowlOrderAddOn" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "BowlOrderAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BowlOrderAddOn_orderId_addOnId_key" ON "BowlOrderAddOn"("orderId", "addOnId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlOrder" ADD CONSTRAINT "BowlOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlOrder" ADD CONSTRAINT "BowlOrder_bowlId_fkey" FOREIGN KEY ("bowlId") REFERENCES "Bowl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlOrder" ADD CONSTRAINT "BowlOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlOrderAddOn" ADD CONSTRAINT "BowlOrderAddOn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BowlOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlOrderAddOn" ADD CONSTRAINT "BowlOrderAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "BowlAddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
