import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import {
  Code2, ChevronLeft, Play, Loader2, CheckCircle2, AlertCircle, XCircle,
  History, Info, Circle,
} from "lucide-react";
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { AgentBackground } from "../../components/shared/AgentBackground";
import { createNotification } from "../../lib/notificationService";
import { CODING_TOPICS, CODING_PROBLEMS, type CodingProblem, type CodingTopic, type Difficulty } from "../../data/codingProblems";
import { reviewCodeWithGemini, type CodeReviewResult } from "../../lib/codingReviewAI";
import { runPublicTestCases, runHiddenTestCases, type TestRunResult } from "../../lib/judge0Client";

// =====================================================================
// Coding Agent â€” real problem bank, real submissions, real AI review.
// Executable Python problems run through Judge0 via our Cloudflare Worker.
// Public tests provide immediate feedback; hidden tests determine whether
// a problem is officially solved. Gemini provides additional code review.
// JavaScript, Java and C++ currently support AI review only.
// Submissions are saved to users/{uid}/codingHistory.
// =====================================================================

const LANGUAGES = ["JavaScript", "Python", "Java", "C++"];
// Python has real starter code and Judge0 execution support.
// JavaScript, Java and C++ currently support Gemini AI review only.
const DEFAULT_LANGUAGE = "Python";

const LANGUAGE_TO_MONACO_ID: Record<string, string> = {
  JavaScript: "javascript",
  Python: "python",
  Java: "java",
  "C++": "cpp",
};

const WEEKLY_TARGET = 5; // distinct problems solved at 70%+ in the last 7 days = "Completed"

// Phase E â€” flat list of every problem across every topic, for the
// difficulty filter chips and the Easy/Medium/Hard solved-count stats.
// Derived once from CODING_PROBLEMS, not a separate/duplicate data source.
const ALL_PROBLEMS: CodingProblem[] = CODING_TOPICS.flatMap((t) => CODING_PROBLEMS[t]);
type DifficultyFilter = "All" | Difficulty;
const DIFFICULTY_FILTERS: DifficultyFilter[] = ["All", "Easy", "Medium", "Hard"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

// Custom Monaco theme matching PlacementAI's red/black/white identity â€”
// defined once, before the editor mounts.
const handleEditorBeforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("placementai-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0B0B0B",
      "editor.foreground": "#FFFFFF",
      "editorLineNumber.foreground": "#5A5A5A",
      "editorLineNumber.activeForeground": "#E50914",
      "editorCursor.foreground": "#E50914",
      "editor.selectionBackground": "#E5091440",
      "editor.inactiveSelectionBackground": "#E5091425",
      "editorIndentGuide.background": "#1F1F1F",
      "editorIndentGuide.activeBackground": "#2A2A2A",
      "editor.lineHighlightBackground": "#141414",
      "editorBracketMatch.background": "#E5091430",
      "editorBracketMatch.border": "#E50914",
    },
  });
};

interface HistoryEntry {
  id: string;
  problemId: string;
  topic: string;
  score: number;
  verdict: string;
  createdAt: Timestamp | null;
  // Only present on Phase D hidden-test submissions (submitCode()) â€” a
  // Run & Review (Gemini-only) entry never sets these, so checking both
  // is what keeps "Solved" tied strictly to Judge0 hidden-test results.
  submitted?: boolean;
  solved?: boolean;
}

// Aggregate-only â€” deliberately never carries hidden test input/expected
// output/actual output, so there is nothing to accidentally leak in the UI.
interface SubmitResult {
  passed: number;
  total: number;
  solved: boolean;
  hadError: boolean;
}

type View = "topics" | "problems" | "solve";

export default function CodingPage() {
  const [view, setView] = useState<View>("topics");
  const [selectedTopic, setSelectedTopic] = useState<CodingTopic | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Real Python execution state â€” kept entirely separate from Gemini
  // review state, since one can fail independently of the other.
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestRunResult[] | null>(null);

  // Phase D â€” Submit Code (hidden tests). Fully independent of the
  // Run & Review state above; the two actions never share a loading flag
  // or a result value.
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const historyRef = collection(db, "users", user.uid, "codingHistory");
      const snap = await getDocs(query(historyRef, orderBy("createdAt", "desc")));
      setHistory(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            problemId: data.problemId,
            topic: data.topic,
            score: data.score,
            verdict: data.verdict,
            createdAt: data.createdAt ?? null,
            submitted: data.submitted ?? false,
            solved: data.solved ?? false,
          };
        })
      );
    } catch (err) {
      console.error("Failed to load coding history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function bestScoreFor(problemId: string): number | null {
    const attempts = history.filter((h) => h.problemId === problemId);
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map((a) => a.score));
  }

  // Phase E â€” solved status per the brief: ONLY a hidden-test submission
  // (submitCode()) where solved === true counts. A Run & Review / Gemini
  // entry never has submitted === true, so it can never mark a problem
  // solved here â€” Judge0 hidden tests stay the sole source of truth.
  function isProblemSolved(problemId: string): boolean {
    return history.some((h) => h.problemId === problemId && h.submitted === true && h.solved === true);
  }

  function openTopic(topic: CodingTopic) {
    setSelectedTopic(topic);
    setDifficultyFilter("All");
    setView("problems");
  }

  function openProblem(problem: CodingProblem) {
    setSelectedProblem(problem);
    // Only Python has real starter code (Phase A). Other languages stay
    // blank rather than inventing starter code that doesn't exist.
    setCode(language === "Python" ? problem.starterCode.python ?? "" : "");
    setResult(null);
    setReviewError(null);
    setTestResults(null);
    setSubmitResult(null);
    setView("solve");
  }

  async function submitForReview() {
    if (!selectedProblem || !code.trim()) return;

    // --- Step 1: real execution (Python + executable problems only) ---
    // Independent of Gemini â€” a Judge0/network failure here must never be
    // confused with a Gemini failure, and vice versa.
    const canExecute = selectedProblem.executable && language === "Python";
    let executionSummary = "Not executed";
    let executionFailed = false;

    if (canExecute) {
      setRunningTests(true);
      setTestResults(null);
      try {
        const results = await runPublicTestCases(code, selectedProblem.publicTestCases);
        setTestResults(results);
        const passedCount = results.filter((r) => r.verdict === "Passed").length;
        executionSummary = `${passedCount}/${results.length} public tests passed`;
      } catch (err) {
        console.error("Public test execution failed:", err);
        executionFailed = true;
        executionSummary = "Execution failed";
      } finally {
        setRunningTests(false);
      }
    } else {
      setTestResults(null);
    }

    // --- Step 2: Gemini AI review (existing behavior, unchanged) ---
    setReviewing(true);
    setReviewError(null);
    setResult(null);
    try {
      const review = await reviewCodeWithGemini(selectedProblem, code, language);
      setResult(review);

      const user = auth.currentUser;
      if (user) {
        const historyRef = collection(db, "users", user.uid, "codingHistory");
        await addDoc(historyRef, {
          problemId: selectedProblem.id,
          topic: selectedProblem.topic,
          title: selectedProblem.title,
          language,
          code,
          score: review.score,
          verdict: review.verdict,
          feedback: review.feedback,
          executionVerdict: executionSummary,
          createdAt: serverTimestamp(),
        });
        await loadHistory();
        createNotification(
          user.uid,
          "coding",
          "Coding challenge reviewed",
          `${selectedProblem.title} â€” ${review.verdict} (${review.score}%).`,
          "/dashboard/coding"
        );
      }
    } catch (err) {
      console.error("Code review failed:", err);
      // Gemini failing (e.g. a 503 "high demand" error) must never hide
      // the execution results from Step 1 â€” testResults state is untouched.
      setReviewError(
        canExecute && executionFailed
          ? "Code execution failed, and AI review is temporarily unavailable. Please try again."
          : canExecute
          ? "Code executed, but AI review is temporarily unavailable."
          : err instanceof Error
          ? err.message
          : "Review failed. Please try again."
      );
    } finally {
      setReviewing(false);
    }
  }

  /**
   * Phase D â€” Submit Code. Separate action from Run & Review: grades
   * against hiddenTestCases only, never calls Gemini, and never exposes
   * hidden input/expected/actual output to the UI â€” only the aggregate
   * pass count and a Solved boolean.
   */
  async function submitCode() {
    if (!selectedProblem || !code.trim()) return;
    if (!selectedProblem.executable || language !== "Python") return;
    if (selectedProblem.hiddenTestCases.length === 0) return;

    setSubmitting(true);
    setSubmitResult(null);
    try {
      const results = await runHiddenTestCases(code, selectedProblem.hiddenTestCases);
      const passed = results.filter((r) => r.verdict === "Passed").length;
      const hadError = results.some(
        (r) => r.verdict === "Network Error" || r.verdict === "Execution Error"
      );
      const total = results.length;
      const solved = !hadError && passed === total;

      setSubmitResult({ passed, total, solved, hadError });

      const user = auth.currentUser;
      if (user) {
        const historyRef = collection(db, "users", user.uid, "codingHistory");
        await addDoc(historyRef, {
          problemId: selectedProblem.id,
          topic: selectedProblem.topic,
          title: selectedProblem.title,
          language,
          code,
          // Real, honest score derived from hidden-test pass rate â€” never
          // Gemini's opinion â€” so bestScoreFor()'s existing Math.max logic
          // keeps working correctly without any changes to that function.
          score: Math.round((passed / total) * 100),
          verdict: solved ? "Solved" : "Not Solved",
          submitted: true,
          hiddenExecutionVerdict: `${passed}/${total} hidden tests passed`,
          solved,
          createdAt: serverTimestamp(),
        });
        await loadHistory();
        createNotification(
          user.uid,
          "coding",
          solved ? "Problem solved!" : "Submission graded",
          `${selectedProblem.title} â€” ${passed}/${total} hidden tests passed.`,
          "/dashboard/coding"
        );
      }
    } catch (err) {
      console.error("Hidden test submission failed:", err);
      setSubmitResult({ passed: 0, total: selectedProblem.hiddenTestCases.length, solved: false, hadError: true });
    } finally {
      setSubmitting(false);
    }
  }

  const weeklySolvedCount = new Set(
    history
      .filter((h) => {
        if (h.submitted !== true || h.solved !== true || !h.createdAt) {
          return false;
        }

        const days =
          (Date.now() - h.createdAt.toDate().getTime()) /
          (1000 * 60 * 60 * 24);

        return days >= 0 && days <= 7;
      })
      .map((h) => h.problemId)
  ).size;

  // Phase E â€” Easy/Medium/Hard solved-vs-total stats, across all topics.
  const difficultyStats = DIFFICULTIES.map((d) => {
    const problemsOfDifficulty = ALL_PROBLEMS.filter((p) => p.difficulty === d);
    const solvedCount = problemsOfDifficulty.filter((p) => isProblemSolved(p.id)).length;
    return { difficulty: d, solved: solvedCount, total: problemsOfDifficulty.length };
  });

  const visibleProblems = selectedTopic
    ? CODING_PROBLEMS[selectedTopic].filter(
        (p) => difficultyFilter === "All" || p.difficulty === difficultyFilter
      )
    : [];

  return (
    <AgentBackground>
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Coding Agent</h1>
        <p className="mt-2 text-sm text-graytext">Practice DSA problems and get real AI code review.</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-graytext">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          For Python problems marked executable, your code actually runs against real public test
          cases via a sandboxed execution service. For other problems or languages, results come from
          Gemini AI reading your code â€” a strong practice signal, not a guaranteed correctness check.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {view === "topics" && (
          <motion.div key="topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Code2 className="h-7 w-7 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Choose a topic</h2>
                    <p className="text-xs text-graytext">
                      Weekly target: solve {WEEKLY_TARGET} problems by passing all hidden tests.

                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  {weeklySolvedCount}/{WEEKLY_TARGET} this week
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {CODING_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => openTopic(topic)}
                    className="rounded-xl border border-border p-4 text-center font-medium text-ink transition-colors hover:border-primary hover:bg-primary-light"
                  >
                    {topic}
                    <span className="mt-1 block text-xs font-normal text-graytext">
                      {CODING_PROBLEMS[topic].length} problems
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
                {difficultyStats.map(({ difficulty, solved, total }) => (
                  <div key={difficulty} className="text-center">
                    <p className="text-xs font-medium text-graytext">{difficulty}</p>
                    <p className="mt-1 text-sm font-bold text-ink">
                      {solved}/{total}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
                <History className="h-4 w-4 text-primary" /> Recent Submissions
              </h3>
              {isLoadingHistory && <p className="text-sm text-graytext">Loading...</p>}
              {!isLoadingHistory && history.length === 0 && (
                <p className="text-sm text-graytext">No submissions yet â€” pick a topic above to get started.</p>
              )}
              <ul className="space-y-2">
                {history.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-graydark">{item.topic}</p>
                      <p className="text-xs text-graytext">
                        {item.verdict}
                        {item.createdAt && ` Â· ${item.createdAt.toDate().toLocaleDateString()}`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.score >= 70 ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                      }`}
                    >
                      {item.score}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {view === "problems" && selectedTopic && (
          <motion.div key="problems" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <button onClick={() => setView("topics")} className="mb-4 flex items-center gap-1 text-sm font-medium text-graytext hover:text-ink">
              <ChevronLeft className="h-4 w-4" /> All topics
            </button>
            <h2 className="mb-4 text-lg font-semibold text-ink">{selectedTopic}</h2>

            <div className="mb-4 flex flex-wrap gap-2">
              {DIFFICULTY_FILTERS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    difficultyFilter === d
                      ? "bg-primary text-white"
                      : "border border-border text-graytext hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {visibleProblems.length === 0 && (
                <p className="text-sm text-graytext">No {difficultyFilter !== "All" ? difficultyFilter.toLowerCase() : ""} problems in this topic yet.</p>
              )}
              {visibleProblems.map((problem) => {
                const best = bestScoreFor(problem.id);
                const solved = isProblemSolved(problem.id);
                return (
                  <button
                    key={problem.id}
                    onClick={() => openProblem(problem)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-left transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      {solved ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-graytext" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink">{problem.title}</p>
                        <p className="mt-0.5 text-xs text-graytext">
                          {problem.difficulty} â€¢ {problem.topic}
                        </p>
                      </div>
                    </div>
                    {best !== null && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${best >= 70 ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
                        Best: {best}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === "solve" && selectedProblem && (
          <motion.div key="solve" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <button onClick={() => setView("problems")} className="mb-4 flex items-center gap-1 text-sm font-medium text-graytext hover:text-ink">
                <ChevronLeft className="h-4 w-4" /> {selectedTopic}
              </button>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{selectedProblem.title}</h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {selectedProblem.difficulty}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-graydark">{selectedProblem.description}</p>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-graytext">
                  {selectedProblem.examples.length > 1 ? "Examples" : "Example"}
                </p>
                {selectedProblem.examples.map((ex, i) => (
                  <div key={i} className={i > 0 ? "mt-2" : undefined}>
                    <p className="mt-1 text-xs text-graydark">Input: {ex.input}</p>
                    <p className="text-xs text-graydark">Output: {ex.output}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-graytext">Constraints</p>
                <p className="mt-1 text-xs text-graydark">{selectedProblem.constraints}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Your Solution</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-hidden rounded-xl border border-border transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
                <Editor
                  height="360px"
                  language={LANGUAGE_TO_MONACO_ID[language] ?? "plaintext"}
                  value={code}
                  onChange={(value) => setCode(value ?? "")}
                  theme="placementai-dark"
                  beforeMount={handleEditorBeforeMount}
                  loading={
                    <div className="flex h-[360px] w-full items-center justify-center bg-[#0B0B0B] text-xs text-graytext">
                      Loading editor...
                    </div>
                  }
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: "on",
                    padding: { top: 14, bottom: 14 },
                    renderLineHighlight: "line",
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                  }}
                />
              </div>

              {selectedProblem.executable && language !== "Python" && (
                <p className="mt-3 text-[11px] text-graytext">
                  Real execution is Python-only right now â€” this run will use AI review only.
                </p>
              )}
              {!selectedProblem.executable && (
                <p className="mt-3 text-[11px] text-graytext">
                  Code execution is not available for this problem yet â€” AI review only.
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={submitForReview}
                  disabled={reviewing || runningTests || submitting || !code.trim()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {reviewing || runningTests ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {runningTests
                    ? "Running tests..."
                    : reviewing
                    ? "Reviewing..."
                    : selectedProblem.executable && language === "Python"
                    ? "Run & Review"
                    : "Submit for AI Review"}
                </button>

                {selectedProblem.executable && language === "Python" && (
                  <button
                    onClick={submitCode}
                    disabled={reviewing || runningTests || submitting || !code.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/40 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {submitting ? "Submitting..." : "Submit Code"}
                  </button>
                )}
              </div>

              {submitResult && (
                <div
                  className={`mt-4 rounded-xl border p-4 ${
                    submitResult.solved
                      ? "border-success/30 bg-success/5"
                      : submitResult.hadError
                      ? "border-orange-500/30 bg-orange-500/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {submitResult.solved ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : submitResult.hadError ? (
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-primary" />
                    )}
                    <p className="text-sm font-semibold text-ink">
                      {submitResult.solved ? "Solved" : submitResult.hadError ? "Could Not Verify" : "Not Solved"}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-graytext">
                    {submitResult.hadError
                      ? "One or more hidden tests could not be executed due to a service error. Please try submitting again."
                      : `${submitResult.passed}/${submitResult.total} hidden tests passed.`}
                  </p>
                </div>
              )}

              {testResults && (
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="mb-3 text-sm font-semibold text-ink">
                    Test Results â€” {testResults.filter((r) => r.verdict === "Passed").length}/{testResults.length} passed
                  </p>
                  <div className="space-y-2">
                    {testResults.map((r, i) => (
                      <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="font-medium text-graydark">Test Case {i + 1}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              r.verdict === "Passed"
                                ? "bg-success/15 text-success"
                                : r.verdict === "Wrong Answer"
                                ? "bg-primary/15 text-primary"
                                : "bg-orange-500/15 text-orange-400"
                            }`}
                          >
                            {r.verdict === "Passed" && <CheckCircle2 className="h-3 w-3" />}
                            {r.verdict === "Wrong Answer" && <XCircle className="h-3 w-3" />}
                            {r.verdict !== "Passed" && r.verdict !== "Wrong Answer" && <AlertCircle className="h-3 w-3" />}
                            {r.verdict}
                          </span>
                        </div>
                        <p className="text-graytext">Input: <span className="text-graydark">{r.input || "(none)"}</span></p>
                        <p className="text-graytext">Expected: <span className="text-graydark">{r.expectedOutput}</span></p>
                        <p className="text-graytext">Actual: <span className="text-graydark">{r.stdout || "(empty)"}</span></p>
                        {r.stderr && (
                          <p className="mt-1 text-graytext">
                            Error: <span className="text-primary">{r.stderr}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviewError && (
                <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                  {reviewError}
                </p>
              )}

              {result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {result.verdict === "Correct" && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {result.verdict === "Partially Correct" && <AlertCircle className="h-4 w-4 text-orange-400" />}
                      {result.verdict === "Incorrect" && <XCircle className="h-4 w-4 text-primary" />}
                      {result.verdict}
                    </span>
                    <span className="text-lg font-bold text-primary">{result.score}%</span>
                  </div>
                  <p className="text-xs leading-relaxed text-graydark">{result.feedback}</p>
                  <div className="mt-3 flex gap-4 text-xs text-graytext">
                    <span>Time: {result.timeComplexity}</span>
                    <span>Space: {result.spaceComplexity}</span>
                  </div>
                  {result.suggestions.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-graytext">â€¢ {s}</li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
    </AgentBackground>
  );
}
