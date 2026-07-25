import { motion } from "framer-motion";
import { Code2 } from "lucide-react";

export default function CodingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-ink">
          Coding Agent
        </h1>

        <p className="text-sm text-graytext mt-2">
          Practice coding questions and improve your programming skills.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-primary" />

          <div>
            <h2 className="text-xl font-semibold text-ink">
              Welcome to Coding Practice
            </h2>

            <p className="text-sm text-graytext">
              Select a topic and start solving problems.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Arrays
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Strings
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Recursion
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Sorting
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Searching
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Linked List
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Stack & Queue
          </button>

          <button className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary-light">
            Trees
          </button>
        </div>
      </div>
    </motion.div>
  );
}