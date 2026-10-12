import { create } from "zustand";
import type { Timestamp } from "firebase/firestore";

// =====================================================================
// store/useNotificationStore.ts
// Single source of truth for in-app notifications. Populated live by
// useNotificationListener.ts (Firestore onSnapshot) — never hardcoded.
// =====================================================================

export type NotificationType =
  | "resume"
  | "coding"
  | "aptitude"
  | "interview"
  | "recommendation"
  | "profile"
  | "weeklyReport";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp | null;
}

interface NotificationState {
  notifications: AppNotification[];
  isPanelOpen: boolean;
  isLoaded: boolean;

  setNotifications: (list: AppNotification[]) => void;
  togglePanel: () => void;
  closePanel: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isPanelOpen: false,
  isLoaded: false,

  setNotifications: (list) => set({ notifications: list, isLoaded: true }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  closePanel: () => set({ isPanelOpen: false }),
  reset: () => set({ notifications: [], isPanelOpen: false, isLoaded: false }),
}));
