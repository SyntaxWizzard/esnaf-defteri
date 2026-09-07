import { getAllProductStatuses } from "@/lib/inventory/data";
import { ShelfBrowser } from "@/components/shelf/shelf-browser";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const statuses = await getAllProductStatuses();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Raf</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Çubuk ne kadar uzunsa o ürün o kadar hızlı satılıyor.
      </p>
      <div className="mt-5">
        <ShelfBrowser statuses={statuses} initialFilter={filter ?? "all"} />
      </div>
    </div>
  );
}
