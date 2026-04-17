"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// TODO replace with import when backend types land: `import type { SearchSuggestion } from "@/types/api/search";`
export interface SearchSuggestion {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  image?: { url: string; alt: string } | null;
}

export interface SearchAutocompleteProps {
  placeholder?: string;
  endpoint?: string;
  debounceMs?: number;
  className?: string;
  onNavigate?: () => void;
}

export default function SearchAutocomplete({
  placeholder = "Search products",
  endpoint = "/api/search/suggest",
  debounceMs = 150,
  className,
  onNavigate,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [highlight, setHighlight] = React.useState(-1);
  const [inputId] = React.useState(() => `search-${Math.random().toString(36).slice(2, 8)}`);
  const listboxId = `${inputId}-listbox`;

  const abortRef = React.useRef<AbortController | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      fetch(`${endpoint}?q=${encodeURIComponent(trimmed)}`, {
        signal: ctrl.signal,
        headers: { accept: "application/json" },
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(`status ${r.status}`);
          const json: unknown = await r.json();
          const items: SearchSuggestion[] = Array.isArray(json)
            ? (json as SearchSuggestion[])
            : ((json as { items?: SearchSuggestion[]; data?: SearchSuggestion[] })?.items ??
              (json as { data?: SearchSuggestion[] })?.data ??
              []);
          setResults(items.slice(0, 8));
          setHighlight(-1);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [query, endpoint, debounceMs]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const navigate = (suggestion: SearchSuggestion) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`/products/${suggestion.slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (results.length === 0 ? -1 : (h + 1) % results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (results.length === 0 ? -1 : (h - 1 + results.length) % results.length));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && results[highlight]) {
        e.preventDefault();
        navigate(results[highlight]);
      } else if (query.trim().length >= 2) {
        e.preventDefault();
        setOpen(false);
        onNavigate?.();
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlight >= 0 && results[highlight]
              ? `${inputId}-opt-${results[highlight].id}`
              : undefined
          }
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] pr-8 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--bg-alt)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
          >
            <X className="size-3.5" strokeWidth={1.5} aria-hidden />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-40 mt-2 max-h-[70vh] overflow-auto rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] py-1 shadow-[var(--shadow-md)]"
        >
          {loading && results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-[var(--muted)]">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-[var(--muted)]">No matches.</p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    id={`${inputId}-opt-${r.id}`}
                    role="option"
                    aria-selected={i === highlight}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => navigate(r)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150",
                      i === highlight ? "bg-[var(--bg-alt)]" : "bg-transparent",
                    )}
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)]">
                      {r.image?.url ? (
                        <Image
                          src={r.image.url}
                          alt={r.image.alt ?? ""}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      {r.brand ? (
                        <span className="block text-[10px] font-medium tracking-[0.08em] text-[var(--muted)] uppercase">
                          {r.brand}
                        </span>
                      ) : null}
                      <span className="block truncate text-sm text-[var(--ink)]">{r.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
