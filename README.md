# Esnaf Defteri — Akıllı Stok Takip Sistemi

Bir esnafın telefonundan açıp "bugün ne yapmam gerekiyor?" sorusunun cevabını
5 saniyede alabileceği bir stok yardımcısı. Klasik admin-panel / ERP-dashboard
kalıplarından bilinçli olarak uzak duruldu — tasarım kararlarının gerekçeleri
için aşağıya bakın.

## Kurulum

```bash
cp .env.example .env      # DATABASE_URL'i kendi Postgres bağlantınızla doldurun
npm install
npx prisma migrate deploy
npm run seed               # gerçekçi demo veri seti oluşturur (108 ürün, ~6800 satış)
npm run dev
```

Windows'ta tek dosyayla başlatmak için `baslat.bat` dosyasına çift tıklayın —
paketleri kurar, şemayı uygular, ilk çalıştırmada demo veriyi oluşturur ve
uygulamayı açar (bunun için de önce `.env` dosyasını oluşturmanız gerekir).

`http://localhost:3000` açın. Giriş ekranı yok — tek işletmelik demo kurulumu
doğrudan "Bugün" ekranına düşer.

### Veritabanı

Prisma şeması `provider = "postgresql"` — gerçek bir Postgres sunucusuna karşı
çalışır, SQLite değil. `.env.example`'ı `.env` olarak kopyalayıp
`DATABASE_URL`'i kendi Postgres bağlantınızla doldurmanız yeterli
(`postgresql://KULLANICI:SIFRE@HOST:5432/VERITABANI`).

## Tasarım kararları (özet)

- **Ana ekran "Bugün"**, dashboard değil. Esnaf stok listesini incelemek
  zorunda kalmasın diye sistem bugün ne olduğunu doğrudan anlatıyor: satış
  özeti, hızlanan ürünler, ölü stok, rafta bekleyen para, gerekçeli aksiyon
  listesi.
- **Stok hiçbir yerde bir sayı olarak tutulmuyor.** `Product` modelinde
  `stock` alanı yok — her ürünün mevcut miktarı `StockMovement` (PURCHASE /
  SALE / DAMAGE / ADJUSTMENT / RETURN / INITIAL) event log'unun toplamından
  türetiliyor (`src/lib/inventory/stock.ts`). "Geçen ay bu üründen neden 30
  adet eksildi?" sorusuna her zaman cevap verilebiliyor.
- **Fiyat değişimleri de aynı şekilde immutable loglanıyor** (`PriceChange`
  modeli) — bir ürünün satış/maliyet fiyatı her değiştiğinde eski/yeni değer,
  tarih ve kaynak (elle düzenleme ya da tedarikçi siparişi) kalıcı olarak
  kaydediliyor; "Fiyat Değişimleri" ekranı bunun üzerinden ciro/kâr etkisini
  hesaplıyor.
- **Raf görünümü** ürünleri tablo değil, satış hızını yatay bir çubukla
  anlatan satırlar olarak gösteriyor — hem mobilde hem masaüstünde (masaüstü
  ekstra genişliği çok sütunlu bir raf'a çeviriyor, tek sütunu germiyor).
- **Görsel dil**: kağıt/kraft tonları, serif başlıklar (Fraunces), tabular
  mono rakamlar, fiş kesik-çizgi motifi (`torn-edge` — ürün geçmişinde
  kullanılıyor). Mor/lacivert SaaS gradyanı, glassmorphism, kart yığınları
  kasıtlı olarak yok.
- **Renk = anlam.** Kırmızı: acil aksiyon, turuncu: dikkat, yeşil: normal,
  mavi: bilgi, gri: nötr. Tek bir vurgu rengi baskın değil.
- **Mobil öncelik.** Alt sekme çubuğu (Bugün / Ürünler / Satış / Sipariş /
  Fiyatlar), tek elle kullanılabilir büyük dokunma alanları, az modal, az
  input.

## Mimari

```
prisma/schema.prisma      Event tabanlı stok modeli (StockMovement immutable)
prisma/seed.ts             Gerçekçi demo veri + bilinçli senaryolar
                            (hızla tükenen ürün, 14/30/60+ gün ölü stok,
                             yanlış sayım düzeltmesi, düşük/yüksek marj,
                             geçmiş fiyat değişimleri)

src/lib/inventory/         Domain mantığı — stok türetme, satış hızı,
                            "bugün" briefing'i, aksiyon listesi, ölü stok
                            bucket'ları, fiyat değişimi finansal etki hesabı,
                            doğal dil hızlı ürün ekleme parser'ı

src/lib/ai/                provider.ts        Claude API abstraction (opsiyonel)
                            natural-language-query.ts  "Sor" ekranı
                            inventory-analysis.ts      haftalık odak özeti
                            purchasing-advisor.ts      tedarikçi mesajı üretimi

src/components/            shelf/ (raf), sale/ (satış girişi), order/ (sipariş),
                            ask/ (doğal dil arama), nav/ (mobil-first kabuk)

src/app/                   Next.js App Router sayfaları + server action'lar
```

## Bilinçli kapsam dışı bırakılanlar

- **Auth.js entegre edilmedi.** Şemada `User`/`Business` ayrımı hazır ama tek
  işletmelik demo bir login duvarına ihtiyaç duymuyordu; gerçek çoklu-esnaf
  kullanımda tek yapılması gereken `getActiveBusinessId()` fonksiyonunu oturum
  bilgisine bağlamak (`src/lib/inventory/data.ts`).
- **Barkod okuma** donanım/kamera erişimi gerektirdiği için bu ortamda test
  edilemedi; mimari hazır (`Product.barcode` alanı, hızlı ürün ekleme akışı
  barkod input'unu zaten kabul ediyor) — gerçek bir kamera/BarcodeDetector
  entegrasyonu tek ekleme.
