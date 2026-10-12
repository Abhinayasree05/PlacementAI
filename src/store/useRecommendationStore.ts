import { create } from "zustand";

// =====================================================================
// store/useRecommendationStore.ts
// Single source of truth for the Recommendation Agent's generated
// output. Populated by AnalyticsPage.tsx after reading real scores from
// Firestore/useAgentStatusStore and calling Gemini — never hardcoded.
// =====================================================================

export interface RoadmapWeek {
  week: number;
  title: string;
  items: string[];
}

export interface CompanyRecommendation {
  name: string;
  reason: string;
}

export interface CourseRecommendation {
  platform: string;
  topic: string;
}

export interface PlacementPrediction {
  readiness: number;
  chance: "Low" | "Medium" | "High";
  expectedCompanies: string[];
  suggestionsToReach95: string[];
}

export interface RecommendationData {
  aiRecommendations: string[];
  roadmap: RoadmapWeek[];
  weakAreas: string[];
  strongAreas: string[];
  companies: CompanyRecommendation[];
  skills: string[];
  courses: CourseRecommendation[];
  dailyGoals: string[];
  weeklyFeedback: string;
  placementPrediction: PlacementPrediction;
  previousReadiness: number | null; // readiness at last generation, for a real improvement delta
  generatedAt: string; // ISO string
  inputSnapshot: string; // hash of the scores used to generate this, for change detection
}

interface RecommendationState {
  data: RecommendationData | null;
  isGenerating: boolean;
  error: string | null;

  setData: (data: RecommendationData) => void;
  setGenerating: (v: boolean) => void;
  setError: (err: string | null) => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  data: null,
  isGenerating: false,
  error: null,

  setData: (data) => set({ data, error: null }),
  setGenerating: (v) => set({ isGenerating: v }),
  setError: (err) => set({ error: err }),
}));
