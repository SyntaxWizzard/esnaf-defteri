"use server";

import { getAllProductStatuses } from "@/lib/inventory/data";
import { answerNaturalLanguageQuery } from "@/lib/ai/natural-language-query";
import { getWeeklyFocusSummary } from "@/lib/ai/inventory-analysis";
import type { ProductStatus } from "@/lib/inventory/types";

export async function askAction(query: string): Promise<{ answerLine: string; products: ProductStatus[] }> {
  const statuses = await getAllProductStatuses();
  if (/bu hafta.*dikkat|neye dikkat/i.test(query)) {
    const answerLine = await getWeeklyFocusSummary(statuses);
    return { answerLine, products: [] };
  }
  return answerNaturalLanguageQuery(query, statuses);
}
