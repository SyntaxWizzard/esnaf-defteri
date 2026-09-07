"use server";

import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/inventory/data";
import { StockMovementReason } from "@prisma/client";
import { redirect } from "next/navigation";

export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const salePrice = Number(formData.get("salePrice"));
  const costPrice = Number(formData.get("costPrice"));
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "adet");
  const categoryName = String(formData.get("category") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();

  if (!name || !Number.isFinite(salePrice) || !Number.isFinite(costPrice)) {
    throw new Error("Ürün adı, satış ve alış fiyatı gerekli.");
  }

  const businessId = await getActiveBusinessId();

  let categoryId: string | undefined;
  if (categoryName) {
    const existing = await prisma.category.findFirst({ where: { name: categoryName, businessId } });
    const category = existing ?? (await prisma.category.create({ data: { name: categoryName, businessId } }));
    categoryId = category.id;
  }

  const product = await prisma.product.create({
    data: {
      name,
      salePrice,
      costPrice,
      unit,
      businessId,
      categoryId,
      barcode: barcode || undefined,
    },
  });

  if (quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity,
        reason: StockMovementReason.INITIAL,
        note: "Açılış stoğu",
      },
    });
  }

  redirect(`/urunler/${product.id}`);
}
