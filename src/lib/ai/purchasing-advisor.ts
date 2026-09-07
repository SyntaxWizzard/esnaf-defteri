export type OrderLine = { productName: string; quantity: number; unit: string };

/** Tedarikçiye gönderilecek sade, insan gibi bir sipariş metni üretir. */
export function buildSupplierMessage(lines: OrderLine[], forWhen: string = "yarın"): string {
  if (lines.length === 0) return "";
  const itemLines = lines.map((l) => `${l.quantity} ${l.productName}`).join("\n");
  return `Merhaba, ${forWhen} için:\n${itemLines}\nhazırlayabilir misiniz?`;
}
