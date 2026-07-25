import { motion } from "framer-motion";

export function CircularLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
      {label && <p className="text-sm font-medium text-graytext">{label}</p>}
    </div>
  );
}

export function SuccessCheck({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-9 w-9"
          fill="none"
          stroke="#1E8E3E"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M4 12.5l5 5L20 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>
      {label && <p className="text-sm font-semibold text-ink">{label}</p>}
    </div>
  );
}
