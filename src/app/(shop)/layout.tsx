import type { ReactNode } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { CartDrawerProvider } from "@/components/shared/CartDrawer";
import { auth } from "@/lib/auth";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  return (
    <CartDrawerProvider isAuthenticated={isAuthenticated}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartDrawerProvider>
  );
}
