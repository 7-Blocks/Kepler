import React from 'react';
import { Loader2 } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { cn } from '@/lib/utils';

interface SubmitButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  loading?: boolean;
  loadingText?: string;
}

const ACCENT_GRADIENT =
  'linear-gradient(100deg, #5EE7FF 0%, #4F7DFF 55%, #6D5AF7 100%)';

/** Primary auth CTA: cyan→blue gradient shimmer button with a loading state. */
export function SubmitButton({
  loading = false,
  loadingText = 'Please wait…',
  disabled,
  children,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <ShimmerButton
      background={ACCENT_GRADIENT}
      shimmerColor="#ffffff"
      shimmerDuration="2.5s"
      borderRadius="12px"
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'w-full py-3 font-body-ui text-[15px] font-semibold text-[#04121F] border-transparent',
        'shadow-[0_4px_16px_rgba(79,125,255,0.18)] hover:shadow-[0_6px_20px_rgba(94,231,255,0.22)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE7FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none',
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {loading ? loadingText : children}
      </span>
    </ShimmerButton>
  );
}
