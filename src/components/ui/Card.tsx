import type { ReactNode } from "react";
import clsx from "clsx";
import { Link, useLocation } from "react-router-dom";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-border bg-white p-7 sm:p-8",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.06)]",
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
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={clsx(
              "rounded-lg py-2 text-center text-sm font-semibold transition-all duration-150",
              active ? "bg-white text-primary shadow-sm" : "text-graytext hover:text-graydark"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
