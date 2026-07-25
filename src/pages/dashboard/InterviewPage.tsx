import { motion } from "framer-motion";
import { Mic, PlayCircle } from "lucide-react";

export default function InterviewPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-ink">
          Interview Agent
        </h1>

        <p className="mt-2 text-sm text-graytext">
          Practice mock interviews and improve your confidence.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">

          <div className="rounded-full bg-primary-light p-5">
            <Mic className="h-10 w-10 text-primary" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold text-ink">
            AI Mock Interview
          </h2>

          <p className="mt-2 text-sm text-graytext">
            Practice HR and Technical interviews with AI.
          </p>

          <button className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-white hover:bg-primary-dark">
            <PlayCircle className="h-5 w-5" />
            Start Interview
          </button>

        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-ink">
          Interview Features
        </h3>

        <ul className="mt-4 list-disc space-y-2 pl-6 text-graydark">
          <li>HR Interview Questions</li>
          <li>Technical Interview Questions</li>
          <li>Behavioral Interview Practice</li>
          <li>AI Feedback & Score</li>
        </ul>
      </div>
    </motion.div>
  );
}