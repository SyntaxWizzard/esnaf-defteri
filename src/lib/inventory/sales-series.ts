import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

export type DaySales = { date: Date; amount: number; itemCount: number };

/** Son N günün günlük ciro serisi (bugün dahil), gerçek Sale/SaleItem kayıtlarından. */
export async function getDailySalesSeries(businessId: string, days: number, now = new Date()): Promise<DaySales[]> {
  const from = startOfDay(subDays(now, days - 1));
  const items = await prisma.saleItem.findMany({
    where: { sale: { businessId, createdAt: { gte: from } } },
    select: { quantity: true, unitPrice: true, sale: { select: { createdAt: true } } },
  });

  const buckets = new Map<string, DaySales>();
  for (let i = 0; i < days; i++) {
    const d = startOfDay(subDays(now, days - 1 - i));
    buckets.set(d.toDateString(), { date: d, amount: 0, itemCount: 0 });
  }
  for (const it of items) {
    const key = startOfDay(it.sale.createdAt).toDateString();
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.amount += it.quantity * it.unitPrice;
    bucket.itemCount += it.quantity;
  }
  return Array.from(buckets.values());
}
