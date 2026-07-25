import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";


import type {
  PlacementPreferences,
  AILearningPreferences,
  NotificationSettings,
  AppearanceSettings,
} from "../store/useSettingsStore";

export interface UserSettingsDoc {
  placement: PlacementPreferences;
  aiLearning: AILearningPreferences;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  updatedAt?: unknown;
}

// Firestore path: users/{uid}/settings/preferences
export async function loadUserSettings(
  uid: string
): Promise<UserSettingsDoc | null> {
  const ref = doc(db, "users", uid, "settings", "preferences");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserSettingsDoc) : null;
}

export async function saveUserSettings(
  uid: string,
  data: Omit<UserSettingsDoc, "updatedAt">
): Promise<void> {
  const ref = doc(db, "users", uid, "settings", "preferences");
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}