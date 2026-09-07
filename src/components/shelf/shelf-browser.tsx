"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import type { ProductStatus } from "@/lib/inventory/types";
import { ShelfRow } from "./shelf-row";

const FILTERS: { key: string; label: string; test: (p: ProductStatus) => boolean }[] = [
  { key: "all", label: "Tümü", test: () => true },
  { key: "critical", label: "Acil", test: (p) => p.status === "critical" },
  { key: "watch", label: "Hızlanıyor", test: (p) => p.status === "watch" },
  { key: "dead", label: "Hareketsiz", test: (p) => p.status === "dead" },
  { key: "overstocked", label: "Fazla stok", test: (p) => p.status === "overstocked" },
];

export function ShelfBrowser({
  statuses,
  initialFilter = "all",
}: {
  statuses: ProductStatus[];
  initialFilter?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  const maxVelocity = useMemo(
    () => Math.max(1, ...statuses.map((p) => p.currentVelocity)),
    [statuses],
  );

  const filtered = useMemo(() => {
    const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    return statuses
      .filter(activeFilter.test)
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => b.currentVelocity - a.currentVelocity);
  }, [statuses, filter, query]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün ara..."
          className="flex-1 rounded-full border border-line-strong bg-paper-raised px-4 py-2 text-sm placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
        />
        <Link
          href="/urunler/yeni"
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          + Ürün
        </Link>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
              filter === f.key
                ? "border-ink bg-ink text-paper"
                : "border-line-strong text-ink-soft",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">Bu kritere uyan ürün yok.</p>
        ) : (
          <div className="md:columns-2 md:gap-x-8 lg:columns-3">
            {filtered.map((p) => (
              <div key={p.id} className="break-inside-avoid">
                <ShelfRow product={p} maxVelocity={maxVelocity} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
