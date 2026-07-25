
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Code2, FileText, Mic, Calculator,
  BarChart3, User, Settings, HelpCircle, LogOut, ShieldCheck, X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/coding", label: "Coding Agent", icon: Code2 },
  { to: "/dashboard/resume", label: "Resume Agent", icon: FileText },
  { to: "/dashboard/interview", label: "Interview Agent", icon: Mic },
  { to: "/dashboard/aptitude", label: "Aptitude Agent", icon: Calculator },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/help", label: "Help", icon: HelpCircle },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full w-64 flex-col bg-sidebar px-4 py-6">
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold text-white">PlacementAI</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary text-white"
                  : "text-white/65 hover:bg-sidebar-hover hover:text-white"
              )
            }
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
  onClick={async () => {
    await signOut(auth);
    navigate("/login");
  }}
  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition-colors duration-150 hover:bg-sidebar-hover hover:text-white"
>
        <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
        Logout
      </button>
    </div>
  );
}
