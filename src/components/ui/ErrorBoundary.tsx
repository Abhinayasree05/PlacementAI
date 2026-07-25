import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
          <p className="max-w-sm text-sm text-graytext">{this.state.message || "Please try refreshing the page."}</p>
          <Button onClick={() => window.location.assign("/login")} className="mt-2">
            Back to login
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
