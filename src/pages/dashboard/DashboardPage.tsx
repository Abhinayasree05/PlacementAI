import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Code2, FileText, Mic, Calculator, Sparkles, ArrowUpRight,
  Clock, CheckCircle2, GraduationCap,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ProgressRing } from "../../components/shared/ProgressRing";
import { BarChart } from "../../components/shared/BarChart";

const QUICK_ACCESS = [
  { to: "/dashboard/coding", label: "Coding Agent", desc: "DSA practice with AI code review", icon: Code2 },
  { to: "/dashboard/resume", label: "Resume Agent", desc: "ATS score & resume feedback", icon: FileText },
  { to: "/dashboard/interview", label: "Interview Agent", desc: "AI mock interviews", icon: Mic },
  { to: "/dashboard/aptitude", label: "Aptitude Agent", desc: "Timed quizzes by topic", icon: Calculator },
  { to: "/dashboard/analytics", label: "AI Assistant", desc: "Your personalized roadmap", icon: Sparkles },
];

const RECENT_ACTIVITY = [
  { label: "Completed Aptitude Quiz — Logical Reasoning", time: "2 hours ago" },
  { label: "Submitted Coding Challenge — Binary Trees", time: "Yesterday" },
  { label: "Resume analyzed — ATS score 78%", time: "2 days ago" },
];

const UPCOMING_TASKS = [
  { label: "Mock Technical Interview", due: "Tomorrow, 10:00 AM" },
  { label: "Daily Aptitude Challenge", due: "Today" },
  { label: "Update resume with new project", due: "This week" },
];

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const displayName = profile?.fullName || firebaseUser?.displayName || "Student";
  const scores = {
    coding: profile?.codingScore ?? 0,
    resume: profile?.resumeAtsScore ?? 0,
    interview: profile?.interviewScore ?? 0,
    aptitude: profile?.aptitudeScore ?? 0,
  };
  const overall = Math.round((scores.coding + scores.resume + scores.interview + scores.aptitude) / 4);

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-white p-6 sm:flex-row sm:items-center sm:p-7"
      >
        <div>
          <h1 className="text-2xl font-bold text-ink">Welcome back, {displayName.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-graytext">Here's how your placement prep is going.</p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing percent={overall} />
          <div>
            <p className="text-sm font-semibold text-ink">Overall Progress</p>
            <p className="text-xs text-graytext">Across all 4 agents</p>
          </div>
        </div>
      </motion.div>

      {/* Quick access cards */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Quick Access</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {QUICK_ACCESS.map(({ to, label, desc, icon: Icon }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={to}
                className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-white p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(211,47,47,0.10)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                </div>
                <div className="mt-4">
                  <p className="font-semibold text-ink">{label}</p>
                  <p className="mt-0.5 text-xs text-graytext">{desc}</p>
                </div>
                <ArrowUpRight className="mt-3 h-4 w-4 text-graytext transition-colors group-hover:text-primary" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Progress charts */}
        <div className="rounded-2xl border border-border bg-white p-6 lg:col-span-2">
          <h3 className="mb-4 text-base font-bold text-ink">Score Breakdown</h3>
          <BarChart
            data={[
              { label: "Coding", value: scores.coding },
              { label: "Aptitude", value: scores.aptitude },
              { label: "Interview", value: scores.interview },
              { label: "Resume ATS", value: scores.resume },
            ]}
          />
        </div>

        {/* Profile summary */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="mb-4 text-base font-bold text-ink">Profile Summary</h3>
          <div className="flex items-center gap-3">
            {profile?.photoURL || firebaseUser?.photoURL ? (
              <img
                src={profile?.photoURL || firebaseUser?.photoURL || ""}
                alt={displayName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              
              <p className="text-lg font-bold text-ink">{displayName}</p>
              <p className="text-xs text-graytext">
              {profile?.email || firebaseUser?.email}
              </p>
              <p className="text-xs text-graytext">{profile?.email || firebaseUser?.email}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2 text-graydark">
              <GraduationCap className="h-4 w-4 text-graytext" />
              {profile?.college || "College not set"}
            </div>
            <div className="flex items-center gap-2 text-graydark">
              {profile?.department || "—"} · Year {profile?.year || "—"} · {profile?.rollNumber || "—"}
            </div>
          </div>
          <Link
            to="/dashboard/profile"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
          >
            Edit Profile →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="mb-4 text-base font-bold text-ink">Recent Activity</h3>
          <ul className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm text-graydark">{item.label}</p>
                  <p className="text-xs text-graytext">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming tasks */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="mb-4 text-base font-bold text-ink">Upcoming Tasks</h3>
          <ul className="space-y-3">
            {UPCOMING_TASKS.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-graydark">{item.label}</p>
                  <p className="text-xs text-graytext">{item.due}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
