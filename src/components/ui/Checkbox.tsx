import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const inputId = id || "checkbox-" + Math.random().toString(36).slice(2, 8);
    return (
      <div>
        <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5 select-none">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            className={clsx(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary",
              "focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer",
              className
            )}
            {...rest}
          />
          <span className="text-sm text-graydark">{label}</span>
        </label>
        {error && <p className="mt-1 text-xs font-medium text-primary">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
