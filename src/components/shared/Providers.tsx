"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CONSENT_EVENT_NAME,
  CONSENT_STORAGE_KEY,
  type ConsentState,
} from "@/components/shared/ConsentBanner";

// reason: NextAuth v5 uses server-side `auth()` by default for the MVP. We deliberately
// do NOT wrap in <SessionProvider>; client components that need session data receive
// it as props from a server parent. Keeping this client boundary thin also avoids
// hydrating a provider tree for pages that do not need it.

/**
 * Conditionally initialize PostHog based on user consent. For the MVP we do
 * not ship a real PostHog key — this is a placeholder that logs in dev so the
 * wiring can be verified end-to-end. Real init goes here when the key lands.
 */
function initAnalyticsOnce(): void {
  const w = window as Window & { __cos_ph_inited?: boolean };
  if (w.__cos_ph_inited) return;
  w.__cos_ph_inited = true;
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[analytics] consent granted — PostHog init (placeholder)");
  }
}

function readConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "analytics" in parsed &&
      typeof (parsed as { analytics: unknown }).analytics === "boolean"
    ) {
      return parsed as ConsentState;
    }
    return null;
  } catch {
    return null;
  }
}

function useConsentAwareAnalytics() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial read — if consent already granted from a prior session, init now.
    const current = readConsent();
    if (current?.analytics) initAnalyticsOnce();

    // Listen for live consent changes so analytics can start mid-session.
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<ConsentState>).detail;
      if (detail?.analytics) initAnalyticsOnce();
    };
    window.addEventListener(CONSENT_EVENT_NAME, handler);
    return () => window.removeEventListener(CONSENT_EVENT_NAME, handler);
  }, []);
}

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
  useConsentAwareAnalytics();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
