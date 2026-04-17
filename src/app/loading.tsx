export default function Loading() {
  return (
    <div
      className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-6"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block size-6 animate-pulse rounded-full bg-[var(--line)]"
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
