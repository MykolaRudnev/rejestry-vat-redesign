/** Saldo mark: an ultramarine ledger stamp. */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="8" className="fill-accent-fill" />
      <path d="M8 10h12M8 14h8M8 18h12" className="stroke-accent-knockout" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="font-display text-display-3 leading-none">Saldo</span>
    </span>
  );
}
