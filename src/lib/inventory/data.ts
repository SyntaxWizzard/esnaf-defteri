import { prisma } from "@/lib/prisma";
import { deriveProductStatus } from "./stock";
import type { ProductStatus, ProductWithMovements } from "./types";

/**
 * Demo/tek-işletme kurulum: uygulamada login duvarı yok, ilk işletme kullanılır.
 * Çoklu işletme desteği (User/Business ayrımı) şemada hazır; burada tek
 * satırlık bir varsayım var — ileride auth eklenince burası değişecek tek yer.
 */
export async function getActiveBusinessId() {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) throw new Error("Henüz bir işletme oluşturulmamış. `npm run seed` çalıştırın.");
  return business.id;
}

export async function getAllProductStatuses(now = new Date()): Promise<ProductStatus[]> {
  const businessId = await getActiveBusinessId();
  const products = await prisma.product.findMany({
    where: { businessId, isActive: true },
    include: {
      category: { select: { name: true } },
      movements: { select: { id: true, quantity: true, reason: true, createdAt: true } },
    },
    orderBy: { name: "asc" },
  });

  const mapped: ProductWithMovements[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    unit: p.unit,
    salePrice: p.salePrice,
    costPrice: p.costPrice,
    categoryName: p.category?.name ?? null,
    movements: p.movements,
  }));

  return mapped.map((p) => deriveProductStatus(p, now));
}

export async function getProductStatus(productId: string, now = new Date()): Promise<ProductStatus | null> {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true } },
      movements: { select: { id: true, quantity: true, reason: true, createdAt: true } },
    },
  });
  if (!p) return null;
  return deriveProductStatus(
    {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      unit: p.unit,
      salePrice: p.salePrice,
      costPrice: p.costPrice,
      categoryName: p.category?.name ?? null,
      movements: p.movements,
    },
    now,
  );
}

export async function getProductTimeline(productId: string) {
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
