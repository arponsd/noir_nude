import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { NotFoundError } from "@/lib/api/response";
import { adminGetProduct } from "@/lib/services/admin-product";
import { listCategoryTreeService } from "@/lib/services/category";
import type { Category } from "@/types/api/categories";

export const metadata = { title: "Edit product — Admin" };
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

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product;
  try {
    product = await adminGetProduct(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const tree = await listCategoryTreeService();
  const categories = flattenCategories(tree);
  const matchedCategoryId = product.category
    ? categories.find((c) => c.slug === product.category!.slug)?.id
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
            Edit product
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)] tabular-nums">{product.slug}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/products">← Back to list</Link>
        </Button>
      </header>

      <ProductForm
        mode="edit"
        productId={id}
        initialProduct={product}
        categories={categories}
        {...(matchedCategoryId ? { initialCategoryId: matchedCategoryId } : {})}
      />
    </div>
  );
}
