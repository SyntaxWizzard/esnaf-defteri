export type ParsedProduct = {
  name: string;
  salePrice: number | null;
  costPrice: number | null;
  quantity: number | null;
  unit: string;
};

const UNIT_WORDS: Record<string, string> = {
  adet: "adet",
  kg: "kg",
  gr: "gr",
  gram: "gr",
  lt: "lt",
  litre: "lt",
  paket: "paket",
  kutu: "kutu",
};

/**
 * "Coca Cola 330ml 25 TL satış 15 TL alış 48 adet" gibi tek satırlık, doğal
 * yazımı alanlara ayırır. Kullanıcı 20 input dolduran bir formla uğraşmasın
 * diye — eksik alan olursa null döner, UI o alanı boş bırakıp kullanıcıya sorar.
 */
export function parseQuickAddLine(raw: string): ParsedProduct {
  let text = raw.trim();

  let salePrice: number | null = null;
  let costPrice: number | null = null;
  let quantity: number | null = null;
  let unit = "adet";

  const saleMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:tl|₺)?\s*sat(?:ış|is)/i);
  if (saleMatch) {
    salePrice = Number(saleMatch[1].replace(",", "."));
    text = text.replace(saleMatch[0], " ");
  }

  const costMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:tl|₺)?\s*al(?:ış|is)/i);
  if (costMatch) {
    costPrice = Number(costMatch[1].replace(",", "."));
    text = text.replace(costMatch[0], " ");
  }

  const qtyMatch = text.match(/(\d+)\s*(adet|kg|gr|gram|lt|litre|paket|kutu)\b/i);
  if (qtyMatch) {
    quantity = Number(qtyMatch[1]);
    unit = UNIT_WORDS[qtyMatch[2].toLowerCase()] ?? "adet";
    text = text.replace(qtyMatch[0], " ");
  }

  // Kalan tek başına TL tutarları: ilk kalan sayıyı satış fiyatı, sonrakini de
  // maliyet olarak varsay (kullanıcı "satış/alış" yazmadıysa).
  if (salePrice === null) {
    const genericPrice = text.match(/(\d+(?:[.,]\d+)?)\s*(?:tl|₺)/i);
    if (genericPrice) {
      salePrice = Number(genericPrice[1].replace(",", "."));
      text = text.replace(genericPrice[0], " ");
    }
  }

  const name = text.replace(/\s+/g, " ").trim();

  return { name, salePrice, costPrice, quantity, unit };
}
