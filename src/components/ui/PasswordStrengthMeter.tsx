import { scorePassword } from "../../schemas/authSchemas";
import clsx from "clsx";

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const COLORS = ["bg-border", "bg-primary", "bg-warning", "bg-graydark", "bg-success"];

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = scorePassword(password); // 0-4

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 flex-1 rounded-full transition-colors duration-200",
              i < score ? COLORS[score] : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-graytext">{LABELS[score]}</p>
    </div>
  );
}
