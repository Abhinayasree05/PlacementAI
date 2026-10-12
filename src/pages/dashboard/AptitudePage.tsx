import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Brain, Clock, CheckCircle2, XCircle, ArrowRight,
  RotateCcw, Trophy, History, ChevronLeft,
} from "lucide-react";
import {
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { AgentBackground } from "../../components/shared/AgentBackground";
import { createNotification } from "../../lib/notificationService";
import { APTITUDE_TOPICS, APTITUDE_QUESTIONS, type AptitudeTopic } from "../../data/aptitudeQuestions";

// ---------------------------------------------------------------------
// Aptitude Agent — real timed quiz engine, real Firestore-backed history.
// Each attempt is written to users/{uid}/aptitudeHistory, the same
// pattern already used by Resume Agent's resumeHistory collection.
// ---------------------------------------------------------------------

const SECONDS_PER_QUESTION = 30;
const COMPLETION_TARGET = 70; // score % treated as "quiz completion target"

interface AttemptHistoryItem {
  id: string;
  topic: AptitudeTopic;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: Timestamp | null;
}

type View = "topics" | "quiz" | "result";

export default function AptitudePage() {
  const [view, setView] = useState<View>("topics");
  const [selectedTopic, setSelectedTopic] = useState<AptitudeTopic | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const questions = selectedTopic ? APTITUDE_QUESTIONS[selectedTopic] : [];
  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const historyRef = collection(db, "users", user.uid, "aptitudeHistory");
      const q = query(historyRef, orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      setHistory(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            topic: data.topic,
            score: data.score,
            correctCount: data.correctCount,
            totalQuestions: data.totalQuestions,
            createdAt: data.createdAt ?? null,
          };
        })
      );
    } catch (err) {
      console.error("Failed to load aptitude history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function startQuiz(topic: AptitudeTopic) {
    setSelectedTopic(topic);
    setAnswers(new Array(APTITUDE_QUESTIONS[topic].length).fill(null));
    setQuestionIndex(0);
    setTimeLeft(SECONDS_PER_QUESTION);
    setView("quiz");
  }

  // Per-question countdown — auto-advances (as unanswered) on timeout.
  useEffect(() => {
    if (view !== "quiz") return;
    if (timeLeft <= 0) {
      goToNext();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, view]);

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  function goToNext() {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
      setTimeLeft(SECONDS_PER_QUESTION);
    } else {
      finishQuiz();
    }
  }

  const correctCount = useMemo(
    () => answers.filter((a, i) => a !== null && a === questions[i]?.correctIndex).length,
    [answers, questions]
  );

  async function finishQuiz() {
    setView("result");
    if (!selectedTopic) return;

    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const historyRef = collection(db, "users", user.uid, "aptitudeHistory");
      await addDoc(historyRef, {
        topic: selectedTopic,
        score,
        correctCount,
        totalQuestions: total,
        createdAt: serverTimestamp(),
      });
      await loadHistory();
      createNotification(
        user.uid,
        "aptitude",
        "Aptitude quiz completed",
        `${selectedTopic} — scored ${score}% (${correctCount}/${total}).`,
        "/dashboard/aptitude"
      );
    } catch (err) {
      console.error("Failed to save aptitude attempt:", err);
    } finally {
      setSaving(false);
    }
  }

  function backToTopics() {
    setView("topics");
    setSelectedTopic(null);
    setQuestionIndex(0);
    setAnswers([]);
  }

  const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <AgentBackground>
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Aptitude Agent</h1>
        <p className="mt-2 text-sm text-graytext">
          Practice aptitude questions and improve your placement readiness.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {view === "topics" && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary-light p-5">
                  <Calculator className="h-10 w-10 text-primary" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-ink">Aptitude Practice</h2>
                <p className="mt-2 text-sm text-graytext">
                  Pick a topic to start a {SECONDS_PER_QUESTION}s-per-question timed quiz.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                {APTITUDE_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => startQuiz(topic)}
                    className="rounded-xl border border-border p-4 text-center font-medium text-ink transition-colors hover:border-primary hover:bg-primary-light"
                  >
                    {topic}
                    <span className="mt-1 block text-xs font-normal text-graytext">
                      {APTITUDE_QUESTIONS[topic].length} questions
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-ink">AI Recommendation</h3>
                  <p className="text-sm text-graytext">
                    Practice daily to improve your speed and accuracy.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
                <History className="h-4 w-4 text-primary" /> Recent Attempts
              </h3>
              {isLoadingHistory && <p className="text-sm text-graytext">Loading...</p>}
              {!isLoadingHistory && history.length === 0 && (
                <p className="text-sm text-graytext">No attempts yet — take your first quiz above.</p>
              )}
              <ul className="space-y-2">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-graydark">{item.topic}</p>
                      <p className="text-xs text-graytext">
                        {item.correctCount}/{item.totalQuestions} correct
                        {item.createdAt && ` · ${item.createdAt.toDate().toLocaleDateString()}`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.score >= COMPLETION_TARGET
                          ? "bg-success/15 text-success"
                          : "bg-primary/15 text-primary"
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

        {view === "quiz" && currentQuestion && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={backToTopics}
                className="flex items-center gap-1 text-sm font-medium text-graytext hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" /> Exit quiz
              </button>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Clock className="h-4 w-4" /> {timeLeft}s
              </div>
            </div>

            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#FF4D4D] transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="mb-6 text-xs text-graytext">
              Question {questionIndex + 1} of {questions.length} — {selectedTopic}
            </p>

            <h2 className="mb-6 text-lg font-semibold text-ink">{currentQuestion.question}</h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const selected = answers[questionIndex] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-graydark hover:border-primary/40"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNext}
              disabled={answers[questionIndex] === null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {questionIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {view === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-ink">
              {finalScore >= COMPLETION_TARGET ? "Great work!" : "Quiz Complete"}
            </h2>
            <p className="mt-1 text-sm text-graytext">{selectedTopic}</p>

            <p className="mt-6 text-5xl font-extrabold text-primary">{finalScore}%</p>
            <p className="mt-2 text-sm text-graytext">
              {correctCount} out of {questions.length} correct
            </p>
            {saving && <p className="mt-2 text-xs text-graytext">Saving your result...</p>}

            <div className="mt-8 space-y-2 text-left">
              {questions.map((q, i) => {
                const userAnswer = answers[i];
                const isCorrect = userAnswer === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    )}
                    <div>
                      <p className="text-graydark">{q.question}</p>
                      {!isCorrect && (
                        <p className="mt-1 text-graytext">
                          Correct answer: {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => selectedTopic && startQuiz(selectedTopic)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-ink hover:border-primary/50 hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button
                onClick={backToTopics}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Back to Topics
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
