"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rockland-cream flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-rockland-gray p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-rockland-navy mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-rockland-navy/60 mb-6">
              An unexpected error occurred. Please reload the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-rockland-green text-white text-sm font-semibold rounded-lg hover:bg-rockland-green/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
