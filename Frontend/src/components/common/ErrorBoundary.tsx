import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("FarmIQ ErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[350px] flex flex-col items-center justify-center p-6 text-center bg-card rounded-2xl border border-destructive/20 shadow-sm m-4">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Module Loading Issue / సమస్య ఎదురైంది
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mb-5 leading-relaxed">
            This screen experienced an unexpected issue while rendering. You can reload this module safely without losing your session.
          </p>
          <div className="flex items-center space-x-3">
            <Button
              onClick={this.handleReset}
              className="bg-primary text-primary-foreground text-xs font-bold rounded-xl px-4 py-2 flex items-center space-x-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Module / రీలోడ్ చేయండి</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="text-xs font-medium rounded-xl px-4 py-2 flex items-center space-x-2"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Go to Home</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
