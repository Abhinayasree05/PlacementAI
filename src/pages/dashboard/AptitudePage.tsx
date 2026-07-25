import { motion } from "framer-motion";
import { Calculator, Brain } from "lucide-react";

export default function AptitudePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-ink">
          Aptitude Agent
        </h1>

        <p className="mt-2 text-sm text-graytext">
          Practice aptitude questions and improve your placement readiness.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">

          <div className="rounded-full bg-primary-light p-5">
            <Calculator className="h-10 w-10 text-primary" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold text-ink">
            Aptitude Practice
          </h2>

          <p className="mt-2 text-sm text-graytext">
            Solve questions from different aptitude topics.
          </p>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Quantitative
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Logical Reasoning
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Verbal Ability
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Data Interpretation
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Number Series
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Puzzles
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-ink">
              AI Recommendation
            </h3>
            <p className="text-sm text-graytext">
              Practice daily to improve your speed and accuracy.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}