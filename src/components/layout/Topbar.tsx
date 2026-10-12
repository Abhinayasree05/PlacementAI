import { useState } from "react";
import { Menu, ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import { signOut } from "firebase/auth";

import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";

import { useAuthStore } from "../../store/authStore";
import { NotificationBell } from "../shared/NotificationBell";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = profile?.fullName || firebaseUser?.displayName || "Student";
  const photoURL = profile?.photoURL || firebaseUser?.photoURL;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
      <button onClick={onMenuClick} className="text-graytext transition-colors hover:text-ink lg:hidden">
        <Menu className="h-5.5 w-5.5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="h-8 w-8 rounded-full border border-white/10 object-cover"
              />
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
              className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-card-hover animate-pop-in"
            >
              <Link
                to="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-graydark transition-colors hover:bg-white/5 hover:text-ink"
              >
                <UserIcon className="h-4 w-4 text-graytext" /> Profile
              </Link>
              <Link
                to="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-graydark transition-colors hover:bg-white/5 hover:text-ink"
              >
                <Settings className="h-4 w-4 text-graytext" /> Settings
              </Link>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={async () => {
                  await signOut(auth);
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-primary-light"
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
