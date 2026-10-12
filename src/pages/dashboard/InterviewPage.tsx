import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, PlayCircle, ChevronLeft, ChevronRight, Loader2, Volume2,
  History, CheckCircle2, Trophy,
} from "lucide-react";
import {
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { AgentBackground } from "../../components/shared/AgentBackground";
import { createNotification } from "../../lib/notificationService";
import { useAuthStore } from "../../store/authStore";
import {
  generateInterviewQuestions, reviewInterviewAnswers,
  type InterviewType, type InterviewReviewResult,
} from "../../lib/interviewAI";

// =====================================================================
// Interview Agent — real AI-generated questions (tailored to the
// student's branch/skills via Gemini), typed answers, real AI review.
// No voice recording/transcription (unreliable cross-browser) — text
// input, with an optional browser-native "read aloud" for the question.
// Sessions saved to users/{uid}/interviewHistory, same pattern as the
// other agents.
// =====================================================================

const INTERVIEW_TYPES: InterviewType[] = ["HR", "Technical", "Behavioral"];
const COMPLETION_TARGET = 70;

interface HistoryEntry {
  id: string;
  type: InterviewType;
  score: number;
  createdAt: Timestamp | null;
}

type View = "setup" | "loading-questions" | "interview" | "reviewing" | "result";

export default function InterviewPage() {
  const profile = useAuthStore((s) => s.profile);

  const [view, setView] = useState<View>("setup");
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<InterviewReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const historyRef = collection(db, "users", user.uid, "interviewHistory");
      const snap = await getDocs(query(historyRef, orderBy("createdAt", "desc"), limit(10)));
      setHistory(
        snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, type: data.type, score: data.score, createdAt: data.createdAt ?? null };
        })
      );
    } catch (err) {
      console.error("Failed to load interview history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function startInterview(type: InterviewType) {
    setSelectedType(type);
    setError(null);
    setView("loading-questions");
    try {
      const qs = await generateInterviewQuestions(
        type,
        profile?.department || "Computer Science",
        profile?.skills || []
      );
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(""));
      setCurrentIndex(0);
      setView("interview");
    } catch (err) {
      console.error("Failed to generate questions:", err);
      setError(err instanceof Error ? err.message : "Could not generate questions. Please try again.");
      setView("setup");
    }
  }

  function setAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = value;
      return next;
    });
  }

  function readAloud(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  async function finishInterview() {
    if (!selectedType) return;
    setView("reviewing");
    setError(null);
    try {
      const qas = questions.map((q, i) => ({ question: q, answer: answers[i] }));
      const review = await reviewInterviewAnswers(selectedType, qas);
      setResult(review);
      setView("result");

      const user = auth.currentUser;
      if (user) {
        const historyRef = collection(db, "users", user.uid, "interviewHistory");
        await addDoc(historyRef, {
          type: selectedType,
          score: review.overallScore,
          overallFeedback: review.overallFeedback,
          strengths: review.strengths,
          weaknesses: review.weaknesses,
          perQuestion: review.perQuestion,
          createdAt: serverTimestamp(),
        });
        await loadHistory();
        createNotification(
          user.uid,
          "interview",
          "Mock interview completed",
          `${selectedType} interview — scored ${review.overallScore}%.`,
          "/dashboard/interview"
        );
      }
    } catch (err) {
      console.error("Interview review failed:", err);
      setError(err instanceof Error ? err.message : "Review failed. Please try again.");
      setView("interview");
    }
  }

  function backToSetup() {
    setView("setup");
    setSelectedType(null);
    setQuestions([]);
    setAnswers([]);
    setResult(null);
  }

  return (
    <AgentBackground>
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Interview Agent</h1>
        <p className="mt-2 text-sm text-graytext">Practice mock interviews and get real AI feedback.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {view === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary-light p-5">
                  <Mic className="h-10 w-10 text-primary" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-ink">AI Mock Interview</h2>
                <p className="mt-2 text-sm text-graytext">
                  Gemini generates 5 real questions tailored to your branch and skills.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {INTERVIEW_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => startInterview(type)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border p-5 font-medium text-ink transition-colors hover:border-primary hover:bg-primary-light"
                  >
                    <PlayCircle className="h-6 w-6 text-primary" />
                    {type} Interview
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
                <History className="h-4 w-4 text-primary" /> Recent Sessions
              </h3>
              {isLoadingHistory && <p className="text-sm text-graytext">Loading...</p>}
              {!isLoadingHistory && history.length === 0 && (
                <p className="text-sm text-graytext">No sessions yet — start your first mock interview above.</p>
              )}
              <ul className="space-y-2">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-graydark">{item.type} Interview</p>
                      <p className="text-xs text-graytext">
                        {item.createdAt && item.createdAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.score >= COMPLETION_TARGET ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
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

        {view === "loading-questions" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface shadow-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-graytext">Generating your {selectedType} questions...</p>
          </motion.div>
        )}

        {view === "interview" && questions.length > 0 && (
          <motion.div key="interview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <button onClick={backToSetup} className="flex items-center gap-1 text-sm font-medium text-graytext hover:text-ink">
                <ChevronLeft className="h-4 w-4" /> Exit
              </button>
              <span className="text-xs text-graytext">
                Question {currentIndex + 1} of {questions.length} — {selectedType}
              </span>
            </div>

            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#FF4D4D] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="mt-6 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">{questions[currentIndex]}</h2>
              <button
                onClick={() => readAloud(questions[currentIndex])}
                className="shrink-0 rounded-lg border border-white/10 p-2 text-graytext hover:border-primary/40 hover:text-primary"
                title="Read question aloud"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={answers[currentIndex]}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={6}
              className="mt-4 w-full rounded-xl border border-border bg-[#0B0B0B] p-4 text-sm text-ink placeholder:text-graytext focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              {currentIndex + 1 < questions.length ? (
                <button
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={finishInterview}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  <CheckCircle2 className="h-4 w-4" /> Finish & Get AI Review
                </button>
              )}
            </div>
          </motion.div>
        )}

        {view === "reviewing" && (
          <motion.div key="reviewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface shadow-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-graytext">Reviewing your answers...</p>
          </motion.div>
        )}

        {view === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-ink">{selectedType} Interview Complete</h2>
              <p className="mt-6 text-5xl font-extrabold text-primary">{result.overallScore}%</p>
              <p className="mt-3 text-sm leading-relaxed text-graytext">{result.overallFeedback}</p>

              <div className="mt-6 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">Strengths</p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-graydark">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Weaknesses</p>
                  <ul className="space-y-1">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-graydark">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h3 className="mb-4 text-base font-bold text-ink">Question-by-Question Feedback</h3>
              <div className="space-y-3">
                {result.perQuestion.map((q, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{q.question}</p>
                      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {q.score}%
                      </span>
                    </div>
                    <p className="text-xs italic text-graytext">"{q.answer || "No answer given"}"</p>
                    <p className="mt-2 text-xs text-graydark">{q.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => selectedType && startInterview(selectedType)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-ink hover:border-primary/50 hover:text-primary"
              >
                Retry {selectedType} Interview
              </button>
              <button
                onClick={backToSetup}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Back to Setup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
    </AgentBackground>
  );
}
