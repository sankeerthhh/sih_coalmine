import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-3 m-4">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{this.props.fallbackTitle || 'Component Rendering Recovered'}</span>
          </div>
          <p className="text-xs text-rose-800 font-mono bg-white/70 p-2.5 rounded border border-rose-200">
            {this.state.error?.message || 'Unknown runtime render exception'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Rendering</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
