import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Kepler] ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? 'COMPONENT ERROR';
      const desc = this.props.fallbackDescription ?? 'This section encountered an unexpected error.';
      return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-center p-8 bg-bg-deep-space/80 border border-border-panel/40 rounded">
          <MaterialIcon name="error_outline" className="text-[40px] text-amber-500/70" />
          <p className="font-label-caps text-xs text-primary-container tracking-widest">{title}</p>
          <p className="font-technical-data text-[11px] text-on-surface-variant max-w-xs">{desc}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-1.5 text-[10px] font-label-caps border border-border-panel hover:border-primary-container text-on-surface-variant hover:text-primary-container transition-ui rounded"
          >
            RETRY
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-2 text-[9px] text-red-400/60 max-w-sm overflow-auto max-h-24 text-left">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
