import type { ReactNode } from "react";

// =====================================================================
// components/shared/AgentBackground.tsx
//
// The exact background treatment originally built for ResumePage.tsx —
// a single top-left radial red glow + gradient overlay (distinct from
// PremiumBackground, which is Settings/Profile's two-glow treatment).
// Extracted here so any page can reuse it and stay visually connected;
// change it once, every page using it updates together.
// =====================================================================

export function AgentBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-[#0B0B0B]">
      {/* Full-page dark gradient + subtle red glow, top-left */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at -10% -10%, rgba(42,0,0,0.55), transparent 60%), linear-gradient(180deg, #0B0B0B 0%, #0B0B0B 100%)",
        }}
      />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] bg-[#E50914]/20 rounded-full blur-[130px]" />
      {children}
    </div>
  );
}
