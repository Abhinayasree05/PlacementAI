import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-graydark">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            className={clsx(
              "w-full rounded-xl border bg-white/5 px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-graytext/70",
              "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20",
              error ? "border-primary focus:border-primary" : "border-border focus:border-graydark",
              className
            )}
            aria-invalid={!!error}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-graytext hover:text-graydark"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="mt-1 text-xs font-medium text-primary">{error}</p>}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
