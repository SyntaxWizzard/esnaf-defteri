"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePricesAction(productId: string, salePrice: number, costPrice: number) {
  if (!Number.isFinite(salePrice) || !Number.isFinite(costPrice) || salePrice < 0 || costPrice < 0) {
    return { ok: false as const, error: "Geçersiz fiyat." };
  }
  await prisma.product.update({
    where: { id: productId },
    data: { salePrice, costPrice },
  });
  revalidatePath(`/urunler/${productId}`);
  revalidatePath("/urunler");
  revalidatePath("/");
  return { ok: true as const };
}
