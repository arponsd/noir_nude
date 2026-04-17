"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// reason: NextAuth v5 uses server-side `auth()` by default for the MVP. We deliberately
// do NOT wrap in <SessionProvider>; client components that need session data receive
// it as props from a server parent. Keeping this client boundary thin also avoids
// hydrating a provider tree for pages that do not need it.

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
