import { notFound } from "next/navigation";
import { getProductStatus, getProductTimeline } from "@/lib/inventory/data";
import { REASON_LABELS } from "@/lib/inventory/reason-labels";
import { formatNumber, formatDays } from "@/lib/format";
import { StatusPill } from "@/components/ui/status-pill";
import { AddToOrderButton } from "@/components/actions/add-to-order-button";
import { PriceEditor } from "@/components/shelf/price-editor";

function storyLine(p: NonNullable<Awaited<ReturnType<typeof getProductStatus>>>): string {
  if (p.status === "dead") {
    return p.daysSinceLastSale !== null
      ? `Bu ürün son ${p.daysSinceLastSale} gündür hiç satılmadı.`
      : "Bu ürün henüz hiç satılmadı.";
  }
  if (p.velocityRatio !== null && p.velocityRatio >= 1.4) {
    return `Bu ürün son 3 gündür normalin yaklaşık ${p.velocityRatio.toFixed(1)} katı hızında satılıyor.`;
  }
  if (p.velocityRatio !== null && p.velocityRatio <= 0.6) {
    return `Bu ürünün satış hızı son günlerde normalin altına düştü.`;
  }
  return "Bu ürün normal hızında satılıyor.";
}

export default async function ProductStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, timeline] = await Promise.all([getProductStatus(id), getProductTimeline(id)]);
  if (!p) notFound();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-ink-faint">{p.categoryName ?? "Kategorisiz"}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-serif text-2xl font-semibold text-ink">{p.name}</h1>
          <StatusPill status={p.status} />
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="tabular font-mono text-4xl font-semibold text-ink">{formatNumber(p.currentStock)}</span>
          <span className="text-ink-soft">{p.unit} kaldı</span>
        </div>
        <PriceEditor productId={p.id} salePrice={p.salePrice} costPrice={p.costPrice} capitalAtRest={p.capitalAtRest} />
      </section>

      <section className="grid grid-cols-3 gap-3 border-y border-line py-4 text-center">
        <div>
          <p className="tabular text-xl font-semibold text-ink">{formatNumber(p.sold30d)}</p>
          <p className="mt-0.5 text-xs text-ink-soft">son 30 gün</p>
        </div>
        <div>
          <p className="tabular text-xl font-semibold text-ink">{formatNumber(p.sold7d)}</p>
          <p className="mt-0.5 text-xs text-ink-soft">son 7 gün</p>
        </div>
        <div>
          <p className="tabular text-xl font-semibold text-ink">{formatNumber(p.soldToday)}</p>
          <p className="mt-0.5 text-xs text-ink-soft">bugün</p>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-paper-raised p-4">
        <p className="font-serif text-base italic leading-relaxed text-ink">{storyLine(p)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-ink-faint">Normal günlük satış</p>
            <p className="tabular font-medium text-ink">{formatNumber(p.normalDailyVelocity)} {p.unit}</p>
          </div>
          <div>
            <p className="text-ink-faint">Şu anki hız</p>
            <p className="tabular font-medium text-ink">{formatNumber(p.currentVelocity)} {p.unit}</p>
          </div>
          <div>
            <p className="text-ink-faint">Tahmini tükenme</p>
            <p className="tabular font-medium text-ink">
              {p.estimatedDaysToStockout !== null ? formatDays(p.estimatedDaysToStockout) : "—"}
            </p>
          </div>
          <div>
            <p className="text-ink-faint">Önerilen sipariş</p>
            <p className="tabular font-medium text-ink">
              {p.suggestedReorderQty > 0 ? `${p.suggestedReorderQty} ${p.unit}` : "gerek yok"}
            </p>
          </div>
        </div>
        {p.suggestedReorderQty > 0 && (
          <div className="mt-4">
            <AddToOrderButton
              productId={p.id}
              productName={p.name}
              unit={p.unit}
              costPrice={p.costPrice}
              suggestedQty={p.suggestedReorderQty}
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold text-ink">Stok geçmişi</h2>
        <div className="mt-3">
          {timeline.map((m, i) => (
            <div key={m.id} className={i > 0 ? "torn-edge pt-3" : ""}>
              <div className="flex items-center justify-between rounded-md bg-paper-raised px-3.5 py-3 shadow-[0_1px_0_var(--line)]">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {REASON_LABELS[m.reason] ?? m.reason}
                    {m.note && <span className="font-normal text-ink-soft"> — {m.note}</span>}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {m.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    {" · "}
                    {m.createdAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className={`tabular text-sm font-semibold ${m.quantity >= 0 ? "text-good" : "text-ink"}`}>
                  {m.quantity >= 0 ? "+" : ""}
                  {m.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
