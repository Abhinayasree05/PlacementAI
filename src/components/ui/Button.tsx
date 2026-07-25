import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm " +
    "px-5 py-2.5 transition-all duration-150 active:scale-[0.98] " +
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants: Record<string, string> = {
    primary:
      "bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow-md focus-visible:ring-primary",
    secondary:
      "bg-ink text-white hover:bg-graydark focus-visible:ring-graydark",
    outline:
      "bg-white text-ink border border-border hover:border-graydark focus-visible:ring-graydark",
    ghost:
      "bg-transparent text-graytext hover:bg-muted focus-visible:ring-border",
  };

  return (
    <button
      className={clsx(base, variants[variant], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
