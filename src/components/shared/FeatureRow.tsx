import type { LucideIcon } from "lucide-react";
import { Sparkles, TrendingUp, Trophy } from "lucide-react";

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: Sparkles, label: "AI Powered Guidance" },
  { icon: TrendingUp, label: "Track Progress" },
  { icon: Trophy, label: "Achieve Goals" },
];

export function FeatureRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {FEATURES.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center backdrop-blur-sm"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2.2} />
          </div>
          <span className="text-xs font-medium text-white/85">{label}</span>
        </div>
      ))}
    </div>
  );
}
