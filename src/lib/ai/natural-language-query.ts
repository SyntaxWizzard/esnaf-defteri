import type { ProductStatus } from "@/lib/inventory/types";
import { askClaude } from "./provider";

export type QueryResult = {
  answerLine: string;
  products: ProductStatus[];
};

/**
 * Doğal dil sorguları için önce deterministik kalıp eşleştirme denenir
 * (hızlı, ücretsiz, her zaman aynı sonucu verir). Hiçbir kalıp eşleşmezse
 * ve API anahtarı varsa Claude'a düşer; o da yoksa en yakın tahminle cevap
 * verir. Kullanıcı asla "anlamadım" ile baş başa kalmamalı.
 */
export async function answerNaturalLanguageQuery(
  query: string,
  statuses: ProductStatus[],
): Promise<QueryResult> {
  const q = query.toLowerCase().trim();

  const capitalMatch = q.match(/(\d+)\s*(tl|lira)('?d[ae]n)?\s*fazla/);
  if (capitalMatch && (q.includes("sermaye") || q.includes("bağlı") || q.includes("değer"))) {
    const threshold = Number(capitalMatch[1]);
    const products = statuses
      .filter((p) => p.capitalAtRest > threshold)
      .sort((a, b) => b.capitalAtRest - a.capitalAtRest);
    return {
      answerLine: `₺${threshold}'den fazla sermayenin bağlı olduğu ${products.length} ürün var.`,
      products,
    };
  }

  if (q.includes("yarın") && (q.includes("bit") || q.includes("tüken"))) {
    const products = statuses
      .filter((p) => p.estimatedDaysToStockout !== null && p.estimatedDaysToStockout <= 1.5 && p.currentStock > 0)
      .sort((a, b) => (a.estimatedDaysToStockout ?? 0) - (b.estimatedDaysToStockout ?? 0));
    return { answerLine: `Yarın bitme ihtimali yüksek ${products.length} ürün var.`, products };
  }

  const daysMatch = q.match(/(\d+)\s*gün/);
  if (daysMatch && (q.includes("satılmayan") || q.includes("satılmadı") || q.includes("hareket"))) {
    const days = Number(daysMatch[1]);
    const products = statuses
      .filter((p) => p.daysSinceLastSale !== null && p.daysSinceLastSale >= days)
      .sort((a, b) => (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0));
    return { answerLine: `Son ${days} gündür satılmayan ${products.length} ürün var.`, products };
  }

  if (q.includes("hızlı satan") || q.includes("en çok satan") || q.includes("en çok satılan")) {
    const days7 = q.includes("30") ? 30 : 7;
    const products = [...statuses]
      .sort((a, b) => (days7 === 30 ? b.sold30d - a.sold30d : b.sold7d - a.sold7d))
      .slice(0, 10);
    return { answerLine: `Son ${days7} günde en çok satan ürünler:`, products };
  }

  if (q.includes("kazand") || q.includes("kâr") || q.includes("kar getiren") || q.includes("karlı")) {
    const products = [...statuses]
      .map((p) => p)
      .sort((a, b) => {
        const marginA = (a.salePrice - a.costPrice) * a.sold30d;
        const marginB = (b.salePrice - b.costPrice) * b.sold30d;
        return marginB - marginA;
      })
      .slice(0, 10);
    return { answerLine: "Son 30 günde en çok kâr getiren ürünler:", products };
  }

  if (q.includes("kaybettiren") || q.includes("zarar")) {
    const products = [...statuses]
      .filter((p) => p.status === "dead" || p.status === "overstocked")
      .sort((a, b) => b.capitalAtRest - a.capitalAtRest)
      .slice(0, 10);
    return {
      answerLine: "En çok para kaybettiren stoklar (rafta bekleyen sermaye):",
      products,
    };
  }

  if (q.includes("hızlanan") || q.includes("normalden hızlı") || q.includes("beklenenden hızlı")) {
    const products = statuses
      .filter((p) => p.velocityRatio !== null && p.velocityRatio >= 1.3)
      .sort((a, b) => (b.velocityRatio ?? 0) - (a.velocityRatio ?? 0));
    return { answerLine: `Beklenenden hızlı satan ${products.length} ürün var.`, products };
  }

  // Basit isim araması
  const nameMatches = statuses.filter((p) => p.name.toLowerCase().includes(q));
  if (nameMatches.length > 0) {
    return { answerLine: `"${query}" için ${nameMatches.length} sonuç bulundu.`, products: nameMatches };
  }

  // Hiçbir kalıp eşleşmedi — Claude varsa ona danış, yoksa dürüstçe söyle.
  const aiAnswer = await askClaude(
    "Sen bir esnafın stok asistanısın. Kısa, samimi, Türkçe ve tek cümlelik cevaplar ver. Teknik terim kullanma.",
    `Esnaf şunu sordu: "${query}". Elimde ürün adı, stok, satış hızı gibi veriler var ama bu soruyu otomatik eşleştiremedim. Esnafa nazikçe soruyu nasıl daha net sorabileceğini söyle.`,
  );

  return {
    answerLine:
      aiAnswer ??
      `"${query}" sorusunu tam anlayamadım. "Yarın bitecek ürünler" veya "son 7 günde en hızlı satanlar" gibi sorabilirsin.`,
    products: [],
  };
}
