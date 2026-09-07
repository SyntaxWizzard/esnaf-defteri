"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTL } from "@/lib/format";
import { completeSaleAction } from "@/app/satis/actions";

type Product = { id: string; name: string; unit: string; salePrice: number; currentStock: number };
type CartLine = { productId: string; name: string; unit: string; salePrice: number; quantity: number };

export function SaleEntry({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, products]);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: p.id, name: p.name, unit: p.unit, salePrice: p.salePrice, quantity: 1 }];
    });
    setQuery("");
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
    );
  }

  const total = cart.reduce((sum, l) => sum + l.quantity * l.salePrice, 0);
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  function complete() {
    startTransition(async () => {
      const res = await completeSaleAction(cart.map((l) => ({ productId: l.productId, quantity: l.quantity })));
      if (res.ok) {
        setDone(true);
        setCart([]);
        router.refresh();
        setTimeout(() => setDone(false), 2200);
      }
    });
  }

  return (
    <div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün ara, dokun, ekle..."
          className="input py-3 text-base"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line-strong bg-paper-raised shadow-md">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-paper"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span className="tabular text-sm text-ink-soft">{formatTL(p.salePrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        {cart.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-faint">Sepet boş. Yukarıdan ürün ara.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((l) => (
              <div key={l.productId} className="flex items-center gap-3 rounded-lg border border-line bg-paper-raised px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{l.name}</p>
                  <p className="tabular text-xs text-ink-faint">{formatTL(l.salePrice)} / {l.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(l.productId, l.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-lg text-ink"
                  >
                    −
                  </button>
                  <span className="tabular w-6 text-center font-semibold">{l.quantity}</span>
                  <button
                    onClick={() => setQty(l.productId, l.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-lg text-ink"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-3xl border-t border-line bg-paper-raised px-4 py-3 md:static md:mt-6 md:rounded-lg md:border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-soft">{itemCount} ürün</p>
              <p className="tabular font-mono text-xl font-semibold text-ink">{formatTL(total)}</p>
            </div>
            <button
              onClick={complete}
              disabled={isPending}
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper disabled:opacity-60"
            >
              {isPending ? "Kaydediliyor..." : "Satışı tamamla"}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="fixed inset-x-4 bottom-24 z-20 rounded-lg bg-good-bg px-4 py-3 text-center text-sm font-medium text-good shadow-md md:static md:mt-4">
          Satış kaydedildi ✓
        </div>
      )}
    </div>
  );
}
