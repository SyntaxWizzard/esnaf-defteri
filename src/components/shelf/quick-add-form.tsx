"use client";

import { useMemo, useState } from "react";
import { parseQuickAddLine } from "@/lib/inventory/quick-add";
import { createProductAction } from "@/app/urunler/yeni/actions";

export function QuickAddForm({ categories }: { categories: string[] }) {
  const [line, setLine] = useState("");
  const parsed = useMemo(() => parseQuickAddLine(line), [line]);

  return (
    <form action={createProductAction} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-ink">Tek satırda yaz</label>
        <textarea
          value={line}
          onChange={(e) => setLine(e.target.value)}
          rows={2}
          placeholder="Coca Cola 330ml 25 TL satış 15 TL alış 48 adet"
          className="mt-1.5 w-full resize-none rounded-lg border border-line-strong bg-paper-raised px-3.5 py-3 text-base placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Ne yazdığını otomatik ayırıyoruz — eksik kalanları aşağıdan tamamlarsın. Barkod okutma da desteklenecek.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ürün adı">
          <input
            name="name"
            defaultValue={parsed.name}
            key={`name-${parsed.name}`}
            required
            className="input"
          />
        </Field>
        <Field label="Kategori">
          <input name="category" list="category-list" placeholder="ör. İçecekler" className="input" />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Satış fiyatı (₺)">
          <input
            name="salePrice"
            type="number"
            step="0.01"
            defaultValue={parsed.salePrice ?? ""}
            key={`sale-${parsed.salePrice}`}
            required
            className="input"
          />
        </Field>
        <Field label="Alış fiyatı (₺)">
          <input
            name="costPrice"
            type="number"
            step="0.01"
            defaultValue={parsed.costPrice ?? ""}
            key={`cost-${parsed.costPrice}`}
            required
            className="input"
          />
        </Field>
        <Field label="Başlangıç stoğu">
          <input
            name="quantity"
            type="number"
            defaultValue={parsed.quantity ?? 0}
            key={`qty-${parsed.quantity}`}
            className="input"
          />
        </Field>
        <Field label="Birim">
          <select name="unit" defaultValue={parsed.unit} key={`unit-${parsed.unit}`} className="input">
            {["adet", "kg", "gr", "lt", "paket", "kutu"].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Barkod (opsiyonel)">
        <input name="barcode" placeholder="Barkod okutulduğunda otomatik dolar" className="input" />
      </Field>

      <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper">
        Ürünü ekle
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
