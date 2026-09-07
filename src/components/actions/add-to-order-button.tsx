"use client";

import { useState } from "react";
import clsx from "clsx";
import { useOrderDraft } from "@/lib/store/order-draft";

export function AddToOrderButton({
  productId,
  productName,
  unit,
  costPrice,
  suggestedQty,
}: {
  productId: string;
  productName: string;
  unit: string;
  costPrice: number;
  suggestedQty: number;
}) {
  const addOrIncrease = useOrderDraft((s) => s.addOrIncrease);
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        addOrIncrease({ productId, productName, unit, costPrice }, Math.max(suggestedQty, 1));
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      className={clsx(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        added
          ? "border-good bg-good-bg text-good"
          : "border-line-strong bg-paper-raised text-ink hover:border-ink-faint",
      )}
    >
      {added ? "Eklendi ✓" : "Siparişe ekle"}
    </button>
  );
}
