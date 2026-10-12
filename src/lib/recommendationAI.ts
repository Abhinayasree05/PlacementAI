
import type { RecommendationData } from "../store/useRecommendationStore";
import type { AptitudeTopicBreakdown } from "./recommendationService";

// =====================================================================
// lib/recommendationAI.ts
// Calls Gemini to generate the advisory parts of the Recommendation
// Agent using the existing Cloudflare Gemini Worker.
//
// AI-generated:
// - Recommendations
// - Learning roadmap
// - Company suggestions
// - Skill recommendations
// - Course recommendations
// - Daily goals
// - Weekly feedback
// - Placement prediction suggestions
//
// Deterministic data:
// - Weak areas
// - Strong areas
//
// Weak and strong areas are computed from actual Firestore data.
// Gemini must not invent these areas.
// =====================================================================

export interface RecommendationInput {
  fullName: string;
  college: string;
  department: string;
  skills: string[];
  resumeScore: number;
  codingScore: number;
  interviewScore: number;
  aptitudeScore: number;
  profileCompletion: number;
  overallReadiness: number;
  aptitudeBreakdown: AptitudeTopicBreakdown[];
  resumeStrengths: string[];
  resumeWeaknesses: string[];
  weakAreas: string[];
  strongAreas: string[];
  codingDataAvailable: boolean;
  interviewDataAvailable: boolean;
}

interface GeminiRecommendationResponse {
  aiRecommendations: string[];
  roadmap: {
    week: number;
    title: string;
    items: string[];
  }[];
  companies: {
    name: string;
    reason: string;
  }[];
  skills: string[];
  courses: {
    platform: string;
    topic: string;
  }[];
  dailyGoals: string[];
  weeklyFeedback: string;
  placementPredictionSuggestions: string[];
}

// =====================================================================
// GENERATE RECOMMENDATIONS
// =====================================================================

export async function generateRecommendations(
  input: RecommendationInput
): Promise<
  Omit<
    RecommendationData,
    "generatedAt" | "inputSnapshot" | "previousReadiness"
  >
> {
  const workerUrl = import.meta.env.VITE_GEMINI_WORKER_URL;

  if (!workerUrl) {
    throw new Error("Missing VITE_GEMINI_WORKER_URL in .env");
  }

  const prediction =
    input.overallReadiness >= 75
      ? "High"
      : input.overallReadiness >= 45
        ? "Medium"
        : "Low";

  const prompt = `
You are an AI Career Mentor inside a placement-preparation platform.

Generate personalized, encouraging, and realistic guidance based ONLY
on the student's actual data provided below.

RULES:
- Do not claim technical weaknesses that are not listed in weakAreas.
- If codingDataAvailable is false, do not invent coding-specific weaknesses.
  Recommend getting started with DSA instead.
- If interviewDataAvailable is false, do not invent interview weaknesses.
  Recommend starting interview preparation instead.
- Keep every list item short (under 18 words).
- Company suggestions must be realistic for this student's branch and skill level.
- Do not guarantee placements or job offers.
- Do not invent academic scores or achievements.

STUDENT DATA:

Name: ${input.fullName}
College: ${input.college}
Department: ${input.department}
Known skills: ${input.skills.join(", ") || "not specified"}

SCORES (0-100):

Resume ATS: ${input.resumeScore}
Coding: ${input.codingScore}
Coding data available: ${input.codingDataAvailable}

Interview: ${input.interviewScore}
Interview data available: ${input.interviewDataAvailable}

Aptitude: ${input.aptitudeScore}
Profile completion: ${input.profileCompletion}
Overall placement readiness: ${input.overallReadiness}

REAL APTITUDE TOPIC BREAKDOWN:

${
  input.aptitudeBreakdown
    .map(
      (b) =>
        `- ${b.topic}: average ${b.averageScore}% over ${b.attempts} attempt(s)`
    )
    .join("\n") || "No aptitude attempts yet"
}

REAL RESUME ANALYSIS:

Strengths:
${input.resumeStrengths.join("; ") || "None recorded"}

Weaknesses:
${input.resumeWeaknesses.join("; ") || "None recorded"}

DETECTED WEAK AREAS:
${input.weakAreas.join("; ") || "None detected yet"}

DETECTED STRONG AREAS:
${input.strongAreas.join("; ") || "None detected yet"}

Do not invent additional weak or strong areas.

Return ONLY valid JSON with this exact structure:

{
  "aiRecommendations": ["Recommendation 1", "Recommendation 2"],
  "roadmap": [
    {
      "week": 1,
      "title": "Week title",
      "items": ["Task 1", "Task 2"]
    }
  ],
  "companies": [
    {
      "name": "Company name",
      "reason": "Short reason"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "courses": [
    {
      "platform": "Platform name",
      "topic": "Course topic"
    }
  ],
  "dailyGoals": ["Goal 1", "Goal 2"],
  "weeklyFeedback": "Two or three sentences of feedback.",
  "placementPredictionSuggestions": ["Suggestion 1", "Suggestion 2"]
}

Requirements:
- aiRecommendations: 4-6 items.
- roadmap: exactly 4 weeks, with 2-4 items per week.
- companies: 5-8 realistic suggestions.
- skills: 6-10 relevant skills.
- courses: 5-8 entries.
- dailyGoals: 3-5 achievable tasks.
- weeklyFeedback: 2-3 sentences.
- placementPredictionSuggestions: 3-5 concrete steps.
`.trim();

  // ===================================================================
  // CALL GEMINI WORKER
  // ===================================================================

  let response: Response;

  try {
    response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        generationConfig: {
          temperature: 0.4,
        },
      }),
    });
  } catch (error) {
    console.error("Gemini Worker connection failed:", error);

    throw new Error(
      "Unable to connect to the AI recommendation service. Please check your connection and try again."
    );
  }

  // ===================================================================
  // HANDLE GEMINI ERRORS
  // ===================================================================

  if (!response.ok) {
    const errBody = await response.text();

    if (response.status === 429) {
      const quotaExceeded =
        /quota exceeded|free.?tier|resource_exhausted|requests per day/i.test(
          errBody
        );

      if (quotaExceeded) {
        throw new Error(
          "The Gemini AI daily quota has been exhausted. Your previous recommendation data has not been changed. Please try again after the quota resets."
        );
      }

      throw new Error(
        "The AI recommendation service is receiving too many requests. Please wait and try again."
      );
    }

    if (response.status === 503) {
      throw new Error(
        "Gemini AI is temporarily experiencing high demand. Please try again later."
      );
    }

    if (response.status === 502 || response.status === 504) {
      throw new Error(
        "The AI recommendation service is temporarily unavailable. Please try again."
      );
    }

    console.error("Gemini Worker error:", response.status, errBody);

    throw new Error(
      `Gemini Worker error (${response.status}). Please try again later.`
    );
  }

  // ===================================================================
  // EXTRACT GEMINI RESPONSE
  // ===================================================================

  const data = await response.json();

  const rawText: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty recommendation response.");
  }

  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // ===================================================================
  // PARSE AND VALIDATE AI RESPONSE
  // ===================================================================

  let parsed: GeminiRecommendationResponse;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid recommendation JSON.");
  }

  const validResponse =
    Array.isArray(parsed.aiRecommendations) &&
    Array.isArray(parsed.roadmap) &&
    parsed.roadmap.length === 4 &&
    Array.isArray(parsed.companies) &&
    Array.isArray(parsed.skills) &&
    Array.isArray(parsed.courses) &&
    Array.isArray(parsed.dailyGoals) &&
    typeof parsed.weeklyFeedback === "string" &&
    Array.isArray(parsed.placementPredictionSuggestions);

  if (!validResponse) {
    throw new Error(
      "Gemini returned incomplete recommendation data. Please try again."
    );
  }

  // ===================================================================
  // RETURN RECOMMENDATIONS
  // ===================================================================

  return {
    aiRecommendations: parsed.aiRecommendations,
    roadmap: parsed.roadmap,
    companies: parsed.companies,
    skills: parsed.skills,
    courses: parsed.courses,
    dailyGoals: parsed.dailyGoals,
    weeklyFeedback: parsed.weeklyFeedback,

    // These are based on actual student data, not invented by Gemini.
    weakAreas: input.weakAreas,
    strongAreas: input.strongAreas,

    placementPrediction: {
      readiness: input.overallReadiness,
      chance: prediction,
      expectedCompanies: parsed.companies
        .slice(0, 4)
        .map((company) => company.name),
      suggestionsToReach95: parsed.placementPredictionSuggestions,
    },
  };
}
