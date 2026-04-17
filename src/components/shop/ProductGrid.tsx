import { cn } from "@/lib/utils/cn";
import ProductCard, { type ProductCardDTO } from "./ProductCard";

export interface ProductGridProps {
  products: ProductCardDTO[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  emptyMessage?: string;
}

const COLUMN_CLASSES: Record<NonNullable<ProductGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export default function ProductGrid({
  products,
  columns = 4,
  className,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className={cn("py-12 text-center text-sm text-[var(--ink-soft)]", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10",
        COLUMN_CLASSES[columns],
        className,
      )}
    >
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
