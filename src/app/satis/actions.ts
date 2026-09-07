"use server";

import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/inventory/data";
import { StockMovementReason } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function completeSaleAction(items: { productId: string; quantity: number }[]) {
  if (items.length === 0) return { ok: false as const };

  const businessId = await getActiveBusinessId();
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, salePrice: true, costPrice: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const sale = await prisma.sale.create({ data: { businessId } });

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || item.quantity <= 0) continue;
    const saleItem = await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        unitCost: product.costPrice,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: -item.quantity,
        reason: StockMovementReason.SALE,
        saleItemId: saleItem.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/urunler");
  return { ok: true as const, saleId: sale.id };
}
