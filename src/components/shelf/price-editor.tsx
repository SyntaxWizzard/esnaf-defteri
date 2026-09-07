"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTL } from "@/lib/format";
import { updatePricesAction } from "@/app/urunler/[id]/actions";

export function PriceEditor({
  productId,
  salePrice,
  costPrice,
  capitalAtRest,
}: {
  productId: string;
  salePrice: number;
  costPrice: number;
  capitalAtRest: number;
}) {
  const [editing, setEditing] = useState(false);
  const [sale, setSale] = useState(String(salePrice));
  const [cost, setCost] = useState(String(costPrice));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!editing) {
    return (
      <button
        onClick={() => {
          setSale(String(salePrice));
          setCost(String(costPrice));
          setError(null);
          setEditing(true);
        }}
        className="mt-1 flex items-center gap-1.5 text-sm text-ink-faint underline decoration-dotted underline-offset-4 hover:text-ink"
      >
        {formatTL(salePrice)} satış · {formatTL(costPrice)} alış · rafta {formatTL(capitalAtRest)}
        <span className="text-xs text-ink-faint">(düzenle)</span>
      </button>
    );
  }

  function save() {
    const saleNum = Number(sale.replace(",", "."));
    const costNum = Number(cost.replace(",", "."));
    startTransition(async () => {
      const res = await updatePricesAction(productId, saleNum, costNum);
      if (!res.ok) {
        setError(res.error ?? "Kaydedilemedi.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <label className="block">
        <span className="text-xs text-ink-faint">Satış fiyatı</span>
        <input
          type="number"
          step="0.01"
          value={sale}
          onChange={(e) => setSale(e.target.value)}
          className="input mt-0.5 w-28 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-xs text-ink-faint">Alış fiyatı</span>
        <input
          type="number"
          step="0.01"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="input mt-0.5 w-28 py-1.5 text-sm"
        />
      </label>
      <button
        onClick={save}
        disabled={isPending}
        className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </button>
      <button onClick={() => setEditing(false)} className="rounded-full border border-line-strong px-4 py-1.5 text-sm text-ink-soft">
        Vazgeç
      </button>
      {error && <p className="w-full text-sm text-urgent">{error}</p>}
    </div>
  );
}
