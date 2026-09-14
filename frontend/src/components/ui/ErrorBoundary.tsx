"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label shown in the error card header */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enterprise-grade React Error Boundary.
 * Catches rendering / lifecycle errors in its subtree and shows
 * a glassmorphic fallback card instead of crashing the page.
 *
 * Usage:
 *   <ErrorBoundary label="Dashboard">
 *     <SomeAsyncComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-rose-400 mb-1">
                {this.props.label ? `${this.props.label} failed to load` : "Something went wrong"}
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-mono truncate">
                {this.state.error?.message ?? "An unexpected rendering error occurred."}
              </p>
              <button
                onClick={this.reset}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
