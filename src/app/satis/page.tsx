import { getAllProductStatuses } from "@/lib/inventory/data";
import { SaleEntry } from "@/components/sale/sale-entry";

export const dynamic = "force-dynamic";

export default async function SalePage() {
  const statuses = await getAllProductStatuses();
  const products = statuses.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    salePrice: p.salePrice,
    currentStock: p.currentStock,
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Satış</h1>
      <p className="mt-1 text-sm text-ink-soft">Ara, dokun, miktarı ayarla, tamamla.</p>
      <div className="mt-5">
        <SaleEntry products={products} />
      </div>
    </div>
  );
}
