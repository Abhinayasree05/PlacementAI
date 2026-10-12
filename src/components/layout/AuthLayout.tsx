import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { RobotIllustration } from "../shared/RobotIllustration";
import { FeatureRow } from "../shared/FeatureRow";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted lg:flex">
      {/* Left panel — brand / illustration */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#0B0B0B] px-10 py-10 lg:flex xl:px-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <span className="text-lg font-bold text-white">PlacementAI</span>
        </div>

        <div className="relative z-10">
          <RobotIllustration />
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-center text-3xl font-bold text-white"
          >
            Welcome Back!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-2 max-w-xs text-center text-sm text-white/65"
          >
            Your placement prep, unified — coding, aptitude, resume and
            interviews guided by AI, in one dashboard.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10"
        >
          <FeatureRow />
        </motion.div>
      </div>

      {/* Right panel — auth card */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
