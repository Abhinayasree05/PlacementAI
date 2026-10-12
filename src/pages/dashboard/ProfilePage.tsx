import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mail, Phone, GraduationCap, Building2, Hash, CalendarDays, Pencil,
  FileText, Code2, Mic, Calculator, Sparkles, Plus, Sparkle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAgentStatusStore } from "../../store/useAgentStatusStore";
import { PremiumBackground } from "../../components/shared/PremiumBackground";

// =====================================================================
// ProfilePage.tsx — minimal, enterprise-grade redesign.
// Same data sources as before (useAuthStore.profile, useAgentStatusStore)
// and the same single "Edit Profile → Settings" pattern. No logic, no
// Firebase/Firestore/Zustand/routing changes — presentation only.
// =====================================================================

export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const resumeStatus = useAgentStatusStore((s) => s.resume);
  const codingStatus = useAgentStatusStore((s) => s.coding);
  const interviewStatus = useAgentStatusStore((s) => s.interview);
  const aptitudeStatus = useAgentStatusStore((s) => s.aptitude);
  const recommendationStatus = useAgentStatusStore((s) => s.recommendation);

  const displayName = profile?.fullName || firebaseUser?.displayName || "Student";
  const photoURL = profile?.photoURL || firebaseUser?.photoURL;

  const overallReadiness = Math.round(
    (resumeStatus.score + codingStatus.score + interviewStatus.score + aptitudeStatus.score) / 4
  );

  const profileFields = [
    profile?.fullName, profile?.email, profile?.phoneNumber, profile?.college,
    profile?.department, profile?.year, profile?.rollNumber,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 70 +
      (Math.min(profile?.skills?.length ?? 0, 5) / 5) * 30
  );

  const completionMessage =
    profileCompletion >= 90
      ? "Your profile is in great shape for placement recommendations."
      : "Complete your skills and academic details to improve placement readiness.";

  return (
    <PremiumBackground>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6"
      >
        {/* Page heading */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Profile</h1>
            <p className="mt-1.5 text-sm text-[#A1A1AA]">Your student details, synced live from Settings.</p>
          </div>
          <Link
            to="/dashboard/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#ff1a25] hover:shadow-[0_0_18px_rgba(229,9,20,0.35)]"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Link>
        </div>

        {/* Header card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="h-20 w-20 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E50914] text-2xl font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold text-white">{displayName}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#A1A1AA]">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {profile?.email || firebaseUser?.email}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-[#A1A1AA]">
                <Phone className="h-3.5 w-3.5 shrink-0" /> {profile?.phoneNumber || firebaseUser?.phoneNumber || "No phone on file"}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Profile Completion</h2>
            <span className="text-sm font-semibold text-[#E50914]">{profileCompletion}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#171717]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profileCompletion}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-[#E50914]"
            />
          </div>
          <p className="mt-4 text-sm text-[#A1A1AA]">{completionMessage}</p>
        </div>

        {/* Academic information */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-white">Academic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard icon={Building2} label="College" value={profile?.college || "Not set"} />
            <InfoCard icon={GraduationCap} label="Department" value={profile?.department || "Not set"} />
            <InfoCard icon={CalendarDays} label="Graduation Year" value={profile?.year || "Not set"} />
            <InfoCard icon={Hash} label="Roll Number" value={profile?.rollNumber || "Not set"} />
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
          <h2 className="mb-4 text-sm font-medium text-white">Skills</h2>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[#E50914]/30 bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-white"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#A1A1AA]">No skills added.</p>
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E50914] px-3.5 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-[#ff1a25] hover:shadow-[0_0_16px_rgba(229,9,20,0.35)]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Skills
              </Link>
            </div>
          )}
        </div>

        {/* Placement Readiness */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Placement Readiness</h2>
            <span className="text-sm font-semibold text-[#E50914]">{overallReadiness}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard icon={FileText} label="Resume ATS" score={resumeStatus.score} />
            <MetricCard icon={Code2} label="Coding" score={codingStatus.score} />
            <MetricCard icon={Mic} label="Interview" score={interviewStatus.score} />
            <MetricCard icon={Calculator} label="Aptitude" score={aptitudeStatus.score} />
            <MetricCard icon={Sparkle} label="Recommendation" score={recommendationStatus.score} />
          </div>
          <Link
            to="/dashboard/analytics"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#E50914] transition-colors hover:text-[#ff1a25]"
          >
            <Sparkles className="h-3.5 w-3.5" /> View full Recommendation Agent report
          </Link>
        </div>
      </motion.div>
    </PremiumBackground>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
    >
      <div className="flex items-center gap-2 text-[#A1A1AA]">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="truncate text-sm font-semibold text-white">{value}</p>
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, score }: { icon: typeof FileText; label: string; score: number }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
    >
      <div className="mb-2 flex items-center gap-1.5 text-[#A1A1AA]">
        <Icon className="h-3.5 w-3.5 text-[#E50914]" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mb-2 text-lg font-semibold text-white">{score}%</p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#171717]">
        <div className="h-full rounded-full bg-[#E50914]" style={{ width: `${score}%` }} />
      </div>
    </motion.div>
  );
}
