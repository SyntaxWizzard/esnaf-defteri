"use server";

import { prisma } from "@/lib/prisma";
import { PriceField, PriceChangeSource } from "@prisma/client";
import { revalidatePath } from "next/cache";

const EPSILON = 0.005; // kuruş hassasiyeti altındaki farkları "değişim" sayma

export async function updatePricesAction(productId: string, salePrice: number, costPrice: number) {
  if (!Number.isFinite(salePrice) || !Number.isFinite(costPrice) || salePrice < 0 || costPrice < 0) {
    return { ok: false as const, error: "Geçersiz fiyat." };
  }

  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { salePrice: true, costPrice: true },
  });
  if (!current) return { ok: false as const, error: "Ürün bulunamadı." };

  const changes: { field: PriceField; oldValue: number; newValue: number }[] = [];
  if (Math.abs(current.salePrice - salePrice) > EPSILON) {
    changes.push({ field: PriceField.SALE_PRICE, oldValue: current.salePrice, newValue: salePrice });
  }
  if (Math.abs(current.costPrice - costPrice) > EPSILON) {
    changes.push({ field: PriceField.COST_PRICE, oldValue: current.costPrice, newValue: costPrice });
  }

  await prisma.product.update({
    where: { id: productId },
    data: { salePrice, costPrice },
  });

  if (changes.length > 0) {
    await prisma.priceChange.createMany({
      data: changes.map((c) => ({
        productId,
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        source: PriceChangeSource.MANUAL,
      })),
    });
  }

  revalidatePath(`/urunler/${productId}`);
  revalidatePath("/urunler");
  revalidatePath("/");
  revalidatePath("/fiyat-degisimleri");
  return { ok: true as const };
}
