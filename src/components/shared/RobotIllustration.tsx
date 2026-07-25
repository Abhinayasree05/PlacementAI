/**
 * A simple, original geometric robot mascot built from primitives (no
 * external art/stock illustration), styled in the app's red/black/white
 * palette. Floats gently via CSS animation.
 */
export function RobotIllustration() {
  return (
    <svg viewBox="0 0 240 260" className="w-full max-w-[260px] mx-auto animate-float" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="115" fill="url(#glow)" />

      {/* antenna */}
      <line x1="120" y1="28" x2="120" y2="52" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="22" r="7" fill="#D32F2F" />

      {/* head */}
      <rect x="55" y="52" width="130" height="100" rx="26" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
      {/* visor */}
      <rect x="72" y="76" width="96" height="46" rx="18" fill="#111111" />
      {/* eyes */}
      <circle cx="102" cy="99" r="8" fill="#D32F2F">
        <animate attributeName="r" values="8;3;8" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="138" cy="99" r="8" fill="#D32F2F">
        <animate attributeName="r" values="8;3;8" dur="3.2s" repeatCount="indefinite" />
      </circle>

      {/* ears */}
      <rect x="40" y="88" width="14" height="30" rx="7" fill="#D32F2F" />
      <rect x="186" y="88" width="14" height="30" rx="7" fill="#D32F2F" />

      {/* body */}
      <rect x="72" y="162" width="96" height="70" rx="20" fill="#FFFFFF" stroke="#111111" strokeWidth="3" />
      <rect x="96" y="182" width="48" height="10" rx="5" fill="#F7F7F7" stroke="#E5E7EB" />
      <circle cx="120" cy="212" r="9" fill="#D32F2F" />

      {/* arms */}
      <rect x="46" y="172" width="18" height="46" rx="9" fill="#111111" />
      <rect x="176" y="172" width="18" height="46" rx="9" fill="#111111" />
    </svg>
  );
}
