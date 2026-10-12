import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  Target, RefreshCw, Sparkles, TrendingUp, TrendingDown, Building2,
  BookOpen, GraduationCap, ListChecks, CalendarDays, Award, Loader2,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { createNotification } from "../../lib/notificationService";
import { useAuthStore } from "../../store/authStore";
import { useAgentStatusStore } from "../../store/useAgentStatusStore";
import { useRecommendationStore, type RecommendationData } from "../../store/useRecommendationStore";
import {
  getAptitudeTopicBreakdown,
  getLatestResumeAnalysis,
  getCachedRecommendation,
  saveRecommendation,
  buildInputSnapshot,
  type AptitudeTopicBreakdown,
} from "../../lib/recommendationService";
import { generateRecommendations } from "../../lib/recommendationAI";

// =====================================================================
// AnalyticsPage.tsx — the Recommendation Agent ("AI Career Mentor")
// Route unchanged: /dashboard/analytics
//
// Weak/strong areas are computed HERE from real Firestore data (real
// aptitude topic averages + the real saved resume analysis) — Gemini
// never invents a specific weakness. Gemini only generates the advisory
// content (roadmap, companies, skills, courses, goals, feedback),
// grounded in those real numbers via the prompt in lib/recommendationAI.
// =====================================================================

function computeWeakStrong(
  breakdown: AptitudeTopicBreakdown[],
  resumeStrengths: string[],
  resumeWeaknesses: string[]
) {
  const weak: string[] = [];
  const strong: string[] = [];

  breakdown.forEach((b) => {
    if (b.averageScore < 50) weak.push(`Weak in ${b.topic} (avg ${b.averageScore}%)`);
    if (b.averageScore >= 80) strong.push(`Strong in ${b.topic} (avg ${b.averageScore}%)`);
  });

  resumeWeaknesses.slice(0, 2).forEach((w) => weak.push(`Resume: ${w}`));
  resumeStrengths.slice(0, 2).forEach((s) => strong.push(`Resume: ${s}`));

  return { weak, strong };
}

export default function AnalyticsPage() {
  const profile = useAuthStore((s) => s.profile);
  const resumeStatus = useAgentStatusStore((s) => s.resume);
  const codingStatus = useAgentStatusStore((s) => s.coding);
  const interviewStatus = useAgentStatusStore((s) => s.interview);
  const aptitudeStatus = useAgentStatusStore((s) => s.aptitude);

  const { data, isGenerating, error, setData, setGenerating, setError } = useRecommendationStore();
  const [initializing, setInitializing] = useState(true);
  const generationInProgress = useRef(false);
  const initialGenerationStarted = useRef(false);

  const profileFields = [
    profile?.fullName, profile?.email, profile?.phoneNumber, profile?.college,
    profile?.department, profile?.year, profile?.rollNumber,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 70 +
      (Math.min(profile?.skills?.length ?? 0, 5) / 5) * 30
  );

  const overallReadiness = Math.round(
    (resumeStatus.score + codingStatus.score + interviewStatus.score + aptitudeStatus.score) / 4
  );

  async function runGeneration(forceRefresh: boolean) {
    const uid = auth.currentUser?.uid;

    if (!uid || !profile || generationInProgress.current) return;

    generationInProgress.current = true;
    setGenerating(true);
    setError(null);
    try {
      // Restore saved recommendations first, so the dashboard stays
      // visible even if the other data requests or Gemini fail.
      const cached = await getCachedRecommendation(uid);

      if (cached) {
        setData(cached);
      }

      // Load the latest student data separately.
      const [breakdown, resumeAnalysis] = await Promise.all([
        getAptitudeTopicBreakdown(uid),
        getLatestResumeAnalysis(uid),
      ]);

      const snapshot = buildInputSnapshot({
        resume: resumeStatus.score,
        coding: codingStatus.score,
        interview: interviewStatus.score,
        aptitude: aptitudeStatus.score,
        profileCompletion,
        aptitudeAttempts: breakdown.map((b) => `${b.topic}:${b.averageScore}`).join(","),
      });

      if (!forceRefresh && cached && cached.inputSnapshot === snapshot) {
        setData(cached);
        return;
      }

      const { weak, strong } = computeWeakStrong(
        breakdown,
        resumeAnalysis?.strengths ?? [],
        resumeAnalysis?.weaknesses ?? []
      );

      const generated = await generateRecommendations({
        fullName: profile.fullName || "Student",
        college: profile.college || "not specified",
        department: profile.department || "not specified",
        skills: profile.skills ?? [],
        resumeScore: resumeStatus.score,
        codingScore: codingStatus.score,
        interviewScore: interviewStatus.score,
        aptitudeScore: aptitudeStatus.score,
        profileCompletion,
        overallReadiness,
        aptitudeBreakdown: breakdown,
        resumeStrengths: resumeAnalysis?.strengths ?? [],
        resumeWeaknesses: resumeAnalysis?.weaknesses ?? [],
        weakAreas: weak,
        strongAreas: strong,
        codingDataAvailable: codingStatus.score > 0,
        interviewDataAvailable: interviewStatus.score > 0,
      });

      const finalData: RecommendationData = {
        ...generated,
        previousReadiness: cached?.placementPrediction.readiness ?? null,
        generatedAt: new Date().toISOString(),
        inputSnapshot: snapshot,
      };

      await saveRecommendation(uid, finalData);
      setData(finalData);

      if (finalData.previousReadiness !== null) {
        createNotification(
          uid,
          "weeklyReport",
          "Weekly progress report generated",
          `Placement readiness ${overallReadiness}% (${
            overallReadiness >= finalData.previousReadiness ? "+" : ""
          }${overallReadiness - finalData.previousReadiness}% since last check).`,
          "/dashboard/analytics"
        );
      } else {
        createNotification(
          uid,
          "recommendation",
          "New AI recommendations ready",
          "Your Recommendation Agent has generated a fresh roadmap based on your latest scores.",
          "/dashboard/analytics"
        );
      }
    } catch (err) {
      console.error("Recommendation generation failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong generating recommendations.");
    } finally {
      generationInProgress.current = false;
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (!profile || initialGenerationStarted.current) return;

    initialGenerationStarted.current = true;

    runGeneration(false).finally(() => {
      setInitializing(false);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  const completedAgents = [codingStatus, resumeStatus, interviewStatus, aptitudeStatus].filter(
    (s) => s.status === "completed"
  ).length;

  if (initializing) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink">Recommendation Agent</h1>
          <p className="mt-2 text-sm text-graytext">
            Your AI Career Mentor — personalized guidance based on your real progress.
          </p>
        </div>
        <button
          onClick={() => runGeneration(true)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">{error}</div>
      )}

      {!data && !isGenerating && !error && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-graytext">No recommendations yet.</p>
        </div>
      )}

      {data && (
        <>
          {/* Personalized Dashboard */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
              <div className="h-32 w-32">
                <CircularProgressbarWithChildren
                  value={overallReadiness}
                  strokeWidth={9}
                  styles={buildStyles({ pathColor: "#E50914", trailColor: "rgba(255,255,255,0.08)" })}
                >
                  <Target className="mb-1 h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-ink">{overallReadiness}%</span>
                </CircularProgressbarWithChildren>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">Placement Readiness</p>
              {data.previousReadiness !== null && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    overallReadiness >= data.previousReadiness ? "text-success" : "text-primary"
                  }`}
                >
                  {overallReadiness >= data.previousReadiness ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {overallReadiness >= data.previousReadiness ? "+" : ""}
                  {overallReadiness - data.previousReadiness}% since last check
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              <MiniScore label="Resume ATS" value={resumeStatus.score} icon={Award} />
              <MiniScore label="Coding Score" value={codingStatus.score} icon={ListChecks} />
              <MiniScore label="Interview Score" value={interviewStatus.score} icon={Sparkles} />
              <MiniScore label="Aptitude Score" value={aptitudeStatus.score} icon={Target} />
              <MiniScore label="Profile Completion" value={profileCompletion} icon={GraduationCap} />
              <MiniScore label="Agents Completed" value={completedAgents} icon={CalendarDays} suffix="/4" noPercent />
            </div>
          </div>

          {/* AI Recommendations */}
          <SectionCard title="AI Recommendations" icon={Sparkles}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.aiRecommendations.map((rec, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-graydark hover:border-primary/30"
                >
                  {rec}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Weak / Strong areas — computed from real data, not AI-generated */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Weak Areas" icon={TrendingDown} accent="primary">
              {data.weakAreas.length === 0 ? (
                <p className="text-sm text-graytext">
                  No weak areas detected yet — complete more quizzes and analyses to unlock this.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.weakAreas.map((w, i) => (
                    <li key={i} className="text-sm text-graydark">
                      • {w}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Strong Areas" icon={TrendingUp} accent="success">
              {data.strongAreas.length === 0 ? (
                <p className="text-sm text-graytext">
                  No strong areas confirmed yet — keep practicing to build your profile.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.strongAreas.map((s, i) => (
                    <li key={i} className="text-sm text-graydark">
                      • {s}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Learning Roadmap */}
          <SectionCard title="Learning Roadmap" icon={CalendarDays}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.roadmap.map((week) => (
                <div
                  key={week.week}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-primary/30"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Week {week.week}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{week.title}</p>
                  <ul className="mt-2 space-y-1">
                    {week.items.map((item, i) => (
                      <li key={i} className="text-xs text-graytext">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Daily AI Goals */}
          <SectionCard title="Daily AI Goals" icon={ListChecks}>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.dailyGoals.map((goal, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-graydark"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {goal}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Company Recommendations */}
          <SectionCard title="Company Recommendations" icon={Building2}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.companies.map((c) => (
                <div
                  key={c.name}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-primary/30"
                >
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="mt-1 text-xs text-graytext">{c.reason}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Skill + Course Recommendations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Skill Recommendations" icon={GraduationCap}>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-graydark"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Course Recommendations" icon={BookOpen}>
              <ul className="space-y-2">
                {data.courses.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-graydark">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {c.platform}
                    </span>
                    {c.topic}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          {/* Weekly Progress Report */}
          <SectionCard title="Weekly Progress Report" icon={TrendingUp}>
            <p className="text-sm text-graydark">{data.weeklyFeedback}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniScore label="Readiness" value={overallReadiness} icon={Target} />
              <MiniScore label="Agents Completed" value={completedAgents} icon={ListChecks} noPercent suffix="/4" />
              <MiniScore label="Agents Remaining" value={4 - completedAgents} icon={CalendarDays} noPercent />
              <MiniScore
                label="Improvement"
                value={data.previousReadiness !== null ? overallReadiness - data.previousReadiness : 0}
                icon={TrendingUp}
                noPercent
                signed
              />
            </div>
          </SectionCard>

          {/* Placement Prediction */}
          <SectionCard title="Placement Prediction" icon={Target}>
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[auto_1fr]">
              <div className="text-center">
                <p className="text-5xl font-extrabold text-primary">{data.placementPrediction.readiness}%</p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    data.placementPrediction.chance === "High"
                      ? "bg-success/15 text-success"
                      : data.placementPrediction.chance === "Medium"
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {data.placementPrediction.chance} Chance
                </span>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graytext">
                  Expected companies at current readiness
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {data.placementPrediction.expectedCompanies.map((c) => (
                    <span key={c} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graytext">
                  To reach 95% readiness
                </p>
                <ul className="space-y-1">
                  {data.placementPrediction.suggestionsToReach95.map((s, i) => (
                    <li key={i} className="text-sm text-graydark">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          <p className="text-center text-xs text-graytext">
            Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  accent = "primary",
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  accent?: "primary" | "success";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
        <Icon className={`h-4 w-4 ${accent === "success" ? "text-success" : "text-primary"}`} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function MiniScore({
  label,
  value,
  icon: Icon,
  noPercent,
  suffix,
  signed,
}: {
  label: string;
  value: number;
  icon: typeof Award;
  noPercent?: boolean;
  suffix?: string;
  signed?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-graytext">{label}</span>
      </div>
      <p className="text-xl font-bold text-ink">
        {signed && value > 0 ? "+" : ""}
        {value}
        {suffix ?? (noPercent ? "" : "%")}
      </p>
    </div>
  );
}
