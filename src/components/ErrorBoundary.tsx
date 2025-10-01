import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            {/* Error icon with glow */}
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
              <div className="relative bg-destructive/10 p-6 rounded-3xl border border-destructive/30">
                <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
              </div>
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Etwas ist schiefgelaufen</h1>
              <p className="text-muted-foreground">
                Die App hat einen unerwarteten Fehler festgestellt
              </p>
            </div>

            {/* Error details */}
            {this.state.error && (
              <div className="bg-muted/50 rounded-2xl p-4 text-left">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Reset button */}
            <Button
              onClick={this.handleReset}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              App neu starten
            </Button>

            <p className="text-sm text-muted-foreground">
              Wenn das Problem weiterhin besteht, aktualisieren Sie die Seite
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
