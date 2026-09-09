import Link from "next/link";
import { getPriceChangeSummary } from "@/lib/inventory/price-changes";
import { formatTL, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

function SignedTL({ value }: { value: number }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span className={`tabular font-semibold ${positive ? "text-good" : negative ? "text-urgent" : "text-ink-soft"}`}>
      {positive ? "+" : ""}
      {formatTL(value)}
    </span>
  );
}

function SignedPct({ value }: { value: number }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span className={`tabular text-sm font-medium ${positive ? "text-good" : negative ? "text-urgent" : "text-ink-soft"}`}>
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default async function PriceChangesPage() {
  const summary = await getPriceChangeSummary();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-2xl font-semibold text-ink">Fiyat Değişimleri</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Fiyatı değişen ürünler ve bu değişimin cirona etkisi.
        </p>
      </section>

      {summary.entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-faint">
          Henüz kaydedilmiş bir fiyat değişimi yok. Bir ürünün sayfasından fiyatını düzenlediğinde ya da
          tedarikçi farklı bir maliyetle sipariş gönderdiğinde burada görünecek.
        </p>
      ) : (
        <>
          <section className="rounded-lg border border-line bg-paper-raised p-4">
            <h2 className="font-serif text-base font-semibold text-ink">Toplam etki</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Satış fiyatı değişen ürünleri <strong className="text-ink">eski fiyatlarından</strong> satsaydık bu
              dönemde toplam <strong className="tabular text-ink">{formatTL(summary.totalOldRevenue)}</strong> elde
              edecektik. <strong className="text-ink">Güncel fiyatlarla</strong> aynı miktarları sattığımızda toplam{" "}
              <strong className="tabular text-ink">{formatTL(summary.totalNewRevenue)}</strong> elde ettik. Aradaki
              fark: <SignedTL value={summary.totalRevenueDiff} />
              {summary.totalRevenueDiffPct !== null && (
                <>
                  {" "}
                  (<SignedPct value={summary.totalRevenueDiffPct} />)
                </>
              )}
              .
            </p>
            {Math.abs(summary.totalMarginImpact) > 0.5 && (
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Maliyet değişimlerinin kâr marjına toplam etkisi: <SignedTL value={summary.totalMarginImpact} />.
              </p>
            )}
          </section>

          <section className="md:columns-2 md:gap-x-8 lg:columns-3">
            {summary.entries.map((e) => (
              <div key={e.id} className="break-inside-avoid border-b border-line py-4 md:border-t">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/urunler/${e.productId}`} className="font-medium text-ink hover:underline">
                        {e.productName}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {e.field === "SALE_PRICE" ? "Satış fiyatı" : "Alış (maliyet) fiyatı"} ·{" "}
                        {e.changedAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}
                        {e.relatedLabel}
                      </p>
                    </div>
                    <SignedPct value={e.deltaPct} />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="tabular text-ink-faint line-through">{formatTL(e.oldValue)}</span>
                    <span className="text-ink-faint">→</span>
                    <span className="tabular font-semibold text-ink">{formatTL(e.newValue)}</span>
                    <SignedTL value={e.deltaAbs} />
                  </div>

                  {e.field === "SALE_PRICE" ? (
                    <p className="mt-2 rounded-md bg-neutral-bg px-3 py-2 text-sm leading-relaxed text-ink-soft">
                      Bu fiyattan bu dönemde <strong className="tabular text-ink">{formatNumber(e.unitsSinceChange)} {e.unit}</strong> satıldı.
                      Eski fiyattan <strong className="tabular text-ink">{formatTL(e.revenueAtOldPrice ?? 0)}</strong> elde
                      edecektik, yeni fiyattan <strong className="tabular text-ink">{formatTL(e.revenueAtNewPrice ?? 0)}</strong> elde
                      ettik. Fark: <SignedTL value={e.revenueDiff ?? 0} />.
                    </p>
                  ) : (
                    e.unitsSinceChange > 0 && (
                      <p className="mt-2 rounded-md bg-neutral-bg px-3 py-2 text-sm leading-relaxed text-ink-soft">
                        Bu maliyetten bu dönemde <strong className="tabular text-ink">{formatNumber(e.unitsSinceChange)} {e.unit}</strong>{" "}
                        satıldı. Kâr marjına etkisi: <SignedTL value={e.marginImpact ?? 0} />.
                      </p>
                    )
                  )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
