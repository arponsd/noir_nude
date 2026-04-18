import type { ReactNode } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import ConsentBanner from "@/components/shared/ConsentBanner";
import SkipToContent from "@/components/shared/SkipToContent";
import { CartDrawerProvider } from "@/components/shared/CartDrawer";
import { auth } from "@/lib/auth";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  return (
    <CartDrawerProvider isAuthenticated={isAuthenticated}>
      <SkipToContent />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <ConsentBanner />
    </CartDrawerProvider>
  );
}
