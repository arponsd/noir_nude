import {
  Leaf,
  Rabbit,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  "cruelty-free": Rabbit,
  vegan: Leaf,
  "paraben-free": ShieldCheck,
  "dermatologist-tested": Stethoscope,
  bestseller: TrendingUp,
};

const LABEL_BY_SLUG: Record<string, string> = {
  "cruelty-free": "Cruelty-free",
  vegan: "Vegan",
  "paraben-free": "Paraben-free",
  "dermatologist-tested": "Dermatologist-tested",
  bestseller: "Bestseller",
  new: "New",
  sale: "Sale",
  limited: "Limited",
  organic: "Organic",
};

export interface BadgeChipProps {
  slug: string;
  label?: string;
  className?: string;
}

export default function BadgeChip({ slug, label, className }: BadgeChipProps) {
  const Icon = ICON_BY_SLUG[slug] ?? Sparkles;
  const resolvedLabel = label ?? LABEL_BY_SLUG[slug] ?? slug;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]",
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.5} aria-hidden />
      <span>{resolvedLabel}</span>
    </span>
  );
}
