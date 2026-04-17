import searchAdapter from "@/lib/search/adapter";
import type { SearchSuggestion } from "@/types/api/search";

export async function suggestSearchService(q: string, limit: number): Promise<SearchSuggestion[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const raw = await searchAdapter.suggest(trimmed, limit);
  return raw.map((r) => {
    const out: SearchSuggestion = { slug: r.slug, name: r.name, brand: r.brand };
    if (r.thumb) out.thumbUrl = r.thumb;
    return out;
  });
}
