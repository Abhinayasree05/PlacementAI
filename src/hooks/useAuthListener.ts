import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { fetchUserProfile } from "../lib/authActions";

/**
 * Mounted once near the app root. Keeps `useAuthStore` in sync with
 * Firebase Auth + the user's Firestore profile document. Every screen
 * (Topbar, Sidebar, DashboardPage, ProfilePage, SettingsPage) reads
 * profile data from useAuthStore — this hook is the only place that
 * populates it, so there is exactly one source of truth.
 */
export function useAuthListener() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        useAuthStore.getState().clear();
        useAuthStore.getState().setInitializing(false);
        return;
      }

      const profile = await fetchUserProfile(firebaseUser.uid);
      useAuthStore.getState().setAuth(firebaseUser, profile);
      useAuthStore.getState().setInitializing(false);
    });

    return () => unsubscribe();
  }, []);
}
