import { create } from "zustand";
import type { UserProfile } from "../types/user";

/**
 * store/useProfileDraftStore.ts
 *
 * This is NOT a second source of truth for the user's profile — it's a
 * local edit buffer for the Settings form only. useAuthStore.profile
 * remains the single real source of truth (read by Topbar, Sidebar,
 * DashboardPage, ProfilePage). This draft is hydrated FROM useAuthStore
 * when Settings opens, and on Save is written to Firestore and pushed
 * BACK into useAuthStore via setAuth — that's what makes the rest of the
 * app update instantly.
 */

interface ProfileDraft {
  fullName: string;
  email: string;
  phoneNumber: string;
  college: string;
  department: string;
  year: string;
  skills: string[];
  photoURL: string;
}

interface ProfileDraftState {
  draft: ProfileDraft;
  hydrated: boolean;
  dirty: boolean;
  setDraft: (partial: Partial<ProfileDraft>) => void;
  hydrateFromProfile: (profile: UserProfile | null) => void;
  markClean: () => void;
}

const emptyDraft: ProfileDraft = {
  fullName: "",
  email: "",
  phoneNumber: "",
  college: "",
  department: "",
  year: "",
  skills: [],
  photoURL: "",
};

export const useProfileDraftStore = create<ProfileDraftState>((set, get) => ({
  draft: emptyDraft,
  hydrated: false,
  dirty: false,

  setDraft: (partial) =>
    set((state) => ({ draft: { ...state.draft, ...partial }, dirty: true })),

  markClean: () => set({ dirty: false }),

  // Only hydrates once per Settings session so it never overwrites
  // in-progress edits if useAuthStore.profile re-renders for other reasons.
  hydrateFromProfile: (profile) => {
    if (get().hydrated || !profile) return;
    set({
      hydrated: true,
      draft: {
        fullName: profile.fullName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        college: profile.college || "",
        department: profile.department || "",
        year: profile.year || "",
        skills: profile.skills || [],
        photoURL: profile.photoURL || "",
      },
    });
  },
}));
