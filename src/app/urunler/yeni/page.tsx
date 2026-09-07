import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/inventory/data";
import { QuickAddForm } from "@/components/shelf/quick-add-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const businessId = await getActiveBusinessId();
  const categories = await prisma.category.findMany({
    where: { businessId },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Ürün ekle</h1>
      <p className="mt-1 text-sm text-ink-soft">20 kutucuklu form yok — tek satır yaz, gerisini biz ayırırız.</p>
      <div className="mt-6">
        <QuickAddForm categories={categories.map((c) => c.name)} />
      </div>
    </div>
  );
}
