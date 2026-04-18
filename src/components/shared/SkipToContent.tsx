import * as React from "react";

interface SkipToContentProps {
  /**
   * The id of the <main> element to jump to. Defaults to `content`.
   */
  targetId?: string;
}

/**
 * Visually-hidden link that becomes visible on keyboard focus. Jumps the user
 * past the global header straight to <main id="content">.
 *
 * Render as the very first child of <body> (or as early as possible inside a
 * route-group layout) so Tab from the URL bar lands on it first.
 */
export default function SkipToContent({ targetId = "content" }: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:inline-flex focus:items-center focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-[var(--shadow-md)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] focus:outline-none"
    >
      Skip to content
    </a>
  );
}
