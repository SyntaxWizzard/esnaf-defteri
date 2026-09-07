export type MovementLite = {
  id: string;
  quantity: number;
  reason: string;
  createdAt: Date;
};

export type ProductWithMovements = {
  id: string;
  name: string;
  barcode: string | null;
  unit: string;
  salePrice: number;
  costPrice: number;
  categoryName: string | null;
  movements: MovementLite[];
};

/** Bir ürünün türetilmiş, "canlı" durumu — tüm ekranların ortak lego parçası. */
export type ProductStatus = {
  id: string;
  name: string;
  barcode: string | null;
  unit: string;
  salePrice: number;
  costPrice: number;
  categoryName: string | null;

  currentStock: number;
  capitalAtRest: number; // currentStock * costPrice

  sold30d: number;
  sold7d: number;
  soldToday: number;

  /** Son 30 günün ilk 23 gününe göre günlük ortalama satış — "normal hız". */
  normalDailyVelocity: number;
  /** Son 3 güne göre günlük ortalama satış — "şu anki hız". */
  currentVelocity: number;
  /** currentVelocity / normalDailyVelocity, normalDailyVelocity=0 ise null. */
  velocityRatio: number | null;

  daysSinceLastSale: number | null; // hiç satış yoksa null
  lastMovementAt: Date | null;

  estimatedDaysToStockout: number | null; // currentVelocity=0 ise null
  suggestedReorderQty: number;

  status: "critical" | "watch" | "dead" | "healthy" | "overstocked";
};
