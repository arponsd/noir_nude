"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cosmetic_consent";
const EVENT_NAME = "consent:change";

export interface ConsentState {
  analytics: boolean;
  ts: string;
}

function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "analytics" in parsed &&
      typeof (parsed as { analytics: unknown }).analytics === "boolean" &&
      "ts" in parsed &&
      typeof (parsed as { ts: unknown }).ts === "string"
    ) {
      return parsed as ConsentState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeConsent(state: ConsentState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota). Event still fires so
    // consumers can react for this session.
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(EVENT_NAME, { detail: state }));
}

export default function ConsentBanner() {
  const [visible, setVisible] = React.useState(false);
  const acceptRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    // Lightweight focus handoff — move focus to the primary action so keyboard
    // users can act immediately. We do NOT trap focus (non-modal banner) so
    // users can still continue browsing.
    const t = window.setTimeout(() => acceptRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [visible]);

  const handle = React.useCallback((analytics: boolean) => {
    writeConsent({ analytics, ts: new Date().toISOString() });
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-desc"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--surface)]/95 shadow-[var(--shadow-lg)] backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/85"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-8 lg:px-8">
        <div className="min-w-0">
          <p id="consent-title" className="text-sm font-medium text-[var(--ink)]">
            Cookies & analytics
          </p>
          <p id="consent-desc" className="mt-1 text-sm text-[var(--ink-soft)]">
            We use essential cookies for login and cart, plus optional analytics. You can accept all
            or only essential.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handle(false)}
            aria-label="Accept essential cookies only"
          >
            Essentials only
          </Button>
          <Button
            ref={acceptRef}
            type="button"
            size="sm"
            onClick={() => handle(true)}
            aria-label="Accept all cookies including analytics"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

export { STORAGE_KEY as CONSENT_STORAGE_KEY, EVENT_NAME as CONSENT_EVENT_NAME };
