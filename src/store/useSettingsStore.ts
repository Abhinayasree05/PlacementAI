import { create } from "zustand";

// ---------- Types ----------
// NOTE: profile identity fields (name, email, phone, photo, skills, etc.)
// live in useAuthStore (src/store/authStore.ts) — the single source of
// truth also read by Topbar, Sidebar, DashboardPage, and ProfilePage.
// This store only holds placement/AI/notification *preferences*.

export interface PlacementPreferences {
  targetRole: string;
  preferredLanguage: string;
  codingLevel: "Beginner" | "Intermediate" | "Advanced";
  placementGoal: string;
}

export interface AILearningPreferences {
  codingDifficulty: "Easy" | "Medium" | "Hard";
  aptitudeDifficulty: "Easy" | "Medium" | "Hard";
  practiceFrequency: "Daily" | "3x a week" | "Weekly";
  personalizedRecommendations: boolean;
}

export interface NotificationSettings {
  codingReminders: boolean;
  aptitudeReminders: boolean;
  mockInterviewReminders: boolean;
  weeklyProgressReports: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
}

export interface SettingsState {
  placement: PlacementPreferences;
  aiLearning: AILearningPreferences;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  isDirty: boolean;
  isSaving: boolean;

  setPlacement: (partial: Partial<PlacementPreferences>) => void;
  setAILearning: (partial: Partial<AILearningPreferences>) => void;
  setNotifications: (partial: Partial<NotificationSettings>) => void;
  setAppearance: (partial: Partial<AppearanceSettings>) => void;
  hydrate: (data: Partial<SettingsState>) => void;
  setSaving: (val: boolean) => void;
  markClean: () => void;
}

const defaultState = {
  placement: {
    targetRole: "Software Developer",
    preferredLanguage: "Python",
    codingLevel: "Beginner" as const,
    placementGoal: "",
  },
  aiLearning: {
    codingDifficulty: "Easy" as const,
    aptitudeDifficulty: "Easy" as const,
    practiceFrequency: "Daily" as const,
    personalizedRecommendations: true,
  },
  notifications: {
    codingReminders: true,
    aptitudeReminders: true,
    mockInterviewReminders: true,
    weeklyProgressReports: true,
  },
  appearance: {
    theme: "system" as const,
  },
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultState,
  isDirty: false,
  isSaving: false,

  setPlacement: (partial) =>
    set((state) => ({ placement: { ...state.placement, ...partial }, isDirty: true })),

  setAILearning: (partial) =>
    set((state) => ({ aiLearning: { ...state.aiLearning, ...partial }, isDirty: true })),

  setNotifications: (partial) =>
    set((state) => ({
      notifications: { ...state.notifications, ...partial },
      isDirty: true,
    })),

  setAppearance: (partial) =>
    set((state) => ({ appearance: { ...state.appearance, ...partial }, isDirty: true })),

  hydrate: (data) => set((state) => ({ ...state, ...data, isDirty: false })),

  setSaving: (val) => set({ isSaving: val }),

  markClean: () => set({ isDirty: false }),
}));