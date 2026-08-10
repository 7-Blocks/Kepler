import { MaterialIcon } from '../MaterialIcon';

interface BookmarkSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function BookmarkSearch({
  value,
  onChange,
}: BookmarkSearchProps) {
  return (
    <div className="relative">
      <MaterialIcon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/60"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search saved views..."
        aria-label="Search bookmarks by name, description, or category"
        className="w-full border border-border-panel bg-surface-container/40 py-2 pl-9 pr-3 font-technical-data text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-primary-container"
      />
    </div>
  );
}