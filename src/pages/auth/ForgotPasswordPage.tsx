import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { KeyRound, ArrowLeft, MailCheck } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { forgotPasswordEmailSchema, type ForgotPasswordEmailValues } from "../../schemas/authSchemas";
import { requestPasswordReset, friendlyAuthError } from "../../lib/authActions";

const RESEND_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordEmailValues>({ resolver: zodResolver(forgotPasswordEmailSchema) });

  useEffect(() => {
    if (!sent) return;
    setSecondsLeft(RESEND_SECONDS);
    const interval = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [sent]);

  async function onSubmit(values: ForgotPasswordEmailValues) {
    setServerError(null);
    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
      setSent(true);
    } catch (err) {
      setServerError(friendlyAuthError(err));
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    try {
      await requestPasswordReset(getValues("email") || sentTo);
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setServerError(friendlyAuthError(err));
    }
  }

  return (
    <AuthLayout>
      <Card className="animate-fade-in-up">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-graytext hover:text-graydark">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        {!sent ? (
          <>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-ink">Forgot your password?</h2>
            <p className="mt-1 text-sm text-graytext">
              Enter your email and we'll send you a secure link to reset it.
            </p>

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
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" fullWidth loading={isSubmitting}>
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
              <MailCheck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-ink">Check your inbox</h2>
            <p className="mt-1 text-sm text-graytext">
              We sent a password reset link to <span className="font-semibold text-graydark">{sentTo}</span>.
              Open it to choose a new password — you'll land back here to finish.
            </p>
            <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-xs text-graytext">
              Firebase Authentication resets passwords via a secure emailed link rather than a
              typed code — this keeps the reset token from ever being guessable or intercepted
              client-side. That's why there's no OTP box here.
            </p>
            <p className="mt-4 text-center text-sm text-graytext">
              {secondsLeft > 0 ? (
                <>Resend in <span className="font-semibold text-graydark">{secondsLeft}s</span></>
              ) : (
                <button onClick={handleResend} className="font-semibold text-primary hover:text-primary-dark">
                  Resend email
                </button>
              )}
            </p>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
