import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { CircularLoader } from "../components/ui/CircularLoader";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, initializing } = useAuthStore();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <CircularLoader label="Loading your dashboard…" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Sends an already-authenticated user straight to the dashboard from auth pages. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, initializing } = useAuthStore();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <CircularLoader />
      </div>
    );
  }

  if (firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
