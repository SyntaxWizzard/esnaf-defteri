import { differenceInCalendarDays, isSameDay, subDays } from "date-fns";
import type { ProductStatus, ProductWithMovements } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function soldQtyBetween(
  movements: ProductWithMovements["movements"],
  from: Date,
  to: Date,
) {
  return movements
    .filter((m) => m.reason === "SALE" && m.createdAt >= from && m.createdAt < to)
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
}

/**
 * Tek bir üründen tüm ekranların ihtiyaç duyduğu "canlı" durumu türetir.
 * Stok hiçbir yerde saklanmıyor: her zaman hareket geçmişinin toplamı.
 */
export function deriveProductStatus(p: ProductWithMovements, now: Date = new Date()): ProductStatus {
  const currentStock = p.movements.reduce((sum, m) => sum + m.quantity, 0);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d7 = subDays(now, 7);
  const d30 = subDays(now, 30);
  const d3 = subDays(now, 3);
  // "Normal hız" son 3 günü dışarıda bırakarak 30-3 gün arasından hesaplanır,
  // böylece bir anomali kendi baseline'ını şişirmez.
  const normalWindowStart = d30;
  const normalWindowEnd = d3;
  const normalWindowDays = Math.max(
    1,
    differenceInCalendarDays(normalWindowEnd, normalWindowStart),
  );

  const sold30d = soldQtyBetween(p.movements, d30, now);
  const sold7d = soldQtyBetween(p.movements, d7, now);
  const soldToday = soldQtyBetween(p.movements, todayStart, new Date(now.getTime() + DAY));

  const normalSold = soldQtyBetween(p.movements, normalWindowStart, normalWindowEnd);
  const normalDailyVelocity = normalSold / normalWindowDays;

  const recentSold = soldQtyBetween(p.movements, d3, now);
  const currentVelocity = recentSold / 3;

  const velocityRatio = normalDailyVelocity > 0 ? currentVelocity / normalDailyVelocity : null;

  const saleMovements = p.movements.filter((m) => m.reason === "SALE");
  const lastSale = saleMovements.length
    ? saleMovements.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null;
  const daysSinceLastSale = lastSale
    ? differenceInCalendarDays(now, lastSale.createdAt)
    : null;

  const lastMovementAt = p.movements.length
    ? p.movements.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).createdAt
    : null;

  const effectiveVelocity = currentVelocity > 0 ? currentVelocity : normalDailyVelocity;
  const estimatedDaysToStockout =
    effectiveVelocity > 0 ? Math.max(0, currentStock / effectiveVelocity) : null;

  const targetDays = 14;
  const targetStock = Math.round(Math.max(currentVelocity, normalDailyVelocity) * targetDays);
  const suggestedReorderQty = Math.max(targetStock - currentStock, 0);

  const capitalAtRest = currentStock * p.costPrice;

  let status: ProductStatus["status"] = "healthy";
  const neverSold = daysSinceLastSale === null;
  const isDead = (daysSinceLastSale !== null && daysSinceLastSale >= 14) || (neverSold && currentStock > 0);
  if (isDead) {
    status = "dead";
  } else if (estimatedDaysToStockout !== null && estimatedDaysToStockout <= 2 && currentStock > 0) {
    status = "critical";
  } else if (velocityRatio !== null && velocityRatio >= 1.5) {
    status = "watch";
  } else if (
    daysSinceLastSale !== null &&
    daysSinceLastSale >= 7 &&
    currentStock > 0 &&
    capitalAtRest > 200
  ) {
    status = "overstocked";
  }

  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    unit: p.unit,
    salePrice: p.salePrice,
    costPrice: p.costPrice,
    categoryName: p.categoryName,
    currentStock,
    capitalAtRest,
    sold30d,
    sold7d,
    soldToday,
    normalDailyVelocity,
    currentVelocity,
    velocityRatio,
    daysSinceLastSale,
    lastMovementAt,
    estimatedDaysToStockout,
    suggestedReorderQty,
    status,
  };
}

export function isSameCalendarDay(a: Date, b: Date) {
  return isSameDay(a, b);
}
