import Link from "next/link";
import clsx from "clsx";
import type { ProductStatus } from "@/lib/inventory/types";
import { formatNumber } from "@/lib/format";

const BAR_COLOR: Record<ProductStatus["status"], string> = {
  critical: "bg-urgent",
  watch: "bg-attention",
  overstocked: "bg-attention",
  dead: "bg-ink-faint",
  healthy: "bg-good",
};

/**
 * Ürünü tablo satırı olarak değil, satış hızını yatay bir çubukla anlatan
 * bir "raf satırı" olarak gösterir. Amaç sayıları okutmak değil, durumu
 * tek bakışta sezdirmek.
 */
export function ShelfRow({ product, maxVelocity }: { product: ProductStatus; maxVelocity: number }) {
  const p = product;
  const widthPct = Math.max(6, Math.min(100, (p.currentVelocity / maxVelocity) * 100));

  return (
    <Link
      href={`/urunler/${p.id}`}
      className="block border-b border-line py-3 transition hover:bg-paper-raised"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate font-medium text-ink">{p.name}</p>
        <p className="tabular shrink-0 text-sm font-semibold text-ink">
          {formatNumber(p.currentStock)}
          <span className="ml-1 text-xs font-normal text-ink-faint">{p.unit}</span>
        </p>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-bg">
          <div className={clsx("h-full rounded-full", BAR_COLOR[p.status])} style={{ width: `${widthPct}%` }} />
        </div>
        <p className="w-28 shrink-0 text-right text-xs text-ink-faint">
          {p.daysSinceLastSale !== null && p.status === "dead"
            ? `${p.daysSinceLastSale}g hareketsiz`
            : p.currentVelocity > 0
              ? `~${formatNumber(p.currentVelocity)}/gün`
              : p.categoryName ?? ""}
        </p>
      </div>
    </Link>
  );
}
