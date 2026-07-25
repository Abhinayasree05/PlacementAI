import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Target,
  Sparkles,
  Bell,
  ShieldCheck,
  Camera,
  Plus,
  X,
  LogOut,
  Trash2,
  Loader2,
  Check,
  Bot,
  Code2,
  FileText,
  MessageSquareText,
  BarChart3,
  Sparkle,
} from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { loadUserSettings, saveUserSettings } from "../../lib/settingsService";
import { resizeImageToDataUrl } from "../../lib/imageUtils";
import { useProfileDraftStore } from "../../store/useProfileDraftStore";
import CustomSelect from "../../components/ui/CustomSelect";

// =====================================================================
// SettingsPage — Red/Black premium AI dashboard theme
// Place this file at: src/pages/dashboard/SettingsPage.tsx
// =====================================================================

type TabKey = "profile" | "placement" | "ai" | "notifications" | "security";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile Settings", icon: User },
  { key: "placement", label: "Placement Preferences", icon: Target },
  { key: "ai", label: "AI Learning Preferences", icon: Sparkles },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: ShieldCheck },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const store = useSettingsStore();
  const authProfile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { draft, hydrateFromProfile } = useProfileDraftStore();
  const draftDirty = useProfileDraftStore((s) => s.dirty);

  useEffect(() => {
    hydrateFromProfile(authProfile);
  }, [authProfile, hydrateFromProfile]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }
    loadUserSettings(uid)
      .then((data) => {
        if (data) store.hydrate(data);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToTab(key: TabKey) {
    const currentIndex = TABS.findIndex((t) => t.key === activeTab);
    const nextIndex = TABS.findIndex((t) => t.key === key);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(key);
  }

  async function handleSaveAll() {
    const uid = auth.currentUser?.uid;
    if (!uid || !firebaseUser) return;

    store.setSaving(true);
    try {
      // 1. Write profile fields to the user's Firestore document (same
      //    doc + pattern ProfilePage.tsx already uses).
      await updateDoc(doc(db, "users", uid), {
        fullName: draft.fullName,
        email: draft.email,
        phoneNumber: draft.phoneNumber,
        college: draft.college,
        department: draft.department,
        year: draft.year,
        skills: draft.skills,
        photoURL: draft.photoURL,
      });

      // 2. Push the change into useAuthStore immediately — this is what
      //    makes Topbar/Sidebar/Dashboard update without a page reload.
      setAuth(firebaseUser, {
        ...(authProfile as NonNullable<typeof authProfile>),
        fullName: draft.fullName,
        email: draft.email,
        phoneNumber: draft.phoneNumber,
        college: draft.college,
        department: draft.department,
        year: draft.year,
        skills: draft.skills,
        photoURL: draft.photoURL,
      });

      // 3. Save the separate placement/AI/notification preferences doc.
      await saveUserSettings(uid, {
        placement: store.placement,
        aiLearning: store.aiLearning,
        notifications: store.notifications,
        appearance: store.appearance,
      });

      store.markClean();
      useProfileDraftStore.getState().markClean();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      store.setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#E50914]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white relative overflow-hidden">
      {/* Ambient red glow background */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#E50914]/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#E50914]/10 rounded-full blur-[140px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E50914]/10 border border-[#E50914]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#E50914]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" />
                AI Systems Online
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1">
              Manage your profile, preferences, and account.
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={(!store.isDirty && !draftDirty) || store.isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] text-white px-5 py-2.5 text-sm font-semibold shadow-[0_0_20px_rgba(229,9,20,0.35)] hover:bg-[#ff1a25] hover:shadow-[0_0_28px_rgba(229,9,20,0.55)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
          >
            {store.isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveState === "saved" ? (
              <Check className="w-4 h-4" />
            ) : null}
            {store.isSaving ? "Saving..." : saveState === "saved" ? "Saved" : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <nav className="glass-card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible h-fit">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => goToTab(key)}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap text-left w-full"
                >
                  {active && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#E50914]/25 to-[#E50914]/5 border border-[#E50914]/50 shadow-[0_0_16px_rgba(229,9,20,0.35)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 relative z-10 ${
                      active ? "text-[#E50914]" : "text-white/50"
                    }`}
                  />
                  <span className={`relative z-10 ${active ? "text-white" : "text-white/60"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-w-0 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                initial={(dir: number) => ({ opacity: 0, x: dir * 40, scale: 0.98 })}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={(dir: number) => ({ opacity: 0, x: dir * -40, scale: 0.98 })}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {activeTab === "profile" && (
                  <>
                    <ProfileCompletionCard />
                    <ProfileSection />
                  </>
                )}
                {activeTab === "placement" && <PlacementSection />}
                {activeTab === "ai" && (
                  <>
                    <AILearningSection />
                    <AIAgentStatusCard />
                  </>
                )}
                {activeTab === "notifications" && <NotificationsSection />}
                {activeTab === "security" && <SecuritySection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <FloatingAssistantButton />

      {/* Local styles for the glass-card utility used throughout this page */}
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border-radius: 14px;
        }
        .glass-card:hover {
          border-color: rgba(229, 9, 20, 0.35);
        }
      `}</style>
    </div>
  );
}

// =====================================================================
// Shared UI primitives
// =====================================================================

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="glass-card p-6 mb-6 transition-colors duration-300">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && <p className="text-sm text-white/50 mt-1 mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-white/40 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#E50914]/60 focus:border-[#E50914]/60 transition";

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white/90">{label}</p>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors
          ${checked ? "bg-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.6)]" : "bg-white/10"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

// =====================================================================
// Profile Completion (AI analysis card)
// =====================================================================

function ProfileCompletionCard() {
  const { draft } = useProfileDraftStore();

  const fields = [
    draft.fullName,
    draft.email,
    draft.phoneNumber,
    draft.college,
    draft.department,
    draft.year,
  ];
  const filledCount = fields.filter((f) => f && f.trim().length > 0).length;
  const skillsScore = Math.min(draft.skills.length, 5) / 5; // up to 5 skills counts fully
  const completion = Math.round(
    ((filledCount / fields.length) * 0.7 + skillsScore * 0.3) * 100
  );

  const message =
    completion >= 90
      ? "Your profile is in great shape for placement recommendations."
      : completion >= 60
      ? `Your profile is ${completion}% complete. Add more skills to improve placement recommendations.`
      : `Your profile is ${completion}% complete. Fill in your academic details and skills to unlock better AI recommendations.`;

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkle className="w-4 h-4 text-[#E50914]" />
        <h2 className="text-base font-semibold text-white">Profile Completion</h2>
      </div>
      <p className="text-sm text-white/50 mb-4">{message}</p>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-2.5 rounded-full bg-black/60 border border-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#ff5a5a]"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="text-sm font-bold text-[#E50914] w-12 text-right">{completion}%</span>
      </div>
    </div>
  );
}

// =====================================================================
// 1. Profile Settings
// =====================================================================

function ProfileSection() {
  const { draft, setDraft } = useProfileDraftStore();
  const [skillInput, setSkillInput] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;
    setPhotoBusy(true);
    try {
      // Resized client-side and stored directly on the Firestore user doc
      // as a data URL — no Firebase Storage bucket required. Swap this for
      // an uploadBytes()/getDownloadURL() call if you set up Storage later.
      const dataUrl = await resizeImageToDataUrl(fileObj, 256);
      setDraft({ photoURL: dataUrl });
    } catch (err) {
      console.error("Photo processing failed:", err);
    } finally {
      setPhotoBusy(false);
    }
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s || draft.skills.includes(s)) return;
    setDraft({ skills: [...draft.skills, s] });
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setDraft({ skills: draft.skills.filter((s) => s !== skill) });
  }

  return (
    <Card title="Profile Settings" description="This information is shown across your PlacementAI dashboard.">
      <div className="flex items-center gap-5 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white/5 overflow-hidden flex items-center justify-center border border-white/10">
            {photoBusy ? (
              <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
            ) : draft.photoURL ? (
              <img src={draft.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white/30" />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#E50914] flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(229,9,20,0.6)]">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-white/90">Profile photo</p>
          <p className="text-xs text-white/40">JPG or PNG, up to 2MB.</p>
          <label className="inline-block mt-1 text-xs font-semibold text-[#E50914] cursor-pointer">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name">
          <input
            className={inputClass}
            value={draft.fullName}
            onChange={(e) => setDraft({ fullName: e.target.value })}
            placeholder="Your name"
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            value={draft.email}
            onChange={(e) => setDraft({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone Number">
          <input
            className={inputClass}
            value={draft.phoneNumber}
            onChange={(e) => setDraft({ phoneNumber: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="College Name">
          <input
            className={inputClass}
            value={draft.college}
            onChange={(e) => setDraft({ college: e.target.value })}
            placeholder="Your college"
          />
        </Field>
        <Field label="Branch">
          <input
            className={inputClass}
            value={draft.department}
            onChange={(e) => setDraft({ department: e.target.value })}
            placeholder="e.g. CSE, ECE, AI/ML"
          />
        </Field>
        <Field label="Graduation Year">
          <input
            className={inputClass}
            value={draft.year}
            onChange={(e) => setDraft({ year: e.target.value })}
            placeholder="2026"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Skills">
          <div className="flex gap-2 mb-3">
            <input
              className={inputClass}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="e.g. React, Python, Machine Learning"
            />
            <button
              onClick={addSkill}
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 text-sm font-medium text-white/70 hover:border-[#E50914]/50 hover:text-white transition"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#E50914]/60 text-white/80 text-xs font-medium px-3 py-1 transition"
              >
                {skill}
                <button onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                  <X className="w-3 h-3 text-[#E50914]" />
                </button>
              </span>
            ))}
          </div>
        </Field>
      </div>
    </Card>
  );
}

// =====================================================================
// 2. Placement Preferences
// =====================================================================

const JOB_ROLES = ["AI Engineer", "Full Stack Developer", "Data Scientist", "Software Developer"];
const LANGUAGES = ["Python", "Java", "C++", "JavaScript", "TypeScript"];
const CODING_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

function PlacementSection() {
  const { placement, setPlacement } = useSettingsStore();

  return (
    <Card title="Placement Preferences" description="Helps agents tailor practice sets to your goals.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Target Job Role">
          <CustomSelect value={placement.targetRole} onChange={(v) => setPlacement({ targetRole: v })} options={JOB_ROLES} />
        </Field>
        <Field label="Preferred Programming Language">
          <CustomSelect
            value={placement.preferredLanguage}
            onChange={(v) => setPlacement({ preferredLanguage: v })}
            options={LANGUAGES}
          />
        </Field>
        <Field label="Current Coding Level">
          <CustomSelect
            value={placement.codingLevel}
            onChange={(v) => setPlacement({ codingLevel: v as typeof CODING_LEVELS[number] })}
            options={[...CODING_LEVELS]}
          />
        </Field>
        <Field label="Placement Goal">
          <input
            className={inputClass}
            value={placement.placementGoal}
            onChange={(e) => setPlacement({ placementGoal: e.target.value })}
            placeholder="e.g. Crack a product-based company by Dec 2026"
          />
        </Field>
      </div>
    </Card>
  );
}

// =====================================================================
// 3. AI Learning Preferences
// =====================================================================

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const FREQUENCIES = ["Daily", "3x a week", "Weekly"] as const;

function AILearningSection() {
  const { aiLearning, setAILearning } = useSettingsStore();

  return (
    <Card title="AI Learning Preferences" description="Controls how the Coding, Aptitude, and Recommendation agents behave.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        <Field label="Coding Agent Difficulty">
          <CustomSelect
            value={aiLearning.codingDifficulty}
            onChange={(v) => setAILearning({ codingDifficulty: v as typeof DIFFICULTIES[number] })}
            options={[...DIFFICULTIES]}
          />
        </Field>
        <Field label="Aptitude Agent Difficulty">
          <CustomSelect
            value={aiLearning.aptitudeDifficulty}
            onChange={(v) => setAILearning({ aptitudeDifficulty: v as typeof DIFFICULTIES[number] })}
            options={[...DIFFICULTIES]}
          />
        </Field>
        <Field label="Interview Preparation Mode / Practice Frequency">
          <CustomSelect
            value={aiLearning.practiceFrequency}
            onChange={(v) => setAILearning({ practiceFrequency: v as typeof FREQUENCIES[number] })}
            options={[...FREQUENCIES]}
          />
        </Field>
      </div>
      <div className="border-t border-white/5 mt-3">
        <ToggleSwitch
          label="Personalized Recommendations"
          description="Let the Recommendation Agent suggest topics based on your performance."
          checked={aiLearning.personalizedRecommendations}
          onChange={(v) => setAILearning({ personalizedRecommendations: v })}
        />
      </div>
    </Card>
  );
}

// =====================================================================
// AI Agent Status Card
// =====================================================================

function AIAgentStatusCard() {
  const { aiLearning } = useSettingsStore();

  const agents = [
    {
      name: "Coding Agent",
      icon: Code2,
      status: "Active",
      detail: `Difficulty: ${aiLearning.codingDifficulty}`,
      lastUsed: "2 hours ago",
      progress: 72,
    },
    {
      name: "Resume Agent",
      icon: FileText,
      status: "Active",
      detail: "ATS analysis ready",
      lastUsed: "Yesterday",
      progress: 58,
    },
    {
      name: "Interview Agent",
      icon: MessageSquareText,
      status: "Active",
      detail: "Mock interview mode",
      lastUsed: "3 days ago",
      progress: 40,
    },
    {
      name: "Recommendation Agent",
      icon: BarChart3,
      status: aiLearning.personalizedRecommendations ? "Active" : "Paused",
      detail: "Personalization ".concat(aiLearning.personalizedRecommendations ? "on" : "off"),
      lastUsed: "Today",
      progress: 85,
    },
  ];

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <Bot className="w-4 h-4 text-[#E50914]" />
        <h2 className="text-base font-semibold text-white">AI Agent Status</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-[#E50914]/50 hover:shadow-[0_0_18px_rgba(229,9,20,0.15)] transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center">
                <agent.icon className="w-4 h-4 text-[#E50914]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{agent.name}</p>
                <p className="text-[11px] text-white/40">{agent.detail}</p>
              </div>
              <span
                className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  agent.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-white/40 border border-white/10"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-white/30"
                  }`}
                />
                {agent.status}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/60 overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#ff5a5a]"
                style={{ width: `${agent.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-white/30">Last used: {agent.lastUsed}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// 4. Notification Settings
// =====================================================================

function NotificationsSection() {
  const { notifications, setNotifications } = useSettingsStore();

  return (
    <Card title="Notification Settings" description="Choose which reminders you'd like to receive.">
      <div className="divide-y divide-white/5">
        <ToggleSwitch
          label="Coding Practice Reminders"
          checked={notifications.codingReminders}
          onChange={(v) => setNotifications({ codingReminders: v })}
        />
        <ToggleSwitch
          label="Aptitude Test Reminders"
          checked={notifications.aptitudeReminders}
          onChange={(v) => setNotifications({ aptitudeReminders: v })}
        />
        <ToggleSwitch
          label="Mock Interview Reminders"
          checked={notifications.mockInterviewReminders}
          onChange={(v) => setNotifications({ mockInterviewReminders: v })}
        />
        <ToggleSwitch
          label="Weekly Progress Reports"
          checked={notifications.weeklyProgressReports}
          onChange={(v) => setNotifications({ weeklyProgressReports: v })}
        />
      </div>
    </Card>
  );
}

// =====================================================================
// 5. Account & Security
// =====================================================================

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function reauthenticate() {
    const user = auth.currentUser;
    if (!user?.email) throw new Error("No signed-in user.");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  async function handleChangePassword() {
    setStatus(null);
    setBusy(true);
    try {
      await reauthenticate();
      await updatePassword(auth.currentUser!, newPassword);
      setStatus("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      setStatus("Could not update password. Check your current password and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateEmail() {
    setStatus(null);
    setBusy(true);
    try {
      await reauthenticate();
      await updateEmail(auth.currentUser!, newEmail);
      setStatus("Email updated successfully.");
      setNewEmail("");
    } catch (err) {
      console.error(err);
      setStatus("Could not update email. Check your current password and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  async function handleDeleteAccount() {
    setBusy(true);
    try {
      await reauthenticate();
      await deleteUser(auth.currentUser!);
    } catch (err) {
      console.error(err);
      setStatus("Could not delete account. Re-enter your current password above and try again.");
    } finally {
      setBusy(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <Card title="Change Password" description="Re-enter your current password to confirm sensitive changes.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Current Password">
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New Password">
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
        </div>
        <button
          onClick={handleChangePassword}
          disabled={busy || !currentPassword || !newPassword}
          className="mt-4 rounded-lg border border-white/30 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10 hover:border-white transition disabled:opacity-40"
        >
          Update Password
        </button>
      </Card>

      <Card title="Update Email" description="Changing email requires your current password above.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New Email">
            <input
              className={inputClass}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
            />
          </Field>
        </div>
        <button
          onClick={handleUpdateEmail}
          disabled={busy || !currentPassword || !newEmail}
          className="mt-4 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 hover:border-white transition disabled:opacity-40"
        >
          Update Email
        </button>
      </Card>

      {status && <p className="text-sm text-white/50 -mt-2 mb-6">{status}</p>}

      <Card title="Session">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E50914]/60 text-[#E50914] px-4 py-2 text-sm font-semibold hover:bg-[#E50914]/10 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </Card>

      <Card title="Danger Zone" description="This action is permanent and cannot be undone.">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] text-white px-4 py-2 text-sm font-semibold shadow-[0_0_16px_rgba(229,9,20,0.4)] hover:bg-[#ff1a25] transition"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        ) : (
          <div className="rounded-lg border border-[#E50914]/40 bg-[#E50914]/5 p-4">
            <p className="text-sm text-white/70 mb-3">
              Enter your current password above, then confirm deletion. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={busy || !currentPassword}
                className="rounded-lg bg-[#E50914] text-white px-4 py-2 text-sm font-semibold hover:bg-[#ff1a25] disabled:opacity-40 transition"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

// =====================================================================
// Floating AI Assistant Button
// =====================================================================

function FloatingAssistantButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#E50914] flex items-center justify-center shadow-[0_0_24px_rgba(229,9,20,0.55)] z-50"
      aria-label="AI Assistant"
    >
      <Bot className="w-6 h-6 text-white" />
      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B0B0B] animate-pulse" />
    </motion.button>
  );
}