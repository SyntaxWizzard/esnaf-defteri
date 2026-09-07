"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { askAction } from "@/app/sor/actions";
import type { ProductStatus } from "@/lib/inventory/types";
import { formatNumber, formatTL } from "@/lib/format";
import { StatusPill } from "@/components/ui/status-pill";

const SUGGESTIONS = [
  "Son 7 günde en hızlı satan ürünler",
  "Yarın bitecek ürünler",
  "1000 liradan fazla sermayenin bağlı olduğu ürünler",
  "Son 30 gündür satılmayanlar",
  "Bu ay en çok kazandıran ürün",
  "Bu hafta neye dikkat etmeliyim?",
];

export function AskView() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ answerLine: string; products: ProductStatus[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  function ask(q: string) {
    setQuery(q);
    startTransition(async () => {
      const res = await askAction(q);
      setResult(res);
    });
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) ask(query.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bir şey sor..."
          className="input py-3 text-base"
        />
        <button type="submit" className="shrink-0 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper">
          Sor
        </button>
      </form>

      {!result && (
        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-line-strong px-3 py-1.5 text-sm text-ink-soft hover:border-ink-faint hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {isPending && <p className="mt-6 text-sm text-ink-faint">Düşünüyor...</p>}

      {result && !isPending && (
        <div className="mt-6">
          <p className="font-serif text-lg italic text-ink">{result.answerLine}</p>
          {result.products.length > 0 && (
            <div className="mt-4 divide-y divide-line border-y border-line">
              {result.products.slice(0, 15).map((p) => (
                <Link
                  key={p.id}
                  href={`/urunler/${p.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-paper-raised"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-faint">
                      {formatNumber(p.currentStock)} {p.unit} · rafta {formatTL(p.capitalAtRest)}
                    </p>
                  </div>
                  <StatusPill status={p.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
