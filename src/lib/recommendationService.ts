import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import type { RecommendationData } from "../store/useRecommendationStore";

// =====================================================================
// lib/recommendationService.ts
// Reads the REAL data behind the Recommendation Agent (no fabrication):
//  - Every aptitudeHistory attempt, grouped by topic, to find genuine
//    weak/strong topics (average score per topic).
//  - The latest resumeHistory analysis, reusing its real strengths/
//    weaknesses/atsScore instead of re-deriving them.
//  - The cached recommendation doc at users/{uid}/recommendation/latest,
//    so we don't call Gemini on every page visit — only when the real
//    underlying scores have changed.
// =====================================================================

export interface AptitudeTopicBreakdown {
  topic: string;
  averageScore: number;
  attempts: number;
}

export async function getAptitudeTopicBreakdown(uid: string): Promise<AptitudeTopicBreakdown[]> {
  const historyRef = collection(db, "users", uid, "aptitudeHistory");
  const snap = await getDocs(query(historyRef, orderBy("createdAt", "desc")));

  const byTopic = new Map<string, { total: number; count: number }>();
  snap.docs.forEach((d) => {
    const data = d.data();
    const topic = data.topic as string;
    const score = data.score as number;
    const entry = byTopic.get(topic) ?? { total: 0, count: 0 };
    entry.total += score;
    entry.count += 1;
    byTopic.set(topic, entry);
  });

  return Array.from(byTopic.entries()).map(([topic, { total, count }]) => ({
    topic,
    averageScore: Math.round(total / count),
    attempts: count,
  }));
}

export interface LatestResumeAnalysis {
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
}

export async function getLatestResumeAnalysis(uid: string): Promise<LatestResumeAnalysis | null> {
  const historyRef = collection(db, "users", uid, "resumeHistory");
  const snap = await getDocs(query(historyRef, orderBy("createdAt", "desc")));
  if (snap.empty) return null;

  const latest = snap.docs[0].data();
  const analysis = latest?.analysis;
  if (!analysis) return null;

  return {
    atsScore: analysis.atsScore ?? 0,
    strengths: analysis.strengths ?? [],
    weaknesses: analysis.weaknesses ?? [],
  };
}

export async function getCachedRecommendation(uid: string): Promise<RecommendationData | null> {
  const ref = doc(db, "users", uid, "recommendation", "latest");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as RecommendationData) : null;
}

export async function saveRecommendation(uid: string, data: RecommendationData): Promise<void> {
  const ref = doc(db, "users", uid, "recommendation", "latest");
  await setDoc(ref, data);
}

/** Cheap, deterministic fingerprint of the inputs that affect generation —
 *  used to detect "did the real scores actually change" without a full
 *  deep-equal, so we regenerate only when something real has moved. */
export function buildInputSnapshot(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}
