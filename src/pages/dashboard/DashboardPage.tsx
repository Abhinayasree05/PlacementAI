import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  Code2, FileText, Mic, Calculator, Sparkles, ArrowUpRight,
  CheckCircle2, GraduationCap, Mail, Award, Target,
  TrendingUp, Zap, AlertCircle, ListChecks, Flame,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAgentStatusStore, type AgentStatus } from "../../store/useAgentStatusStore";
import { BarChart } from "../../components/shared/BarChart";
import { AgentBackground } from "../../components/shared/AgentBackground";

// ---------------------------------------------------------------------
// Static / derived display data. None of this touches Firestore,
// Firebase Auth, or business logic — it only reshapes the same profile
// scores that were already being read from useAuthStore before.
// ---------------------------------------------------------------------

const RECENT_ACTIVITY = [
  { label: "Completed Aptitude Quiz — Logical Reasoning", time: "2 hours ago", icon: Calculator },
  { label: "Submitted Coding Challenge — Binary Trees", time: "Yesterday", icon: Code2 },
  { label: "Resume analyzed — ATS score 78%", time: "2 days ago", icon: FileText },
  { label: "Mock Interview Finished — Behavioral Round", time: "4 days ago", icon: Mic },
];

const UPCOMING_TASKS = [
  { label: "Mock Technical Interview", due: "Tomorrow, 10:00 AM", countdown: "1 day left", priority: "High" as const },
  { label: "Daily Aptitude Challenge", due: "Today", countdown: "Due today", priority: "Medium" as const },
  { label: "Update resume with new project", due: "This week", countdown: "5 days left", priority: "Low" as const },
];

const PRIORITY_STYLES = {
  High: "bg-primary/15 text-primary border-primary/30",
  Medium: "bg-white/10 text-graydark border-white/15",
  Low: "bg-white/5 text-graytext border-white/10",
};

// Status badge styling per spec: Completed = green, In Progress = red,
// Not Started = gray (never blue/purple/orange).
const STATUS_BADGE_STYLES: Record<string, string> = {
  completed: "bg-success/15 text-success",
  "in-progress": "bg-primary/15 text-primary",
  "not-started": "bg-white/10 text-graytext",
  active: "bg-white/10 text-graytext",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  "not-started": "Not Started",
  active: "Active",
};

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const resumeStatus = useAgentStatusStore((s) => s.resume);
  const codingStatus = useAgentStatusStore((s) => s.coding);
  const interviewStatus = useAgentStatusStore((s) => s.interview);
  const aptitudeStatus = useAgentStatusStore((s) => s.aptitude);
  const recommendationStatus = useAgentStatusStore((s) => s.recommendation);

  const displayName = profile?.fullName || firebaseUser?.displayName || "Student";

  // Scores now come from the live agent-status store (real Firestore data),
  // not the stale profile.*Score fields — see useAgentStatusListener.ts.
  const scores = {
    coding: codingStatus.score,
    resume: resumeStatus.score,
    interview: interviewStatus.score,
    aptitude: aptitudeStatus.score,
  };
  const overall = Math.round((scores.coding + scores.resume + scores.interview + scores.aptitude) / 4);

  const QUICK_ACCESS: {
    to: string;
    label: string;
    desc: string;
    icon: typeof Code2;
    score: number;
    detail: string;
    status: AgentStatus | "active";
  }[] = [
    {
      to: "/dashboard/coding",
      label: "Coding Agent",
      desc: "DSA practice with AI code review",
      icon: Code2,
      score: codingStatus.score,
      detail: codingStatus.detail,
      status: codingStatus.status,
    },
    {
      to: "/dashboard/resume",
      label: "Resume Agent",
      desc: "ATS score & resume feedback",
      icon: FileText,
      score: resumeStatus.score,
      detail: resumeStatus.detail,
      status: resumeStatus.status,
    },
    {
      to: "/dashboard/interview",
      label: "Interview Agent",
      desc: "AI mock interviews",
      icon: Mic,
      score: interviewStatus.score,
      detail: interviewStatus.detail,
      status: interviewStatus.status,
    },
    {
      to: "/dashboard/aptitude",
      label: "Aptitude Agent",
      desc: "Timed quizzes by topic",
      icon: Calculator,
      score: aptitudeStatus.score,
      detail: aptitudeStatus.detail,
      status: aptitudeStatus.status,
    },
    {
      to: "/dashboard/analytics",
      label: "Recommendation Agent",
      desc: "Your AI career mentor & roadmap",
      icon: Sparkles,
      score: recommendationStatus.score,
      detail: recommendationStatus.detail || "Not generated yet",
      status: recommendationStatus.status,
    },
  ];

  const completedAgents = [codingStatus, resumeStatus, interviewStatus, aptitudeStatus, recommendationStatus].filter(
    (s) => s.status === "completed"
  ).length;
  const remainingTasks = 5 - completedAgents;

  const insights = buildInsights(scores);

  return (
    <AgentBackground>
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-surface p-7 shadow-card sm:flex-row sm:items-center sm:p-8"
      >
        <div>
          <h1 className="text-[26px] font-semibold text-ink">
            Welcome back, {displayName.split(" ")[0]} 👋
          </h1>
          <p className="mt-1.5 text-sm text-graytext">Here's how your placement prep is going.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0">
            <CircularProgressbarWithChildren
              value={overall}
              strokeWidth={9}
              styles={buildStyles({
                pathColor: "#E50914",
                trailColor: "rgba(255,255,255,0.08)",
                pathTransitionDuration: 0.8,
              })}
            >
              <span className="text-lg font-bold text-ink">{overall}%</span>
            </CircularProgressbarWithChildren>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Overall Progress</p>
            <p className="text-xs text-graytext">Across all 4 agents</p>
          </div>
        </div>
      </motion.div>

      {/* Quick access cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink">Quick Access</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {QUICK_ACCESS.map(({ to, label, desc, icon: Icon, score, status }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 ease-in-out hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(229,9,20,0.16)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE_STYLES[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>

              <div className="mt-4">
                <p className="font-semibold text-ink">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-graytext">{desc}</p>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-graytext">
                  <span>Progress</span>
                  <span className="font-medium text-ink">{score}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <Link
                to={to}
                className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-semibold text-ink transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_14px_rgba(229,9,20,0.2)]"
              >
                Open Agent <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score breakdown */}
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card lg:col-span-2">
          <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-ink">
            <TrendingUp className="h-4 w-4 text-primary" /> Score Breakdown
          </h3>
          <BarChart
            data={[
              { label: "Coding", value: scores.coding },
              { label: "Aptitude", value: scores.aptitude },
              { label: "Interview", value: scores.interview },
              { label: "Resume ATS", value: scores.resume },
              { label: "Recommendation Score", value: overall },
            ]}
          />
        </div>

        {/* Completed agents / remaining tasks ring */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-7 text-center shadow-card">
          <h3 className="mb-5 self-start text-base font-semibold text-ink">Agent Completion</h3>
          <div className="h-32 w-32">
            <CircularProgressbarWithChildren
              value={(completedAgents / 5) * 100}
              strokeWidth={9}
              styles={buildStyles({
                pathColor: "#E50914",
                trailColor: "rgba(255,255,255,0.08)",
                pathTransitionDuration: 0.8,
              })}
            >
              <Flame className="h-5 w-5 text-primary mb-1" />
              <span className="text-xl font-bold text-ink">{completedAgents}/5</span>
            </CircularProgressbarWithChildren>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">{completedAgents} Agents Completed</p>
          <p className="text-xs text-graytext">{remainingTasks} remaining to reach full readiness</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile summary */}
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h3 className="mb-5 text-base font-semibold text-ink">Profile Summary</h3>
          <div className="flex items-center gap-4">
            {profile?.photoURL || firebaseUser?.photoURL ? (
              <img
                src={profile?.photoURL || firebaseUser?.photoURL || ""}
                alt={displayName}
                className="h-16 w-16 rounded-full border border-primary/30 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-ink">{displayName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-graytext">
                <Mail className="h-3 w-3" /> {profile?.email || firebaseUser?.email}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
            <div className="flex items-center gap-2 text-graydark">
              <GraduationCap className="h-4 w-4 text-graytext" />
              {profile?.college || "College not set"}
            </div>
            <div className="flex items-center gap-2 text-graydark">
              {profile?.department || "—"} · Year {profile?.year || "—"} · {profile?.rollNumber || "—"}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
            <MiniStat label="Placement Score" value={`${overall}%`} icon={Award} />
            <MiniStat label="Resume ATS" value={`${scores.resume}%`} icon={FileText} />
            <MiniStat label="Coding Level" value={codingLevelLabel(scores.coding)} icon={Code2} />
          </div>

          <Link
            to="/dashboard/profile"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            Edit Profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* AI Insights */}
        <div className="rounded-2xl border border-primary/20 bg-surface p-7 shadow-card">
          <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-primary" /> AI Insights
          </h3>
          <ul className="space-y-2.5">
            {insights.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-primary/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-graydark">{item.label}</p>
                  <p className="truncate text-xs text-graytext">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h3 className="mb-5 text-base font-semibold text-ink">Recent Activity</h3>
          <ul className="relative space-y-5 border-l border-white/10 pl-5">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.label} className="relative">
                <span className="absolute -left-[25px] flex h-5 w-5 items-center justify-center rounded-full bg-surface ring-4 ring-surface">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </span>
                <p className="text-sm text-graydark">{item.label}</p>
                <p className="mt-0.5 text-xs text-graytext">{item.time}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming tasks */}
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h3 className="mb-5 text-base font-semibold text-ink">Upcoming Tasks</h3>
          <ul className="space-y-2.5">
            {UPCOMING_TASKS.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
              >
                <div>
                  <p className="text-sm text-graydark">{item.label}</p>
                  <p className="mt-0.5 text-xs text-graytext">{item.due}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Placement Progress widget */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-surface p-7 shadow-card sm:p-8"
      >
        <h3 className="mb-6 flex items-center gap-2 text-base font-semibold text-ink">
          <ListChecks className="h-4 w-4 text-primary" /> Placement Progress
        </h3>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[190px_1fr]">
          <div className="mx-auto h-40 w-40">
            <CircularProgressbarWithChildren
              value={overall}
              strokeWidth={8}
              styles={buildStyles({
                pathColor: "#E50914",
                trailColor: "rgba(255,255,255,0.08)",
                pathTransitionDuration: 0.8,
              })}
            >
              <Target className="h-5 w-5 text-primary mb-1" />
              <span className="text-2xl font-bold text-ink">{overall}%</span>
              <span className="text-[11px] text-graytext">Readiness</span>
            </CircularProgressbarWithChildren>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <PlacementMetric label="Resume ATS" value={scores.resume} icon={FileText} />
            <PlacementMetric label="Coding Score" value={scores.coding} icon={Code2} />
            <PlacementMetric label="Interview Score" value={scores.interview} icon={Mic} />
            <PlacementMetric label="Aptitude Score" value={scores.aptitude} icon={Calculator} />
          </div>
        </div>
      </motion.div>
    </div>
    </AgentBackground>
  );
}

// ---------------------------------------------------------------------
// Small presentational helpers (UI only — no data fetching)
// ---------------------------------------------------------------------

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Award;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-center">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-bold text-ink">{value}</span>
      <span className="text-[10px] leading-tight text-graytext">{label}</span>
    </div>
  );
}

function PlacementMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Code2;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-graytext">{label}</span>
      </div>
      <p className="mb-2 text-xl font-bold text-ink">{value}%</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function codingLevelLabel(score: number): string {
  if (score >= 75) return "Advanced";
  if (score >= 40) return "Intermediate";
  return "Beginner";
}

function buildInsights(scores: { coding: number; resume: number; interview: number; aptitude: number }) {
  const insights: { label: string; detail: string; icon: typeof Sparkles }[] = [];

  if (scores.resume < 70) {
    insights.push({
      label: "Improve Resume Skills",
      detail: "Add measurable achievements and missing keywords to raise your ATS score.",
      icon: FileText,
    });
  }
  if (scores.coding < 70) {
    insights.push({
      label: "Practice DSA",
      detail: "Focus on trees, graphs, and dynamic programming this week.",
      icon: Code2,
    });
  }
  if (scores.aptitude < 70) {
    insights.push({
      label: "Complete Aptitude Sets",
      detail: "Timed quantitative and logical reasoning quizzes will boost your average.",
      icon: Calculator,
    });
  }
  if (scores.interview < 70) {
    insights.push({
      label: "Interview Readiness",
      detail: "Run one more mock interview to sharpen your behavioral answers.",
      icon: Mic,
    });
  }
  if (insights.length === 0) {
    insights.push({
      label: "You're placement-ready!",
      detail: "All four agents are performing well — keep up the consistency.",
      icon: Zap,
    });
  }
  if (insights.length < 3) {
    insights.push({
      label: "Complete SQL Questions",
      detail: "Strengthen database fundamentals commonly asked in technical rounds.",
      icon: AlertCircle,
    });
  }

  return insights.slice(0, 4);
}
