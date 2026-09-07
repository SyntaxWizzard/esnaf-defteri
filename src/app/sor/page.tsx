import { AskView } from "@/components/ask/ask-view";

export default function AskPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Sor</h1>
      <p className="mt-1 text-sm text-ink-soft">Ürün ismiyle değil, cümleyle ara.</p>
      <div className="mt-5">
        <AskView />
      </div>
    </div>
  );
}
