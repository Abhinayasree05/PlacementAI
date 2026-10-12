import type { ReactNode } from "react";

// =====================================================================
// components/shared/PremiumBackground.tsx
//
// The exact background treatment originally built for SettingsPage.tsx —
// extracted here so any page can reuse it and stay visually connected.
// Change it once, and every page using it updates together.
// =====================================================================

export function PremiumBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white relative overflow-hidden">
      {/* Ambient red glow background */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#E50914]/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#E50914]/10 rounded-full blur-[140px]" />
      {children}
    </div>
  );
}
