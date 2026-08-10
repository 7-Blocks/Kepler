interface DividerProps {
  label?: string;
}

/** A hairline separator with an optional centered label. */
export function Divider({ label = 'or continue with' }: DividerProps) {
  return (
    <div className="flex items-center gap-4" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-white/12" />
      <span className="font-body-ui text-[12px] uppercase tracking-[0.14em] text-[#64748B]">
        {label}
      </span>
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-white/12" />
    </div>
  );
}
