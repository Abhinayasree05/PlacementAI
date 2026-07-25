import { useRef, type ClipboardEvent, type KeyboardEvent, type ChangeEvent } from "react";
import clsx from "clsx";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, error, disabled }: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function setDigit(index: number, digit: string) {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>, index: number) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setDigit(index, "");
      return;
    }
    const char = raw[raw.length - 1];
    setDigit(index, char);
    if (index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, "").slice(0, length).replace(/\s/g, ""));
    const lastIndex = Math.min(pasted.length, length) - 1;
    inputsRef.current[lastIndex >= 0 ? lastIndex : 0]?.focus();
  }

  return (
    <div>
      <div className="flex justify-between gap-2 sm:gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={clsx(
              "h-12 w-11 sm:h-14 sm:w-12 rounded-xl border text-center text-lg font-semibold text-ink",
              "focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors",
              error ? "border-primary" : "border-border focus:border-graydark",
              disabled && "opacity-60"
            )}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-primary">{error}</p>}
    </div>
  );
}
