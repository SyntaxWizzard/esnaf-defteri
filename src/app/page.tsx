import { getActiveBusinessId, getAllProductStatuses } from "@/lib/inventory/data";
import { getDailySalesSeries } from "@/lib/inventory/sales-series";
import { buildActionList, buildTodayBriefing, buildHealthNarrative } from "@/lib/inventory/insights";
import { formatTL } from "@/lib/format";
import { AddToOrderButton } from "@/components/actions/add-to-order-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const now = new Date();
  const businessId = await getActiveBusinessId();
  const [statuses, series] = await Promise.all([
    getAllProductStatuses(now),
    getDailySalesSeries(businessId, 8, now),
  ]);

  const briefing = buildTodayBriefing(statuses, series, now);
  const actions = buildActionList(statuses);
  const health = buildHealthNarrative(statuses);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
          Bugün · {briefing.dateLabel}
        </p>
        <h1 className="mt-2 font-serif text-2xl leading-snug italic text-ink md:text-3xl">
          {briefing.moodLine}
        </h1>

        <div className="mt-5 flex items-end gap-6 border-y border-line py-4">
          <div>
            <p className="tabular font-mono text-3xl font-semibold text-ink md:text-4xl">
              {formatTL(briefing.todayAmount)}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">bugünkü satış</p>
          </div>
          <div>
            <p className="tabular font-mono text-3xl font-semibold text-ink md:text-4xl">
              {briefing.todayItemCount}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">ürün satıldı</p>
          </div>
          {briefing.vsLast7Pct !== null && (
            <p
              className={
                "mb-1 ml-auto tabular text-sm font-medium " +
                (briefing.vsLast7Pct >= 0 ? "text-good" : "text-urgent")
              }
            >
              Son 7 güne göre {briefing.vsLast7Pct >= 0 ? "+" : ""}
              {Math.round(briefing.vsLast7Pct)}%
            </p>
          )}
        </div>
      </section>

      {briefing.speedingUp.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-ink">Dikkat etmen gerekenler</h2>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {briefing.speedingUp.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/urunler/${p.id}`} className="font-medium text-ink hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    Bugün {p.soldToday} {p.unit} satıldı. Normalden {p.velocityRatio?.toFixed(1)}x hızlı.
                  </p>
                  {p.estimatedDaysToStockout !== null && p.estimatedDaysToStockout <= 2 && (
                    <p className="mt-1 text-sm font-medium text-urgent">
                      → {p.estimatedDaysToStockout < 1 ? "Bugün" : "Yarın"} stok bitebilir.
                    </p>
                  )}
                </div>
                <AddToOrderButton
                  productId={p.id}
                  productName={p.name}
                  unit={p.unit}
                  costPrice={p.costPrice}
                  suggestedQty={p.suggestedReorderQty || 10}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 text-sm text-ink-soft">
            <p>
              <span className="font-medium text-ink">{briefing.speedingUp.length} ürün</span> beklenenden hızlı
              tükeniyor.
            </p>
            {briefing.deadStock.length > 0 && (
              <p>
                <Link href="/urunler?filter=dead" className="font-medium text-ink hover:underline">
                  {briefing.deadStock.length} ürün
                </Link>{" "}
                14+ gündür hareket görmedi.
              </p>
            )}
            {briefing.capitalAtRest > 0 && (
              <p>
                <span className="tabular font-medium text-ink">{formatTL(briefing.capitalAtRest)}</span> değerindeki
                ürün rafta bekliyor.
              </p>
            )}
          </div>
        </section>
      )}

      {actions.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-ink">Bugün yapılabilecekler</h2>
          <ol className="mt-3 space-y-3">
            {actions.slice(0, 6).map((a, i) => (
              <li key={a.id} className="flex items-start gap-3 rounded-lg border border-line bg-paper-raised p-3.5">
                <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-bg text-xs font-semibold text-ink-soft">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/urunler/${a.productId}`} className="font-medium text-ink hover:underline">
                    {a.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-soft">{a.reason}</p>
                </div>
                {(a.kind === "reorder" || a.kind === "increase_order") && (
                  <AddToOrderButton
                    productId={a.productId}
                    productName={a.title.replace(/ sipariş.*$/, "").replace(/ sipariş miktarını artır$/, "")}
                    unit="adet"
                    costPrice={0}
                    suggestedQty={a.suggestedQty || 10}
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rounded-lg border border-line bg-paper-raised p-4">
        <h2 className="font-serif text-base font-semibold text-ink">Stok sağlığı</h2>
        <div className="mt-2 space-y-1 text-sm text-ink-soft">
          {health.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
