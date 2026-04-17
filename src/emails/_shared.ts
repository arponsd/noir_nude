/**
 * Shared style objects for GlowCart transactional emails.
 *
 * Inline styles only — email clients do not reliably support external or
 * modular CSS. Palette mirrors the design system tokens (burgundy accent,
 * serif display face, cream background).
 */

export const COLORS = {
  bg: "#fbf8f4",
  surface: "#ffffff",
  ink: "#1a1413",
  inkSoft: "#5c504c",
  muted: "#a89f9a",
  line: "#e7dfd5",
  accent: "#6b1f2e",
  accentSoft: "#b97a86",
  danger: "#9b2a2a",
} as const;

export const bodyStyle = {
  backgroundColor: COLORS.bg,
  fontFamily: "Inter, Arial, sans-serif",
  color: COLORS.ink,
  margin: 0,
  padding: 0,
};

export const containerStyle = {
  backgroundColor: COLORS.surface,
  borderRadius: "8px",
  margin: "40px auto",
  maxWidth: "560px",
  padding: "32px",
};

export const headingStyle = {
  color: COLORS.ink,
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: "26px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "1.2",
  margin: "0 0 16px",
};

export const subheadingStyle = {
  color: COLORS.ink,
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: "18px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  margin: "24px 0 8px",
};

export const textStyle = {
  color: COLORS.ink,
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

export const mutedStyle = {
  color: COLORS.inkSoft,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 8px",
};

export const linkStyle = {
  color: COLORS.accent,
  fontSize: "13px",
  wordBreak: "break-all" as const,
};

export const buttonStyle = {
  backgroundColor: COLORS.accent,
  borderRadius: "999px",
  color: COLORS.surface,
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 28px",
  textDecoration: "none",
};

export const accentBarStyle = {
  backgroundColor: COLORS.accent,
  borderRadius: "2px",
  height: "3px",
  margin: "0 0 20px",
  width: "40px",
};

export const footerTextStyle = {
  color: COLORS.muted,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "24px 0 0",
};

export const hrStyle = {
  borderColor: COLORS.line,
  borderStyle: "solid",
  borderTop: `1px solid ${COLORS.line}`,
  borderWidth: "0 0 1px",
  margin: "20px 0",
};

const bdtFormatter = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Minor-units formatter aligned with `formatBDT` in `src/lib/constants.ts`. */
export function formatBDT(paisa: number): string {
  return `\u09F3${bdtFormatter.format(paisa / 100)}`;
}

export type EmailOrderItem = {
  name: string;
  quantity: number;
  /** Per-unit paisa. */
  price: number;
};

export type EmailAddress = {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  phone?: string;
};
