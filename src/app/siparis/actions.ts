"use server";

import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/inventory/data";
import { StockMovementReason } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function receivePurchaseAction(lines: { productId: string; quantity: number; unitCost: number }[]) {
  if (lines.length === 0) return { ok: false as const };
  const businessId = await getActiveBusinessId();

  const purchase = await prisma.purchase.create({
    data: { businessId, note: "Uygulama üzerinden hazırlanan sipariş" },
  });

  for (const line of lines) {
    if (line.quantity <= 0) continue;
    const item = await prisma.purchaseItem.create({
      data: { purchaseId: purchase.id, productId: line.productId, quantity: line.quantity, unitCost: line.unitCost },
    });
    await prisma.stockMovement.create({
      data: {
        productId: line.productId,
        quantity: line.quantity,
        reason: StockMovementReason.PURCHASE,
        purchaseItemId: item.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/urunler");
  return { ok: true as const };
}
