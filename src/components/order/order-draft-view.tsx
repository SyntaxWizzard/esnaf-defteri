"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useOrderDraft } from "@/lib/store/order-draft";
import { formatTL } from "@/lib/format";
import { buildSupplierMessage } from "@/lib/ai/purchasing-advisor";
import { receivePurchaseAction } from "@/app/siparis/actions";

export function OrderDraftView() {
  const lines = useOrderDraft((s) => s.lines);
  const setQuantity = useOrderDraft((s) => s.setQuantity);
  const remove = useOrderDraft((s) => s.remove);
  const clear = useOrderDraft((s) => s.clear);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const total = lines.reduce((sum, l) => sum + l.quantity * l.costPrice, 0);

  function prepareMessage() {
    setMessage(buildSupplierMessage(lines.map((l) => ({ productName: l.productName, quantity: l.quantity, unit: l.unit }))));
  }

  function copyMessage() {
    if (!message) return;
    navigator.clipboard?.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  function markReceived() {
    startTransition(async () => {
      await receivePurchaseAction(lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.costPrice })));
      clear();
      setMessage(null);
      router.refresh();
    });
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink-faint">Sipariş listen boş.</p>
        <p className="mt-1 text-sm text-ink-faint">
          "Bugün" veya "Raf" ekranlarından "Siparişe ekle" diyerek buraya ürün ekleyebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {lines.map((l) => (
          <div key={l.productId} className="flex items-center gap-3 rounded-lg border border-line bg-paper-raised px-3.5 py-2.5">
            <p className="min-w-0 flex-1 truncate font-medium text-ink">{l.productName}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(l.productId, l.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-lg text-ink"
              >
                −
              </button>
              <span className="tabular w-10 text-center font-semibold">
                {l.quantity} <span className="text-xs font-normal text-ink-faint">{l.unit}</span>
              </span>
              <button
                onClick={() => setQuantity(l.productId, l.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-lg text-ink"
              >
                +
              </button>
            </div>
            <button onClick={() => remove(l.productId)} className="text-ink-faint hover:text-urgent" aria-label="Kaldır">
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-y border-line py-4">
        <p className="text-sm text-ink-soft">Tahmini toplam</p>
        <p className="tabular font-mono text-xl font-semibold text-ink">{formatTL(total)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={prepareMessage} className="flex-1 rounded-full bg-ink py-3 text-sm font-medium text-paper">
          Listeyi hazırla
        </button>
        <button
          onClick={markReceived}
          disabled={isPending}
          className="flex-1 rounded-full border border-line-strong py-3 text-sm font-medium text-ink disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor..." : "Teslim alındı, stoğa ekle"}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-line bg-paper-raised p-4">
          <p className="whitespace-pre-line font-serif text-sm italic leading-relaxed text-ink">{message}</p>
          <button onClick={copyMessage} className="mt-3 text-sm font-medium text-info hover:underline">
            {copied ? "Kopyalandı ✓" : "Mesajı kopyala"}
          </button>
        </div>
      )}
    </div>
  );
}
