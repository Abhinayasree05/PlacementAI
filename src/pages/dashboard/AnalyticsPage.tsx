import { motion } from "framer-motion";

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-ink">
        Analytics Dashboard
      </h1>

      <p className="text-sm text-graytext">
        Track your placement preparation progress.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="text-sm text-graytext">Coding Score</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0%</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="text-sm text-graytext">Aptitude Score</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0%</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="text-sm text-graytext">Interview Score</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0%</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="text-sm text-graytext">Resume ATS</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0%</p>
        </div>
      </div>
    </motion.div>
  );
}