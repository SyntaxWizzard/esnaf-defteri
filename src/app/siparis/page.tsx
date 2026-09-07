import { OrderDraftView } from "@/components/order/order-draft-view";

export default function OrderPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Bugün sipariş ver</h1>
      <p className="mt-1 text-sm text-ink-soft">Miktarları ayarla, tedarikçine gönderilecek mesajı hazırla.</p>
      <div className="mt-5">
        <OrderDraftView />
      </div>
    </div>
  );
}
