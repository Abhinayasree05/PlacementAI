import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-graydark">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-ink placeholder:text-graytext/70",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20",
            error ? "border-primary focus:border-primary" : "border-border focus:border-graydark",
            className
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {error ? (
          <p className="mt-1 text-xs font-medium text-primary">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-graytext">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
