-- CreateEnum
CREATE TYPE "PriceField" AS ENUM ('SALE_PRICE', 'COST_PRICE');

-- CreateEnum
CREATE TYPE "PriceChangeSource" AS ENUM ('MANUAL', 'PURCHASE');

-- CreateTable
CREATE TABLE "PriceChange" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "field" "PriceField" NOT NULL,
    "oldValue" DOUBLE PRECISION NOT NULL,
    "newValue" DOUBLE PRECISION NOT NULL,
    "source" "PriceChangeSource" NOT NULL DEFAULT 'MANUAL',
    "purchaseId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceChange_productId_field_changedAt_idx" ON "PriceChange"("productId", "field", "changedAt");

-- AddForeignKey
ALTER TABLE "PriceChange" ADD CONSTRAINT "PriceChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
