import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Card } from "../../components/ui/Card";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { PasswordStrengthMeter } from "../../components/ui/PasswordStrengthMeter";
import { Button } from "../../components/ui/Button";
import { SuccessCheck, CircularLoader } from "../../components/ui/CircularLoader";
import { resetPasswordSchema, type ResetPasswordValues } from "../../schemas/authSchemas";
import { verifyResetCode, completePasswordReset, friendlyAuthError } from "../../lib/authActions";

type Phase = "checking" | "invalid" | "form" | "success";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get("oobCode") ?? "";
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!oobCode) {
      setPhase("invalid");
      return;
    }
    verifyResetCode(oobCode)
      .then((addr) => {
        setEmail(addr);
        setPhase("form");
      })
      .catch(() => setPhase("invalid"));
  }, [oobCode]);

  async function onSubmit(values: ResetPasswordValues) {
    setServerError(null);
    try {
      await completePasswordReset(oobCode, values.newPassword);
      setPhase("success");
    } catch (err) {
      setServerError(friendlyAuthError(err));
    }
  }

  return (
    <AuthLayout>
      <Card className="animate-fade-in-up">
        {phase === "checking" && <CircularLoader label="Verifying your reset link…" />}

        {phase === "invalid" && (
          <>
            <h2 className="text-2xl font-bold text-ink">Link expired or invalid</h2>
            <p className="mt-2 text-sm text-graytext">
              This password reset link is no longer valid. Request a new one from the login page.
            </p>
            <Link to="/forgot-password">
              <Button fullWidth className="mt-5">Request new link</Button>
            </Link>
          </>
        )}

        {phase === "form" && (
          <>
            <h2 className="text-2xl font-bold text-ink">Set a new password</h2>
            <p className="mt-1 text-sm text-graytext">
              Resetting password for <span className="font-semibold text-graydark">{email}</span>
            </p>

            {serverError && (
              <div className="mt-4 rounded-xl border border-primary-light bg-primary-light px-4 py-2.5 text-sm text-primary">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <PasswordInput
                  label="New Password"
                  placeholder="Create a new password"
                  error={errors.newPassword?.message}
                  {...register("newPassword")}
                />
                <PasswordStrengthMeter password={watch("newPassword") || ""} />
              </div>
              <PasswordInput
                label="Confirm Password"
                placeholder="Re-enter new password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <Button type="submit" fullWidth loading={isSubmitting}>
                Update Password
              </Button>
            </form>
          </>
        )}

        {phase === "success" && (
          <>
            <SuccessCheck label="Password updated successfully" />
            <Button fullWidth onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
