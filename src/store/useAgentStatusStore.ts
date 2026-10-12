import { create } from "zustand";

/**
 * store/useAgentStatusStore.ts
 *
 * Single source of truth for the status badge shown on every Quick Access
 * card on the Dashboard. Nothing else computes or duplicates this status —
 * it is written ONLY by useAgentStatusListener (real-time Firestore
 * listeners) and read ONLY by DashboardPage.
 */

export type AgentStatus = "not-started" | "in-progress" | "completed";

interface AgentStatusEntry {
  status: AgentStatus;
  score: number; // 0-100, used for the mini progress bar on the card
  detail: string; // short human-readable reason, shown under the card title
}

interface AgentStatusState {
  resume: AgentStatusEntry;
  coding: AgentStatusEntry;
  interview: AgentStatusEntry;
  aptitude: AgentStatusEntry;
  recommendation: AgentStatusEntry;
  isLoaded: boolean;

  setResume: (entry: AgentStatusEntry) => void;
  setCoding: (entry: AgentStatusEntry) => void;
  setInterview: (entry: AgentStatusEntry) => void;
  setAptitude: (entry: AgentStatusEntry) => void;
  setRecommendation: (entry: AgentStatusEntry) => void;
  setLoaded: (v: boolean) => void;
  reset: () => void;
}

const NOT_STARTED: AgentStatusEntry = { status: "not-started", score: 0, detail: "" };

export const useAgentStatusStore = create<AgentStatusState>((set) => ({
  resume: NOT_STARTED,
  coding: NOT_STARTED,
  interview: NOT_STARTED,
  aptitude: NOT_STARTED,
  recommendation: NOT_STARTED,
  isLoaded: false,

  setResume: (entry) => set({ resume: entry }),
  setCoding: (entry) => set({ coding: entry }),
  setInterview: (entry) => set({ interview: entry }),
  setAptitude: (entry) => set({ aptitude: entry }),
  setRecommendation: (entry) => set({ recommendation: entry }),
  setLoaded: (v) => set({ isLoaded: v }),
  reset: () =>
    set({
      resume: NOT_STARTED,
      coding: NOT_STARTED,
      interview: NOT_STARTED,
      aptitude: NOT_STARTED,
      recommendation: NOT_STARTED,
      isLoaded: false,
    }),
}));
