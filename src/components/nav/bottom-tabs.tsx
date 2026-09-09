"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Bugün", icon: SunIcon },
  { href: "/urunler", label: "Ürünler", icon: ShelfIcon },
  { href: "/satis", label: "Satış", icon: TagIcon },
  { href: "/siparis", label: "Sipariş", icon: BoxIcon },
  { href: "/fiyat-degisimleri", label: "Fiyatlar", icon: PriceChangeIcon },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper-raised/95 backdrop-blur-sm md:static md:border-t-0 md:bg-transparent">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around md:max-w-5xl md:justify-start md:gap-2 md:px-8 md:pb-4">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs md:flex-none md:flex-row md:gap-2 md:rounded-full md:border md:px-4 md:py-2 md:text-sm",
                active
                  ? "text-ink md:border-ink md:bg-ink md:text-paper"
                  : "text-ink-faint md:border-line md:text-ink-soft",
              )}
            >
              <Icon active={active} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function ShelfIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M4 6h16M4 6v13M20 6v13M4 12h16M8 12v7M12 12v7M16 12v7" />
    </svg>
  );
}
function TagIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M3 12V4h8l10 10-8 8L3 12Z" />
      <circle cx="7.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function BoxIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  );
}
function PriceChangeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
