import ProductSkeleton from "@/components/shop/ProductSkeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <div className="h-4 w-48 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-alt)]" />
      <div className="mt-6 flex items-end justify-between gap-4">
        <div className="h-12 w-64 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-alt)]" />
        <div className="h-9 w-44 animate-pulse rounded-full bg-[var(--bg-alt)]" />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-[var(--bg-alt)]" />
        ))}
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i}>
            <ProductSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
