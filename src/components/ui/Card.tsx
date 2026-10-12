import type { ReactNode } from "react";
import clsx from "clsx";
import { Link, useLocation } from "react-router-dom";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-border bg-surface/90 backdrop-blur-xl p-7 sm:p-8",
        "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_16px_40px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthTabs() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/login", label: "Login" },
    { to: "/signup", label: "Sign Up" },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/5 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={clsx(
              "rounded-lg py-2 text-center text-sm font-semibold transition-all duration-150",
              active ? "bg-primary/15 text-primary border border-primary/30" : "text-graytext hover:text-graydark"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
