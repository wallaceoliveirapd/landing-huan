"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: (err: Error, reset: () => void) => React.ReactNode;
};

type State = { error: Error | null };

/**
 * Generic React error boundary. Catches any render-time error in its
 * subtree and renders a friendly fallback with a "Tentar de novo" button.
 *
 * For route-level boundaries, prefer Next's built-in `app/error.tsx` files
 * (those catch rendering errors per segment + give a `reset()` callback).
 * Use this component to wrap individual high-risk widgets (chat, map,
 * carousel) when a single failure shouldn't blank the whole page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div
          role="alert"
          className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-center"
        >
          <p className="text-[14px] font-medium text-red-700">
            Deu ruim aqui dentro.
          </p>
          <p className="text-[12px] text-red-600 mt-1">
            Recarrega ou tenta de novo daqui a pouco.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-3 h-9 px-4 rounded-full bg-red-600 text-white text-[12px] font-medium"
          >
            Tentar de novo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
