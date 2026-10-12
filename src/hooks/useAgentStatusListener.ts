import { useEffect } from "react";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAgentStatusStore } from "../store/useAgentStatusStore";

/**
 * hooks/useAgentStatusListener.ts
 *
 * Mount once near the app root (alongside useAuthListener). Subscribes to
 * the real Firestore data behind each agent and keeps useAgentStatusStore
 * live — no polling, no manual refresh, no hardcoded status.
 *
 * Data sources (all pre-existing, nothing new created):
 *  - Resume:    users/{uid}/resumeHistory, latest doc by createdAt, field
 *               `analysis.atsScore` (written by ResumePage.tsx already).
 *  - Aptitude:  users/{uid}/aptitudeHistory, latest doc by createdAt, field
 *               `score` (written by AptitudePage.tsx's real quiz engine).
 *  - Coding:    users/{uid}/codingHistory, all docs — status derived from
 *               distinct problems solved at 70%+ in the last 7 days
 *               (written by CodingPage.tsx's real AI-reviewed submissions).
 *  - Interview: users/{uid}/interviewHistory, latest doc by createdAt,
 *               field `score` (written by InterviewPage.tsx's real
 *               AI-generated mock interview + review flow).
 *
 * All five agents now read real Firestore data — no more dead profile
 * score fields anywhere in this listener.
 */

const COMPLETION_TARGET = 70; // score threshold treated as "target reached"

export function useAgentStatusListener() {
  useEffect(() => {
    let unsubInterview: (() => void) | undefined;
    let unsubResume: (() => void) | undefined;
    let unsubAptitude: (() => void) | undefined;
    let unsubRecommendation: (() => void) | undefined;
    let unsubCoding: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubInterview?.();
      unsubResume?.();
      unsubAptitude?.();
      unsubRecommendation?.();
      unsubCoding?.();

      if (!user) {
        useAgentStatusStore.getState().reset();
        return;
      }

      // ---- Interview — live "latest interviewHistory doc" listener ----
      const interviewQuery = query(
        collection(db, "users", user.uid, "interviewHistory"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      unsubInterview = onSnapshot(interviewQuery, (snap) => {
        if (snap.empty) {
          useAgentStatusStore.getState().setInterview({
            status: "not-started",
            score: 0,
            detail: "No mock interview completed yet",
          });
          useAgentStatusStore.getState().setLoaded(true);
          return;
        }

        const latest = snap.docs[0].data();
        const score: number = latest?.score ?? 0;

        useAgentStatusStore.getState().setInterview({
          status: score >= COMPLETION_TARGET ? "completed" : "in-progress",
          score,
          detail:
            score >= COMPLETION_TARGET
              ? `Last session: ${score}% — target reached`
              : `Last session: ${score}% — reach ${COMPLETION_TARGET}% to complete`,
        });
        useAgentStatusStore.getState().setLoaded(true);
      });

      // ---- Coding — live codingHistory listener (weekly target) ----
      const codingQuery = query(collection(db, "users", user.uid, "codingHistory"), orderBy("createdAt", "desc"));
      unsubCoding = onSnapshot(codingQuery, (snap) => {
        if (snap.empty) {
          useAgentStatusStore.getState().setCoding({
            status: "not-started",
            score: 0,
            detail: "No problems solved yet",
          });
          return;
        }

        const CODING_WEEKLY_TARGET = 5;
        const now = Date.now();
        const solvedThisWeek = new Set<string>();

        snap.docs.forEach((d) => {
          const data = d.data();
          const score: number = data?.score ?? 0;
          const createdAt = data?.createdAt?.toDate?.();
          if (!createdAt || score < 70) return;
          const days = (now - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          if (days <= 7) solvedThisWeek.add(data.problemId);
        });

        const progressPct = Math.min(100, Math.round((solvedThisWeek.size / CODING_WEEKLY_TARGET) * 100));

        useAgentStatusStore.getState().setCoding({
          status: solvedThisWeek.size >= CODING_WEEKLY_TARGET ? "completed" : "in-progress",
          score: progressPct,
          detail:
            solvedThisWeek.size >= CODING_WEEKLY_TARGET
              ? `Weekly target reached — ${solvedThisWeek.size} problems`
              : `${solvedThisWeek.size}/${CODING_WEEKLY_TARGET} problems solved this week`,
        });
      });

      // ---- Resume — live "latest resumeHistory doc" listener ----
      const resumeQuery = query(
        collection(db, "users", user.uid, "resumeHistory"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      unsubResume = onSnapshot(resumeQuery, (snap) => {
        if (snap.empty) {
          useAgentStatusStore.getState().setResume({
            status: "not-started",
            score: 0,
            detail: "No resume uploaded yet",
          });
          return;
        }

        const latest = snap.docs[0].data();
        const atsScore: number = latest?.analysis?.atsScore ?? 0;

        useAgentStatusStore.getState().setResume({
          status: atsScore >= 85 ? "completed" : "in-progress",
          score: atsScore,
          detail:
            atsScore >= 85
              ? `Latest ATS score ${atsScore}% — great job!`
              : `Latest ATS score ${atsScore}% — reach 85% to complete`,
        });
      });

      // ---- Aptitude — live "latest aptitudeHistory doc" listener ----
      const aptitudeQuery = query(
        collection(db, "users", user.uid, "aptitudeHistory"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      unsubAptitude = onSnapshot(aptitudeQuery, (snap) => {
        if (snap.empty) {
          useAgentStatusStore.getState().setAptitude({
            status: "not-started",
            score: 0,
            detail: "No aptitude quiz attempted yet",
          });
          return;
        }

        const latest = snap.docs[0].data();
        const score: number = latest?.score ?? 0;

        useAgentStatusStore.getState().setAptitude({
          status: score >= COMPLETION_TARGET ? "completed" : "in-progress",
          score,
          detail:
            score >= COMPLETION_TARGET
              ? `Last quiz: ${score}% — target reached`
              : `Last quiz: ${score}% — reach ${COMPLETION_TARGET}% to complete`,
        });
      });

      // ---- Recommendation Agent — live cached-recommendation-doc listener ----
      unsubRecommendation = onSnapshot(
        doc(db, "users", user.uid, "recommendation", "latest"),
        (snap) => {
          if (!snap.exists()) {
            useAgentStatusStore.getState().setRecommendation({
              status: "not-started",
              score: 0,
              detail: "No recommendations generated yet",
            });
            return;
          }

          const data = snap.data();
          const readiness: number = data?.placementPrediction?.readiness ?? 0;

          useAgentStatusStore.getState().setRecommendation({
            status: readiness >= COMPLETION_TARGET ? "completed" : "in-progress",
            score: readiness,
            detail:
              readiness >= COMPLETION_TARGET
                ? `Placement readiness ${readiness}% — on track`
                : `Placement readiness ${readiness}% — keep improving`,
          });
        }
      );
    });

    return () => {
      unsubAuth();
      unsubInterview?.();
      unsubResume?.();
      unsubAptitude?.();
      unsubRecommendation?.();
      unsubCoding?.();
    };
  }, []);
}
