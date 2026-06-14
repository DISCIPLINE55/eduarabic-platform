import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
  /** Optional: render a smaller inline error instead of a full-page one */
  inline?: boolean;
  /** Optional: fallback label shown in the card title */
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console for debugging; swap for a real error-reporting service if needed
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { inline, context } = this.props;
    const title = context ? `Error in ${context}` : 'Something went wrong';

    /* ── Inline variant — compact card used inside page sections ── */
    if (inline) {
      return (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4 px-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                {this.state.error?.message || 'An unexpected error occurred in this section.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0 gap-1"
              onClick={this.handleReset}
            >
              <RefreshCw className="h-3 w-3" />Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    /* ── Full-page variant — shown when the whole page/app crashes ── */
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground text-balance">{title}</h1>
            <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
              An unexpected error occurred. Your data has not been lost.
              Try refreshing the page, or go back to the dashboard.
            </p>
          </div>

          {/* Error details (collapsible, dev-friendly) */}
          {this.state.error && (
            <details className="text-left rounded-lg bg-muted border border-border p-3 text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground select-none">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-destructive/80 break-all max-h-40">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />Try Again
            </Button>
            <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
              <Home className="h-4 w-4" />Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
