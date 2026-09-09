"use server";

import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/inventory/data";
import { StockMovementReason, PriceField, PriceChangeSource } from "@prisma/client";
import { revalidatePath } from "next/cache";

const EPSILON = 0.005;

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

    // Tedarikçi bu siparişte farklı bir birim maliyetle geldiyse, ürünün
    // güncel maliyetini bu fiyata taşı ve bunu siparişe bağlı bir fiyat
    // değişimi olarak kaydet — esnaf "bu sipariş yüzünden maliyetim değişti"
    // diye Fiyat Değişimleri ekranında görebilsin.
    const product = await prisma.product.findUnique({ where: { id: line.productId }, select: { costPrice: true } });
    if (product && Math.abs(product.costPrice - line.unitCost) > EPSILON) {
      await prisma.priceChange.create({
        data: {
          productId: line.productId,
          field: PriceField.COST_PRICE,
          oldValue: product.costPrice,
          newValue: line.unitCost,
          source: PriceChangeSource.PURCHASE,
          purchaseId: purchase.id,
        },
      });
      await prisma.product.update({ where: { id: line.productId }, data: { costPrice: line.unitCost } });
    }
  }

  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath("/fiyat-degisimleri");
  return { ok: true as const };
}
