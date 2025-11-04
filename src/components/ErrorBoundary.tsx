import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-lg font-semibold">
                Произошла ошибка
              </AlertTitle>
              <AlertDescription className="mt-2">
                К сожалению, что-то пошло не так. Попробуйте обновить страницу
                или вернуться на главную.
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">Детали ошибки:</h3>
                <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex-1"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Попробовать снова
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                На главную
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
