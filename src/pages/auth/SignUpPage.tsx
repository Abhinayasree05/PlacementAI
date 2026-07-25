import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Camera, Check, X } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Card, AuthTabs } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { PasswordStrengthMeter } from "../../components/ui/PasswordStrengthMeter";
import { Checkbox } from "../../components/ui/Checkbox";
import { Button } from "../../components/ui/Button";
import { signupSchema, type SignupFormValues } from "../../schemas/authSchemas";
import { signUpWithEmail, friendlyAuthError } from "../../lib/authActions";
import { useIsMounted } from "../../hooks/useIsMounted";
import clsx from "clsx";

const PASSWORD_RULES = [
  { key: "length", label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const isMounted = useIsMounted();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const password = watch("password") || "";

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // NOTE: stored as a data URL for simplicity in this demo. For production,
    // upload to Firebase Storage instead and save the resulting download URL.
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    try {
      await signUpWithEmail(values, photoPreview);
      navigate("/dashboard");
    } catch (err) {
      if (isMounted()) setServerError(friendlyAuthError(err));
    }
  }

  return (
    <AuthLayout>
      <Card className="animate-fade-in-up">
        <AuthTabs />

        <h2 className="text-2xl font-bold text-ink">Create your account</h2>
        <p className="mt-1 text-sm text-graytext">Set up your placement prep profile.</p>

        {serverError && (
          <div className="mt-4 rounded-xl border border-primary-light bg-primary-light px-4 py-2.5 text-sm text-primary">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Profile photo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted hover:border-primary"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-5 w-5 text-graytext group-hover:text-primary" />
              )}
            </button>
            <div>
              <p className="text-sm font-medium text-graydark">Profile photo (optional)</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-primary hover:text-primary-dark"
              >
                Upload photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>
          </div>

          <Input label="Full Name" placeholder="Jane Doe" error={errors.fullName?.message} {...register("fullName")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
            <Input label="Phone Number" placeholder="9876543210" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <PasswordInput label="Password" placeholder="Create a password" error={errors.password?.message} {...register("password")} />
              <PasswordStrengthMeter password={password} />
            </div>
            <PasswordInput label="Confirm Password" placeholder="Re-enter password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          </div>

          {/* Live password requirement checklist */}
          <ul className="grid grid-cols-1 gap-1.5 rounded-xl bg-muted p-3 sm:grid-cols-2">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li key={rule.key} className="flex items-center gap-1.5 text-xs">
                  {passed ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-graytext/50" />
                  )}
                  <span className={clsx(passed ? "text-graydark" : "text-graytext")}>{rule.label}</span>
                </li>
              );
            })}
          </ul>

          <Input label="College Name" placeholder="Your college" error={errors.college?.message} {...register("college")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Department" placeholder="CSE" error={errors.department?.message} {...register("department")} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-graydark">Year</label>
              <select
                className={clsx(
                  "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-ink",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors.year ? "border-primary" : "border-border focus:border-graydark"
                )}
                {...register("year")}
                defaultValue=""
              >
                <option value="" disabled>Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              {errors.year && <p className="mt-1 text-xs font-medium text-primary">{errors.year.message}</p>}
            </div>
            <Input label="Roll Number" placeholder="21CS001" error={errors.rollNumber?.message} {...register("rollNumber")} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-graydark">Gender (optional)</label>
            <select
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-graydark"
              {...register("gender")}
              defaultValue=""
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Checkbox
            label={
              <>
                I agree to the{" "}
                <span className="font-semibold text-primary">Terms &amp; Conditions</span> and{" "}
                <span className="font-semibold text-primary">Privacy Policy</span>
              </>
            }
            error={errors.acceptTerms?.message}
            {...register("acceptTerms")}
          />

          <Button type="submit" fullWidth loading={isSubmitting} icon={<UserPlus className="h-4 w-4" />}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-graytext">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-dark">
            Sign In
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
