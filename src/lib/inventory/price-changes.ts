import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "./data";

export type PriceChangeEntry = {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  field: "SALE_PRICE" | "COST_PRICE";
  oldValue: number;
  newValue: number;
  deltaAbs: number;
  deltaPct: number;
  changedAt: Date;
  source: "MANUAL" | "PURCHASE";
  relatedLabel: string;
  unitsSinceChange: number;
  /** Sadece SALE_PRICE değişimleri için: bu dönemdeki satışların gerçek/varsayımsal cirosu. */
  revenueAtOldPrice: number | null;
  revenueAtNewPrice: number | null;
  revenueDiff: number | null;
  /** Sadece COST_PRICE değişimleri için: satılan miktar üzerinden marja etkisi. */
  marginImpact: number | null;
};

export type PriceChangeSummary = {
  entries: PriceChangeEntry[];
  totalOldRevenue: number;
  totalNewRevenue: number;
  totalRevenueDiff: number;
  totalRevenueDiffPct: number | null;
  totalMarginImpact: number;
};

/**
 * "Fiyat Değişimleri" ekranının tek veri kaynağı. Her PriceChange kaydı için
 * bir "geçerlilik penceresi" hesaplanır: [bu değişikliğin tarihi, aynı ürün+
 * alanda bir sonraki değişikliğin tarihi (yoksa şimdi)]. O pencerede yapılan
 * satışlar, "eski fiyattan satsaydık ne olurdu / yeni fiyattan ne oluyor"
 * karşılaştırmasının temelini oluşturuyor.
 */
export async function getPriceChangeSummary(now: Date = new Date()): Promise<PriceChangeSummary> {
  const businessId = await getActiveBusinessId();

  const changes = await prisma.priceChange.findMany({
    where: { product: { businessId } },
    include: { product: { select: { name: true, unit: true } } },
    orderBy: { changedAt: "asc" },
  });

  // Her ürün+alan için kronolojik sıradaki "sonraki değişiklik" tarihini bulmak amacıyla grupla.
  const byProductField = new Map<string, typeof changes>();
  for (const c of changes) {
    const key = `${c.productId}:${c.field}`;
    const arr = byProductField.get(key) ?? [];
    arr.push(c);
    byProductField.set(key, arr);
  }

  const entries: PriceChangeEntry[] = [];

  for (const [, group] of byProductField) {
    for (let i = 0; i < group.length; i++) {
      const c = group[i];
      const windowStart = c.changedAt;
      const windowEnd = group[i + 1]?.changedAt ?? now;

      const saleItems = await prisma.saleItem.findMany({
        where: {
          productId: c.productId,
          sale: { createdAt: { gte: windowStart, lt: windowEnd } },
        },
        select: { quantity: true, unitPrice: true },
      });

      const unitsSinceChange = saleItems.reduce((s, i) => s + i.quantity, 0);
      const deltaAbs = c.newValue - c.oldValue;
      const deltaPct = c.oldValue !== 0 ? (deltaAbs / c.oldValue) * 100 : 0;

      let revenueAtOldPrice: number | null = null;
      let revenueAtNewPrice: number | null = null;
      let revenueDiff: number | null = null;
      let marginImpact: number | null = null;

      if (c.field === "SALE_PRICE") {
        revenueAtNewPrice = saleItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        revenueAtOldPrice = unitsSinceChange * c.oldValue;
        revenueDiff = revenueAtNewPrice - revenueAtOldPrice;
      } else {
        marginImpact = -(unitsSinceChange * deltaAbs); // maliyet arttıysa (deltaAbs>0) marj azalır
      }

      const relatedLabel =
        c.source === "PURCHASE"
          ? "Tedarikçi siparişiyle güncellendi"
          : "Ürün sayfasından elle güncellendi";

      entries.push({
        id: c.id,
        productId: c.productId,
        productName: c.product.name,
        unit: c.product.unit,
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        deltaAbs,
        deltaPct,
        changedAt: c.changedAt,
        source: c.source,
        relatedLabel,
        unitsSinceChange,
        revenueAtOldPrice,
        revenueAtNewPrice,
        revenueDiff,
        marginImpact,
      });
    }
  }

  entries.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

  const saleEntries = entries.filter((e) => e.field === "SALE_PRICE");
  const totalOldRevenue = saleEntries.reduce((s, e) => s + (e.revenueAtOldPrice ?? 0), 0);
  const totalNewRevenue = saleEntries.reduce((s, e) => s + (e.revenueAtNewPrice ?? 0), 0);
  const totalRevenueDiff = totalNewRevenue - totalOldRevenue;
  const totalRevenueDiffPct = totalOldRevenue > 0 ? (totalRevenueDiff / totalOldRevenue) * 100 : null;
  const totalMarginImpact = entries.reduce((s, e) => s + (e.marginImpact ?? 0), 0);

  return { entries, totalOldRevenue, totalNewRevenue, totalRevenueDiff, totalRevenueDiffPct, totalMarginImpact };
}
