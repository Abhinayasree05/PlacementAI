import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { type ConfirmationResult, type RecaptchaVerifier } from "firebase/auth";
import { PhoneCall, ArrowLeft } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { OtpInput } from "../../components/ui/OtpInput";
import { CircularLoader, SuccessCheck } from "../../components/ui/CircularLoader";
import { createRecaptchaVerifier, sendPhoneOtp, confirmPhoneOtp, friendlyAuthError } from "../../lib/authActions";
import { useIsMounted } from "../../hooks/useIsMounted";

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";
const RESEND_SECONDS = 30;

type Step = "phone" | "otp" | "verifying" | "success";

export default function PhoneAuthPage() {
  const navigate = useNavigate();
  const isMounted = useIsMounted();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Own the RecaptchaVerifier's lifecycle for exactly as long as this
  // component is mounted. Previously this was a module-level singleton in
  // authActions.ts that outlived the component — navigating away and back
  // (or React StrictMode's dev double-mount) left a verifier bound to a
  // detached DOM node, which is the classic cause of Phone Auth silently
  // hanging or failing every other attempt. Clearing it on unmount and
  // never reusing a stale instance fixes that.
  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  function getVerifier(): RecaptchaVerifier {
    if (!verifierRef.current) {
      verifierRef.current = createRecaptchaVerifier(RECAPTCHA_CONTAINER_ID);
    }
    return verifierRef.current;
  }

  useEffect(() => {
    if (step !== "otp") return;
    setSecondsLeft(RESEND_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleSendOtp() {
    setError(null);
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number.");
      return;
    }
    setSending(true);
    try {
      const verifier = getVerifier();
      const result = await sendPhoneOtp(phone, verifier);
      if (!isMounted()) return;
      confirmationRef.current = result;
      setStep("otp");
    } catch (err) {
      if (!isMounted()) return;
      // A failed attempt can leave the widget in a bad state — drop it so
      // the next attempt builds a fresh one instead of reusing a broken one.
      verifierRef.current?.clear();
      verifierRef.current = null;
      setError(friendlyAuthError(err));
    } finally {
      if (isMounted()) setSending(false);
    }
  }

  async function handleVerify() {
    if (!confirmationRef.current) return;
    setError(null);
    if (otp.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setStep("verifying");
    try {
      await confirmPhoneOtp(confirmationRef.current, otp, fullName);
      // brief pause so the "verifying" state is perceivable, not a flash
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted()) return;
      setStep("success");
    } catch (err) {
      if (!isMounted()) return;
      setError(friendlyAuthError(err));
      setStep("otp");
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    setError(null);
    setSending(true);
    try {
      // Build a fresh verifier for the resend too, rather than reusing one
      // that may already have completed a challenge cycle.
      verifierRef.current?.clear();
      verifierRef.current = null;
      const verifier = getVerifier();
      const result = await sendPhoneOtp(phone, verifier);
      if (!isMounted()) return;
      confirmationRef.current = result;
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      if (!isMounted()) return;
      setError(friendlyAuthError(err));
    } finally {
      if (isMounted()) setSending(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="animate-fade-in-up">
        <div id={RECAPTCHA_CONTAINER_ID} />

        {step !== "success" && (
          <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-graytext hover:text-graydark">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        )}

        {step === "phone" && (
          <>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
              <PhoneCall className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-ink">Continue with phone</h2>
            <p className="mt-1 text-sm text-graytext">We'll text you a one-time verification code.</p>

            <div className="mt-6 space-y-4">
              <Input
                label="Phone Number"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={error ?? undefined}
              />
              <Button fullWidth loading={sending} onClick={handleSendOtp}>
                Send OTP
              </Button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <h2 className="text-2xl font-bold text-ink">Enter verification code</h2>
            <p className="mt-1 text-sm text-graytext">
              Sent to <span className="font-semibold text-graydark">{phone}</span>
            </p>

            <div className="mt-6">
              <OtpInput value={otp} onChange={setOtp} error={error ?? undefined} />
            </div>

            <Input
              label="Your name (only needed if this is a new number)"
              placeholder="Jane Doe"
              className="mt-4"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Button fullWidth className="mt-5" onClick={handleVerify}>
              Verify OTP
            </Button>

            <p className="mt-4 text-center text-sm text-graytext">
              {secondsLeft > 0 ? (
                <>Resend code in <span className="font-semibold text-graydark">{secondsLeft}s</span></>
              ) : (
                <button onClick={handleResend} className="font-semibold text-primary hover:text-primary-dark">
                  Resend OTP
                </button>
              )}
            </p>
          </>
        )}

        {step === "verifying" && <CircularLoader label="Please wait…" />}

        {step === "success" && (
          <>
            <SuccessCheck label="Phone verified successfully" />
            <Button fullWidth onClick={() => navigate("/dashboard")}>
              Continue to Dashboard
            </Button>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
