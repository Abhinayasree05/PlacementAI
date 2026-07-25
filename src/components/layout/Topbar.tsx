import { useState } from "react";
import { Bell, Menu, ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import { signOut } from "firebase/auth";

import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";

import { useAuthStore } from "../../store/authStore";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = profile?.fullName || firebaseUser?.displayName || "Student";
  const photoURL = profile?.photoURL || firebaseUser?.photoURL;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenuClick} className="text-graydark lg:hidden">
        <Menu className="h-5.5 w-5.5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-graytext hover:bg-muted"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted"
          >
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm font-semibold text-ink sm:block">{displayName}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-graytext sm:block" />
          </button>

          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-white p-1.5 shadow-lg animate-pop-in"
            >
              <Link
              to="/dashboard/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-graydark hover:bg-muted"
              ></Link>
              <Link
              to="/dashboard/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-graydark hover:bg-muted"
              ></Link>
              <button
              onClick={async () => {
              await signOut(auth);
              setMenuOpen(false);
              navigate("/login");
              }}
                
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-primary-light"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
