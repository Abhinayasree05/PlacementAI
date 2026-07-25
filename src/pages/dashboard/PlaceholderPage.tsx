import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white p-10 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-graytext">{description}</p>
      <span className="mt-4 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-graytext">
        Coming soon
      </span>
    </motion.div>
  );
}
