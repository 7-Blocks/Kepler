interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  accentColor?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, accentColor, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep-space ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'border-transparent' : 'bg-surface-container-high border-border-panel'}`}
      style={checked ? { backgroundColor: accentColor ?? 'var(--color-primary-container)' } : undefined}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-on-surface transition-ui ${
          checked ? 'translate-x-[18px]' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
