import type { CodingProblem } from "../data/codingProblems";

// =====================================================================
// lib/codingReviewAI.ts
// There is no code execution/compiler sandbox in this project — so
// instead of pretending to "run" the student's code, this honestly does
// what it actually can: sends the problem + submitted code to Gemini for
// an AI code review (correctness judgment, complexity estimate,
// feedback). Gemini is called through a Worker proxy so the API key
// never ships in the frontend bundle.
// =====================================================================

export interface CodeReviewResult {
  verdict: "Correct" | "Partially Correct" | "Incorrect";
  score: number; // 0-100
  feedback: string;
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string[];
}

export async function reviewCodeWithGemini(
  problem: CodingProblem,
  code: string,
  language: string
): Promise<CodeReviewResult> {
  const workerUrl = import.meta.env.VITE_GEMINI_WORKER_URL;

  if (!workerUrl) {
    throw new Error("Missing VITE_GEMINI_WORKER_URL in .env");
  }

  const prompt = `
You are an AI code reviewer for a DSA practice platform. You do not execute code — you review it by
reading it, the same way a human reviewer would. Be honest and specific; do not give full marks unless
the logic is genuinely correct for the stated problem, including edge cases.

PROBLEM: ${problem.title} (${problem.difficulty})
${problem.description}
${problem.examples.map((ex, i) => `Example ${i + 1} — Input: ${ex.input} | Output: ${ex.output}`).join("\n")}
Constraints: ${problem.constraints}

STUDENT'S SUBMITTED CODE (language: ${language}):
\`\`\`
${code}
\`\`\`

Return ONLY valid JSON (no markdown, no code fences) matching exactly this shape:
{
  "verdict": "Correct" | "Partially Correct" | "Incorrect",
  "score": number (0-100, reflecting correctness and quality),
  "feedback": string (2-4 sentences, specific to this code),
  "timeComplexity": string (e.g. "O(n)"),
  "spaceComplexity": string (e.g. "O(1)"),
  "suggestions": string[] (1-3 short, concrete improvement suggestions)
}
`.trim();

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini Worker error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = rawText.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as CodeReviewResult;
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }
}