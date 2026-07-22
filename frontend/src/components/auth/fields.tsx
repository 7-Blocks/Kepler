import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
}

const inputBase =
  'w-full rounded-xl bg-white/[0.03] border text-[15px] text-[#F8FAFC] placeholder:text-[#64748B] ' +
  'py-3 pr-4 transition-all duration-200 outline-none ' +
  'focus:bg-white/[0.05] focus:ring-2 focus:ring-[#5EE7FF]/40 focus:border-[#5EE7FF]/60 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed autofill:shadow-[inset_0_0_0px_1000px_rgba(10,15,26,1)]';

/** Standard labelled text input with an optional leading icon and error state. */
export const TextField = forwardRef<HTMLInputElement, BaseFieldProps>(
  ({ label, error, icon: Icon, id, className, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const errorId = `${fieldId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className="font-body-ui text-[13px] font-medium text-[#CBD5E1]"
        >
          {label}
        </label>
        <div className="group relative">
          {Icon && (
            <Icon
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#5EE7FF]"
            />
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              inputBase,
              Icon ? 'pl-11' : 'pl-4',
              error
                ? 'border-[#F87171]/70 focus:ring-[#F87171]/30 focus:border-[#F87171]/70'
                : 'border-white/10',
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="font-body-ui text-[12.5px] text-[#F87171]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = 'TextField';

/** Password input with an accessible show/hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, BaseFieldProps>(
  ({ label, error, icon: Icon, id, className, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const errorId = `${fieldId}-error`;
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className="font-body-ui text-[13px] font-medium text-[#CBD5E1]"
        >
          {label}
        </label>
        <div className="group relative">
          {Icon && (
            <Icon
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#5EE7FF]"
            />
          )}
          <input
            ref={ref}
            id={fieldId}
            type={visible ? 'text' : 'password'}
            className={cn(
              inputBase,
              Icon ? 'pl-11' : 'pl-4',
              'pr-11',
              error
                ? 'border-[#F87171]/70 focus:ring-[#F87171]/30 focus:border-[#F87171]/70'
                : 'border-white/10',
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:text-[#CBD5E1] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE7FF]/50 transition-colors"
          >
            {visible ? (
              <EyeOff size={17} aria-hidden="true" />
            ) : (
              <Eye size={17} aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="font-body-ui text-[12.5px] text-[#F87171]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordField.displayName = 'PasswordField';
