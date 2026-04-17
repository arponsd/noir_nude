import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerDetailView from "@/components/admin/customers/CustomerDetailView";
import { Button } from "@/components/ui/button";
import { NotFoundError } from "@/lib/api/response";
import { getCustomerDetailService } from "@/lib/services/admin-customer";

export const metadata = { title: "Customer — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let customer;
  try {
    customer = await getCustomerDetailService(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  // UserProfile DTO doesn't yet carry role / createdAt — fall back to sensible
  // defaults until the backend widens the admin-customer detail DTO (tracked for Phase 7).
  const profile = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    role: "customer" as const,
    emailVerified: customer.emailVerified,
    loyaltyPoints: customer.loyaltyPoints,
    tier: customer.tier,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    createdAt: new Date(0).toISOString(),
    ...(customer.phone ? { phone: customer.phone } : {}),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/customers">← Back to customers</Link>
        </Button>
      </div>

      <CustomerDetailView customer={profile} recentOrders={customer.orders} />
    </div>
  );
}
