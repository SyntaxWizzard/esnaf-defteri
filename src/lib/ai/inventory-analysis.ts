import type { ProductStatus } from "@/lib/inventory/types";
import { askClaude } from "./provider";

/** "Bu hafta neye dikkat etmeliyim?" gibi açık uçlu sorular için haftalık odak özeti. */
export async function getWeeklyFocusSummary(statuses: ProductStatus[]): Promise<string> {
  const critical = statuses.filter((p) => p.status === "critical");
  const watch = statuses.filter((p) => p.status === "watch");
  const dead = statuses.filter((p) => p.status === "dead" && p.currentStock > 0);
  const overstocked = statuses.filter((p) => p.status === "overstocked");

  const aiAnswer = await askClaude(
    "Sen bir esnafın stok asistanısın. Kısa (en fazla 4 cümle), samimi, Türkçe cevap ver. Teknik terim kullanma, madde işareti kullanma, doğal konuş.",
    `Bu hafta durum:\n- Kritik seviyede (yakında bitecek) ${critical.length} ürün: ${critical.slice(0, 5).map((p) => p.name).join(", ")}\n- Beklenenden hızlı satan ${watch.length} ürün: ${watch.slice(0, 5).map((p) => p.name).join(", ")}\n- 14+ gündür satılmayan ${dead.length} ürün: ${dead.slice(0, 5).map((p) => p.name).join(", ")}\n- Fazla sermaye bağlı ${overstocked.length} ürün.\nEsnafa bu hafta neye dikkat etmesi gerektiğini anlat.`,
  );
  if (aiAnswer) return aiAnswer;

  const parts: string[] = [];
  if (critical.length > 0) {
    parts.push(`${critical.length} ürün yakında tükenebilir (${critical.slice(0, 3).map((p) => p.name).join(", ")}).`);
  }
  if (watch.length > 0) {
    parts.push(`${watch.length} ürün beklenenden hızlı satılıyor, sipariş miktarını gözden geçir.`);
  }
  if (dead.length > 0) {
    parts.push(`${dead.length} üründe hiç hareket yok, eritmek için bir aksiyon almayı düşün.`);
  }
  if (parts.length === 0) return "Bu hafta dikkat çeken önemli bir durum yok, stoklar dengeli görünüyor.";
  return parts.join(" ");
}
