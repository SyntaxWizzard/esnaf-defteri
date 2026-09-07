import type { ProductStatus } from "./types";
import type { DaySales } from "./sales-series";

export type TodayBriefing = {
  dateLabel: string;
  todayAmount: number;
  todayItemCount: number;
  vsLast7Pct: number | null; // bugünün, son 7 günün günlük ortalamasına göre yüzde farkı
  mood: "hızlı" | "normal" | "yavaş";
  moodLine: string;
  speedingUp: ProductStatus[]; // beklenenden hızlı satan (watch/critical, ratio>=1.5)
  deadStock: ProductStatus[]; // 14+ gündür hareketsiz
  capitalAtRest: number; // ölü/aşırı stoktaki toplam maliyet
};

export function buildTodayBriefing(statuses: ProductStatus[], series: DaySales[], now = new Date()): TodayBriefing {
  const today = series[series.length - 1];
  const priorDays = series.slice(0, -1).filter((d) => d.amount > 0 || d.itemCount > 0);
  const avgPrior = priorDays.length
    ? priorDays.reduce((s, d) => s + d.amount, 0) / priorDays.length
    : 0;

  const vsLast7Pct = avgPrior > 0 ? ((today.amount - avgPrior) / avgPrior) * 100 : null;

  let mood: TodayBriefing["mood"] = "normal";
  let moodLine = "Bugün işler her zamanki gibi gidiyor.";
  if (vsLast7Pct !== null) {
    if (vsLast7Pct >= 12) {
      mood = "hızlı";
      moodLine = `Bugün işler normalden %${Math.round(vsLast7Pct)} daha hızlı.`;
    } else if (vsLast7Pct <= -12) {
      mood = "yavaş";
      moodLine = `Bugün işler normalden %${Math.round(Math.abs(vsLast7Pct))} daha yavaş.`;
    }
  }

  const speedingUp = statuses
    .filter((p) => p.velocityRatio !== null && p.velocityRatio >= 1.5 && p.soldToday > 0)
    .sort((a, b) => (b.velocityRatio ?? 0) - (a.velocityRatio ?? 0));

  const deadStock = statuses
    .filter((p) => p.status === "dead" && p.currentStock > 0)
    .sort((a, b) => (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0));

  const capitalAtRest = [...deadStock, ...statuses.filter((p) => p.status === "overstocked")]
    .reduce((sum, p) => sum + p.capitalAtRest, 0);

  return {
    dateLabel: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }),
    todayAmount: today.amount,
    todayItemCount: today.itemCount,
    vsLast7Pct,
    mood,
    moodLine,
    speedingUp,
    deadStock,
    capitalAtRest,
  };
}

export type ActionItem = {
  id: string;
  productId: string;
  title: string;
  reason: string;
  kind: "reorder" | "discount" | "increase_order" | "investigate";
  urgency: "high" | "medium" | "low";
  suggestedQty?: number;
};

/** "Bugün yapılabilecekler" — sistemin ürettiği, gerekçeli aksiyon listesi. */
export function buildActionList(statuses: ProductStatus[]): ActionItem[] {
  const actions: ActionItem[] = [];

  for (const p of statuses) {
    if (p.status === "critical" && p.currentStock > 0) {
      actions.push({
        id: `reorder-${p.id}`,
        productId: p.id,
        title: `${p.name} sipariş et`,
        reason:
          p.estimatedDaysToStockout !== null
            ? `Tahmini ${p.estimatedDaysToStockout < 1 ? "bugün" : Math.round(p.estimatedDaysToStockout) + " gün içinde"} bitecek.`
            : "Stok kritik seviyede.",
        kind: "reorder",
        urgency: "high",
        suggestedQty: p.suggestedReorderQty,
      });
    } else if (p.status === "critical" && p.currentStock === 0) {
      actions.push({
        id: `reorder-${p.id}`,
        productId: p.id,
        title: `${p.name} sipariş et`,
        reason: "Stok tükendi.",
        kind: "reorder",
        urgency: "high",
        suggestedQty: p.suggestedReorderQty || Math.max(Math.round(p.normalDailyVelocity * 14), 10),
      });
    } else if (p.status === "watch" && p.velocityRatio) {
      actions.push({
        id: `increase-${p.id}`,
        productId: p.id,
        title: `${p.name} sipariş miktarını artır`,
        reason: `Satış hızı %${Math.round((p.velocityRatio - 1) * 100)} arttı.`,
        kind: "increase_order",
        urgency: "medium",
        suggestedQty: p.suggestedReorderQty,
      });
    } else if (p.status === "dead" && p.daysSinceLastSale !== null && p.daysSinceLastSale >= 21) {
      actions.push({
        id: `discount-${p.id}`,
        productId: p.id,
        title: `${p.name} indirimli sat`,
        reason: `Son ${p.daysSinceLastSale} gündür satış yok.`,
        kind: "discount",
        urgency: "low",
      });
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => order[a.urgency] - order[b.urgency]);
}

export type DeadStockBucket = { label: string; minDays: number; items: ProductStatus[] };

export function buildDeadStockBuckets(statuses: ProductStatus[]): DeadStockBucket[] {
  const withStock = statuses.filter((p) => p.currentStock > 0 && p.daysSinceLastSale !== null);
  const b60 = withStock.filter((p) => (p.daysSinceLastSale ?? 0) >= 60);
  const b30 = withStock.filter((p) => (p.daysSinceLastSale ?? 0) >= 30 && (p.daysSinceLastSale ?? 0) < 60);
  const b14 = withStock.filter((p) => (p.daysSinceLastSale ?? 0) >= 14 && (p.daysSinceLastSale ?? 0) < 30);
  return [
    { label: "60+ gündür satılmıyor", minDays: 60, items: b60.sort((a, b) => (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0)) },
    { label: "30-60 gündür satılmıyor", minDays: 30, items: b30.sort((a, b) => (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0)) },
    { label: "14-30 gündür satılmıyor", minDays: 14, items: b14.sort((a, b) => (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0)) },
  ];
}

/** Tek bir "stock health = %72" göstergesi yerine doğal dil özet cümleleri. */
export function buildHealthNarrative(statuses: ProductStatus[]): string[] {
  const lines: string[] = [];
  const critical = statuses.filter((p) => p.status === "critical");
  const overstocked = statuses.filter((p) => p.status === "overstocked");
  const dead = statuses.filter((p) => p.status === "dead" && p.currentStock > 0);

  if (critical.length === 0 && overstocked.length === 0 && dead.length === 0) {
    lines.push("Stokların genel olarak sağlıklı görünüyor.");
    return lines;
  }

  lines.push("Stokların genel olarak sağlıklı.");
  if (overstocked.length > 0) {
    lines.push(`Ancak ${overstocked.length} üründe gereğinden fazla sermaye bağlı.`);
  }
  if (critical.length > 0) {
    lines.push(`${critical.length} ürünün önümüzdeki birkaç gün içinde tükenme ihtimali yüksek.`);
  }
  if (dead.length > 0) {
    lines.push(`${dead.length} ürün 14 günden uzun süredir hiç hareket görmedi.`);
  }
  return lines;
}
