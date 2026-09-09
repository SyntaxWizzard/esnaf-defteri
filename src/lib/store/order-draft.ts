"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderDraftLine = {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  costPrice: number;
};

type OrderDraftState = {
  lines: OrderDraftLine[];
  addOrIncrease: (line: Omit<OrderDraftLine, "quantity">, qty: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  setCostPrice: (productId: string, costPrice: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useOrderDraft = create<OrderDraftState>()(
  persist(
    (set) => ({
      lines: [],
      addOrIncrease: (line, qty) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === line.productId ? { ...l, quantity: l.quantity + qty } : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: qty }] };
        }),
      setQuantity: (productId, qty) =>
        set((state) => ({
          lines: qty <= 0
            ? state.lines.filter((l) => l.productId !== productId)
            : state.lines.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
        })),
      setCostPrice: (productId, costPrice) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.productId === productId ? { ...l, costPrice } : l)),
        })),
      remove: (productId) => set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "esnaf-order-draft" },
  ),
);
