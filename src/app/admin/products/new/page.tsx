import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { listCategoryTreeService } from "@/lib/services/category";
import type { Category } from "@/types/api/categories";

export const metadata = { title: "New product — Admin" };
export const dynamic = "force-dynamic";

function flattenCategories(nodes: Awaited<ReturnType<typeof listCategoryTreeService>>): Category[] {
  const out: Category[] = [];
  for (const root of nodes) {
    const { children: _children, ...rest } = root;
    void _children;
    out.push(rest);
    for (const child of root.children) {
      const { children: _c2, ...childRest } = child;
      void _c2;
      out.push(childRest);
    }
  }
  return out;
}

export default async function NewProductPage() {
  const tree = await listCategoryTreeService();
  const categories = flattenCategories(tree);
  const firstId = categories[0]?.id;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
            New product
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Create a new catalog entry. Images and at least one variant are required.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/products">← Back to list</Link>
        </Button>
      </header>

      <ProductForm
        mode="create"
        categories={categories}
        {...(firstId ? { initialCategoryId: firstId } : {})}
      />
    </div>
  );
}
