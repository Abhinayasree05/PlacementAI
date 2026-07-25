import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Card, AuthTabs } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { Checkbox } from "../../components/ui/Checkbox";
import { Button } from "../../components/ui/Button";
import { GoogleIcon } from "../../components/shared/GoogleIcon";
import { loginSchema, type LoginFormValues } from "../../schemas/authSchemas";
import { loginWithEmail, loginWithGoogle, friendlyAuthError } from "../../lib/authActions";
import { useIsMounted } from "../../hooks/useIsMounted";

export default function LoginPage() {
  const navigate = useNavigate();
  const isMounted = useIsMounted();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await loginWithEmail(values.email, values.password, !!values.rememberMe);
      navigate("/dashboard");
    } catch (err) {
      if (isMounted()) setServerError(friendlyAuthError(err));
    }
  }

  async function handleGoogle() {
  setServerError(null);
  setGoogleLoading(true);

  try {
    console.log("Login started");

    await loginWithGoogle();

    console.log("Navigating to dashboard");

    navigate("/dashboard");

  } catch (err: any) {

    console.log("Google Error:", err);

    setServerError(err.message);

  } finally {

    setGoogleLoading(false);

  }
}

  return (
    <AuthLayout>
      <Card className="animate-fade-in-up">
        <AuthTabs />

        <h2 className="text-2xl font-bold text-ink">Log in to your account</h2>
        <p className="mt-1 text-sm text-graytext">Pick up right where you left off.</p>

        {serverError && (
          <div className="mt-4 rounded-xl border border-primary-light bg-primary-light px-4 py-2.5 text-sm text-primary">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center justify-between">
            <Checkbox label="Remember me" {...register("rememberMe")} />
            <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary-dark">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={isSubmitting} icon={<LogIn className="h-4 w-4" />}>
            Log In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wide text-graytext">or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            loading={googleLoading}
            onClick={handleGoogle}
            icon={!googleLoading ? <GoogleIcon /> : undefined}
          >
            Continue with Google
          </Button>
          <Link to="/phone-login">
            <Button variant="outline" fullWidth type="button" icon={<PhoneIcon />}>
              Continue with Phone Number
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-graytext">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:text-primary-dark">
            Create Account
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
