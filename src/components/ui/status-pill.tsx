import clsx from "clsx";
import type { ProductStatus } from "@/lib/inventory/types";

const CONFIG: Record<ProductStatus["status"], { label: string; fg: string; bg: string }> = {
  critical: { label: "Acil", fg: "text-urgent", bg: "bg-urgent-bg" },
  watch: { label: "Hızlanıyor", fg: "text-attention", bg: "bg-attention-bg" },
  overstocked: { label: "Fazla stok", fg: "text-attention", bg: "bg-attention-bg" },
  dead: { label: "Hareketsiz", fg: "text-neutral", bg: "bg-neutral-bg" },
  healthy: { label: "Normal", fg: "text-good", bg: "bg-good-bg" },
};

export function StatusPill({ status, className }: { status: ProductStatus["status"]; className?: string }) {
  const c = CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        c.fg,
        c.bg,
        className,
      )}
    >
      {c.label}
    </span>
  );
}
