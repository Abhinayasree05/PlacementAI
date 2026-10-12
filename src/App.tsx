import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";



import { useAuthListener } from "./hooks/useAuthListener";
import { useAgentStatusListener } from "./hooks/useAgentStatusListener";
import { useNotificationListener } from "./hooks/useNotificationListener";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ProtectedRoute, GuestRoute } from "./routes/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";

import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import PhoneAuthPage from "./pages/auth/PhoneAuthPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import CodingPage from "./pages/dashboard/CodingPage";
import ResumePage from "./pages/dashboard/ResumePage";

import AptitudePage from "./pages/dashboard/AptitudePage";
import InterviewPage from "./pages/dashboard/InterviewPage";
import HelpPage from "./pages/dashboard/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  useAuthListener();
  useAgentStatusListener();
  useNotificationListener();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth routes — redirect away if already signed in */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
          <Route path="/phone-login" element={<GuestRoute><PhoneAuthPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          {/* Reached via the emailed reset link — not gated by auth state */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Dashboard — protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="coding"element={<CodingPage />}/>
            
            <Route path="resume"element={<ResumePage />}/>
            
            <Route path="interview" element={<InterviewPage />}/>
            <Route path="aptitude" element={<AptitudePage />}/>
            <Route path="analytics"element={<AnalyticsPage />}/>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />}/>
            <Route path="help"element={<HelpPage />}/>
            
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
