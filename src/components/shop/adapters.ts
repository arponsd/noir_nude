import type { ProductCard as ApiProductCard } from "@/types/api/products";
import type { ProductCardDTO } from "./ProductCard";

/**
 * Adapt an API `ProductCard` (from /src/types/api/products) to the shape expected
 * by the presentational `ProductCard` component.
 */
export function toCardDTO(p: ApiProductCard): ProductCardDTO {
  const dto: ProductCardDTO = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    image: {
      url: p.thumbUrl ?? "https://picsum.photos/seed/glowcart-" + p.slug + "/600/750",
      alt: p.name,
    },
    basePrice: p.basePrice,
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      image: v.image ?? null,
    })),
  };
  if (p.comparePrice !== undefined) dto.comparePrice = p.comparePrice;
  return dto;
}

export function toCardDTOs(items: ApiProductCard[]): ProductCardDTO[] {
  return items.map(toCardDTO);
}
