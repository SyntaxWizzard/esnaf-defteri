import { PrismaClient, StockMovementReason } from "@prisma/client";
import { startOfDay, subDays } from "date-fns";

const prisma = new PrismaClient();

// Basit, deterministik pseudo-random üretici — her `npm run seed` çalıştığında
// aynı, tutarlı demo veri seti oluşur.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260907);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]) => arr[randInt(0, arr.length - 1)];
const poisson = (lambda: number) => {
  // Küçük lambda'lar için basit yaklaşık poisson örneklemesi
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L);
  return k - 1;
};

const TODAY = startOfDay(new Date());
// 75 günlük geçmiş: "60+ gündür satılmıyor" gibi ölü stok senaryolarının
// gerçekten önce satılıp sonra durduğunu gösterebilmek için pencere geniş tutuldu.
const HISTORY_DAYS = 75;

type Archetype = "fast_spike" | "dead_14" | "dead_30" | "dead_60" | "wrong_count" | "normal";

type ProductSeed = {
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  baseDailyVelocity: number; // "normal" günlerdeki ortalama günlük satış
  archetype: Archetype;
};

const CATEGORIES = [
  "İçecekler",
  "Atıştırmalıklar",
  "Süt Ürünleri",
  "Temizlik",
  "Kişisel Bakım",
  "Kırtasiye",
  "Bebek Ürünleri",
  "Dondurulmuş Gıda",
  "Konserve & Bakliyat",
  "Ekmek & Fırın",
];

// Anlatıdaki örneklerle birebir eşleşen, elle seçilmiş "hikayeli" ürünler.
const FEATURED: ProductSeed[] = [
  { name: "Coca Cola 330ml", category: "İçecekler", unit: "adet", costPrice: 15, salePrice: 25, baseDailyVelocity: 8, archetype: "fast_spike" },
  { name: "Su 500ml", category: "İçecekler", unit: "adet", costPrice: 4, salePrice: 7, baseDailyVelocity: 20, archetype: "fast_spike" },
  { name: "Sütlü Çikolata 80g", category: "Atıştırmalıklar", unit: "adet", costPrice: 18, salePrice: 32, baseDailyVelocity: 6, archetype: "fast_spike" },
  { name: "Limonlu Gazoz 1L", category: "İçecekler", unit: "adet", costPrice: 12, salePrice: 22, archetype: "dead_60" as Archetype, baseDailyVelocity: 2 },
  { name: "El Yapımı Sabun", category: "Kişisel Bakım", unit: "adet", costPrice: 22, salePrice: 45, archetype: "dead_30" as Archetype, baseDailyVelocity: 1.5 },
  { name: "Yılbaşı Kurabiyesi", category: "Atıştırmalıklar", unit: "paket", costPrice: 30, salePrice: 55, archetype: "dead_60" as Archetype, baseDailyVelocity: 1 },
  { name: "Kayısı Reçeli 380g", category: "Konserve & Bakliyat", unit: "adet", costPrice: 28, salePrice: 48, archetype: "wrong_count" as Archetype, baseDailyVelocity: 2 },
];

const BASE_NAMES: Record<string, { names: string[]; unit: string; costRange: [number, number]; marginRange: [number, number] }> = {
  "İçecekler": { names: ["Kola", "Fanta", "Sprite", "Ayran", "Meyve Suyu", "Enerji İçeceği", "Buzlu Çay", "Maden Suyu", "Kutu Kola", "Portakal Suyu", "Soda", "Limonata"], unit: "adet", costRange: [4, 20], marginRange: [1.4, 1.9] },
  "Atıştırmalıklar": { names: ["Cips", "Bisküvi", "Kraker", "Fındık Ezmesi", "Gofret", "Kuruyemiş Karışık", "Şekerleme", "Sakız", "Mısır Cipsi", "Leblebi", "Baton Çikolata", "Kek"], unit: "adet", costRange: [8, 35], marginRange: [1.6, 2.2] },
  "Süt Ürünleri": { names: ["Tam Yağlı Süt 1L", "Yoğurt 1kg", "Beyaz Peynir 500g", "Kaşar Peyniri 400g", "Tereyağı 250g", "Ayran 1L", "Kefir 500ml", "Krema 200ml", "Labne 300g", "Süzme Yoğurt"], unit: "adet", costRange: [20, 80], marginRange: [1.3, 1.6] },
  "Temizlik": { names: ["Bulaşık Deterjanı", "Çamaşır Deterjanı", "Yüzey Temizleyici", "Çamaşır Suyu", "Sıvı Sabun", "Cam Silici", "Tuvalet Kağıdı 8'li", "Kağıt Havlu", "Bulaşık Süngeri", "Oda Kokusu"], unit: "adet", costRange: [25, 120], marginRange: [1.3, 1.7] },
  "Kişisel Bakım": { names: ["Diş Macunu", "Şampuan", "Duş Jeli", "Tıraş Köpüğü", "Deodorant", "Islak Mendil", "Pamuk", "Diş Fırçası", "El Kremi", "Güneş Kremi"], unit: "adet", costRange: [20, 90], marginRange: [1.4, 2.0] },
  "Kırtasiye": { names: ["A4 Kağıt Paketi", "Tükenmez Kalem", "Defter", "Silgi", "Kalemtıraş", "Yapıştırıcı", "Zımba", "Dosya", "Boya Kalemi Seti", "Cetvel"], unit: "adet", costRange: [5, 60], marginRange: [1.5, 2.3] },
  "Bebek Ürünleri": { names: ["Bebek Bezi Paketi", "Islak Mendil Bebek", "Bebek Şampuanı", "Biberon", "Bebek Pudrası", "Mama Kavanozu", "Bebek Yağı", "Bebek Kolonyası", "Emzik", "Bebek Sabunu"], unit: "adet", costRange: [40, 150], marginRange: [1.3, 1.7] },
  "Dondurulmuş Gıda": { names: ["Dondurma 1L", "Donuk Patates Kızartması", "Donuk Sebze Karışımı", "Donuk Mantı", "Dondurulmuş Pizza", "Donuk Köfte", "Donuk Balık", "Dondurulmuş Waffle"], unit: "adet", costRange: [30, 100], marginRange: [1.4, 1.8] },
  "Konserve & Bakliyat": { names: ["Domates Konservesi", "Nohut 1kg", "Mercimek 1kg", "Pirinç 1kg", "Ton Balığı Konservesi", "Fasulye 1kg", "Bulgur 1kg", "Zeytin 500g", "Salça 700g", "Mısır Konservesi"], unit: "adet", costRange: [15, 70], marginRange: [1.2, 1.5] },
  "Ekmek & Fırın": { names: ["Ekmek", "Simit", "Poğaça", "Tam Buğday Ekmeği", "Kepekli Ekmek", "Baget Ekmek", "Açma", "Çörek", "Pide"], unit: "adet", costRange: [4, 15], marginRange: [1.4, 1.8] },
};

function buildProductCatalog(): ProductSeed[] {
  const list: ProductSeed[] = [...FEATURED];
  const usedNames = new Set(list.map((p) => p.name));

  for (const category of CATEGORIES) {
    const cfg = BASE_NAMES[category];
    for (const base of cfg.names) {
      if (list.filter((p) => p.category === category).length >= 15) break;
      const cost = randInt(cfg.costRange[0], cfg.costRange[1]);
      const margin = cfg.marginRange[0] + rand() * (cfg.marginRange[1] - cfg.marginRange[0]);
      const sale = Math.round(cost * margin);
      let name = base;
      if (usedNames.has(name)) name = `${base} (${category.slice(0, 3)})`;
      usedNames.add(name);

      const roll = rand();
      let archetype: Archetype = "normal";
      if (roll < 0.06) archetype = "dead_60";
      else if (roll < 0.13) archetype = "dead_30";
      else if (roll < 0.22) archetype = "dead_14";
      else if (roll < 0.3) archetype = "fast_spike";

      list.push({
        name,
        category,
        unit: cfg.unit,
        costPrice: cost,
        salePrice: sale,
        baseDailyVelocity: archetype === "dead_14" || archetype === "dead_30" || archetype === "dead_60"
          ? 1 + rand() * 2
          : 1 + rand() * 6,
        archetype,
      });
    }
  }
  return list;
}

async function main() {
  console.log("Mevcut veriler temizleniyor...");
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: { name: "Yeşil Vadi Market", kind: "market" },
  });

  await prisma.user.create({
    data: {
      email: "esnaf@yesilvadi.market",
      name: "Ahmet Esnaf",
      businessId: business.id,
    },
  });

  const categoryMap = new Map<string, string>();
  for (const name of CATEGORIES) {
    const c = await prisma.category.create({ data: { name, businessId: business.id } });
    categoryMap.set(name, c.id);
  }

  const supplierNames = [
    "Anadolu Gıda Dağıtım", "Marmara İçecek", "Sütaş Bayi", "Temizlik Dünyası Toptan",
    "Kaan Kırtasiye Toptan", "Bebek Dünyası Dağıtım", "Fırın Ürünleri Lojistik",
    "Konserve Sanayi A.Ş.", "Dondurulmuş Gıda Soğuk Zincir", "Kişisel Bakım Toptancısı",
  ];
  const suppliers = [];
  for (const name of supplierNames) {
    suppliers.push(await prisma.supplier.create({ data: { name, businessId: business.id, phone: `0532 ${randInt(100, 999)} ${randInt(10, 99)} ${randInt(10, 99)}` } }));
  }

  const catalog = buildProductCatalog();
  console.log(`${catalog.length} ürün oluşturuluyor...`);

  let totalSales = 0;
  let totalMovements = 0;

  for (const spec of catalog) {
    const product = await prisma.product.create({
      data: {
        name: spec.name,
        categoryId: categoryMap.get(spec.category),
        businessId: business.id,
        salePrice: spec.salePrice,
        costPrice: spec.costPrice,
        unit: spec.unit,
        barcode: String(randInt(8690000000000, 8699999999999)),
      },
    });

    const openingStart = subDays(TODAY, HISTORY_DAYS);
    const initialQty = randInt(60, 220);
    let runningStock = initialQty;
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: initialQty,
        reason: StockMovementReason.INITIAL,
        createdAt: openingStart,
        note: "Açılış stoğu",
      },
    });
    totalMovements++;

    // Satın almalar, günlük satış simülasyonuyla aynı kronolojik döngüde
    // planlanır (aşağıda) — böylece stok hiçbir zaman eksiye düşmez: her
    // satış o anki gerçek mevcut stokla sınırlıdır.
    let nextPurchaseAt = HISTORY_DAYS - randInt(8, 14);

    // Kronolojik simülasyon (en eski günden bugüne): her gün önce planlanmış
    // bir satın alma varsa stoğa eklenir, sonra o günün satışı işlenir.
    // Satış miktarı asla o andaki mevcut stoktan fazla olamaz — bu yüzden
    // stok hiçbir zaman eksiye düşmez.
    for (let d = HISTORY_DAYS; d >= 0; d--) {
      const date = subDays(TODAY, d);

      if (d === nextPurchaseAt && d > 0) {
        const supplier = pick(suppliers);
        const target = Math.max(30, Math.round(spec.baseDailyVelocity * 14 * (0.8 + rand() * 0.5)));
        const qty = Math.max(20, target - runningStock > 0 ? target : randInt(30, 90));
        const purchase = await prisma.purchase.create({
          data: { businessId: business.id, supplierId: supplier.id, createdAt: date },
        });
        const item = await prisma.purchaseItem.create({
          data: { purchaseId: purchase.id, productId: product.id, quantity: qty, unitCost: spec.costPrice },
        });
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            quantity: qty,
            reason: StockMovementReason.PURCHASE,
            createdAt: date,
            purchaseItemId: item.id,
          },
        });
        runningStock += qty;
        totalMovements++;
        nextPurchaseAt = d - randInt(10, 14);
      }

      if (spec.archetype === "wrong_count" && d === 6 && runningStock > 0) {
        const adjust = -Math.min(runningStock, randInt(4, 9));
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            quantity: adjust,
            reason: StockMovementReason.ADJUSTMENT,
            createdAt: date,
            note: "Sayım düzeltmesi — fiziksel sayımda eksik çıktı",
          },
        });
        runningStock += adjust;
        totalMovements++;
      }

      let lambda = spec.baseDailyVelocity;
      if (spec.archetype === "dead_14" && d < 14) lambda = 0;
      if (spec.archetype === "dead_30" && d < 30) lambda = 0;
      if (spec.archetype === "dead_60" && d < 60) lambda = 0; // tüm pencere içinde satılmadı
      if (spec.archetype === "fast_spike" && d <= 3) lambda = spec.baseDailyVelocity * (2 + rand());

      const desired = poisson(lambda);
      const qtySold = Math.min(desired, runningStock);
      if (qtySold <= 0) continue;

      const saleTime = new Date(date);
      saleTime.setHours(randInt(9, 20), randInt(0, 59), 0, 0);

      const sale = await prisma.sale.create({ data: { businessId: business.id, createdAt: saleTime } });
      const saleItem = await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: product.id,
          quantity: qtySold,
          unitPrice: spec.salePrice,
          unitCost: spec.costPrice,
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: -qtySold,
          reason: StockMovementReason.SALE,
          createdAt: saleTime,
          saleItemId: saleItem.id,
        },
      });
      runningStock -= qtySold;
      totalSales++;
      totalMovements++;
    }
  }

  console.log(`Bitti: ${catalog.length} ürün, ${totalSales} satış işlemi, ${totalMovements} stok hareketi.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
