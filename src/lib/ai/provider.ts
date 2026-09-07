import Anthropic from "@anthropic-ai/sdk";

/**
 * Tüm AI çağrıları bu modülden geçer — UI hiçbir zaman @anthropic-ai/sdk'yı
 * doğrudan import etmez. API anahtarı yoksa `isAvailable()` false döner ve
 * çağıran taraf (bkz inventory-analysis.ts, natural-language-query.ts)
 * kural-tabanlı bir fallback'e düşer, uygulama asla kırılmaz.
 */

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function isAiAvailable() {
  return getClient() !== null;
}

export async function askClaude(system: string, prompt: string): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const block = res.content[0];
    return block && block.type === "text" ? block.text : null;
  } catch {
    return null;
  }
}
