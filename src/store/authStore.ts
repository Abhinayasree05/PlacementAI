/**
 * store/authStore.ts
 * Central client-side auth state. `useAuthListener` (see hooks/) keeps this
 * in sync with Firebase's onAuthStateChanged + the user's Firestore profile.
 */
import { create } from "zustand";
import type { User } from "firebase/auth";
import type { UserProfile } from "../types/user";

interface AuthState {
  firebaseUser: User | null;
  profile: UserProfile | null;
  initializing: boolean;   // true until the first onAuthStateChanged fires
  setAuth: (user: User | null, profile: UserProfile | null) => void;
  setInitializing: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  initializing: true,
  setAuth: (firebaseUser, profile) => set({ firebaseUser, profile }),
  setInitializing: (initializing) => set({ initializing }),
  clear: () => set({ firebaseUser: null, profile: null }),
}));
