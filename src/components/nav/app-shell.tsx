import Link from "next/link";
import { BottomTabs } from "./bottom-tabs";

/**
 * Mobil-öncelikli kabuk: üstte sade bir başlık şeridi + "Sor" girişi,
 * altta başparmakla ulaşılabilir 4 sekmelik tab bar. Klasik sol sidebar
 * bilinçli olarak kullanılmadı — esnaf telefonundan tek elle kullanacak.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col md:max-w-5xl">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-sm md:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg font-semibold tracking-tight">Esnaf Defteri</span>
        </Link>
        <Link
          href="/sor"
          className="flex items-center gap-1.5 rounded-full border border-line-strong bg-paper-raised px-3 py-1.5 text-sm text-ink-soft transition hover:border-ink-faint hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Sor
        </Link>
      </header>

      <main className="no-print flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10">{children}</main>

      <BottomTabs />
    </div>
  );
}
