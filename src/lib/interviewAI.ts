
// =====================================================================
// lib/interviewAI.ts
// Two Gemini calls using the Cloudflare Gemini Worker:
//
// 1. generateInterviewQuestions
//    Generates questions based on the student's department, skills,
//    and selected interview type.
//
// 2. reviewInterviewAnswers
//    Reviews the student's actual typed answers and provides
//    per-question and overall AI feedback.
//
// No voice recording or transcription.
// Optional read-aloud is handled by browser speech synthesis.
// =====================================================================

export type InterviewType = "HR" | "Technical" | "Behavioral";

// =====================================================================
// GEMINI WORKER CALL WITH AUTOMATIC RETRIES
// =====================================================================

async function callGemini(prompt: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_GEMINI_WORKER_URL;

  if (!workerUrl) {
    throw new Error("Missing VITE_GEMINI_WORKER_URL in .env");
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response;

    // ---------------------------------------------------------------
    // Send request to Gemini Worker
    // ---------------------------------------------------------------

    try {
      response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          generationConfig: {
            temperature: 0.5,
          },
        }),
      });
    } catch (error) {
      // Retry temporary network failures.
      if (attempt === maxAttempts) {
        console.error("Gemini network connection failed:", error);

        throw new Error(
          "Unable to connect to the Gemini Worker. Please try again."
        );
      }

      console.warn(
        `Gemini network error. Retrying (${attempt}/${maxAttempts})...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 2000)
      );

      continue;
    }

    // ---------------------------------------------------------------
    // Handle API errors
    // ---------------------------------------------------------------

    if (!response.ok) {
      const errBody = await response.text();

      const temporaryError = [429, 502, 503, 504].includes(
        response.status
      );

      if (temporaryError && attempt < maxAttempts) {
        console.warn(
          `Gemini returned ${response.status}. Retrying (${attempt}/${maxAttempts})...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 2000)
        );

        continue;
      }

      throw new Error(
        `Gemini Worker error (${response.status}): ${errBody}`
      );
    }

    // ---------------------------------------------------------------
    // Extract Gemini response
    // ---------------------------------------------------------------

    const data = await response.json();

    const rawText: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    return rawText.replace(/```json|```/g, "").trim();
  }

  throw new Error(
    "Gemini could not complete the request. Please try again."
  );
}

// =====================================================================
// GENERATE INTERVIEW QUESTIONS
// =====================================================================

export async function generateInterviewQuestions(
  type: InterviewType,
  department: string,
  skills: string[]
): Promise<string[]> {
  const prompt = `
Generate exactly 5 ${type} interview questions for a placement interview, appropriate for a
student in ${department || "Computer Science"} with skills: ${skills.join(", ") || "general programming"}.

${type === "Technical" ? "Focus on core CS fundamentals and their listed skills." : ""}
${type === "HR" ? "Focus on typical HR round questions (background, motivation, career goals)." : ""}
${type === "Behavioral" ? "Focus on situational/behavioral questions (teamwork, conflict, failure, leadership)." : ""}

Return ONLY a valid JSON array of 5 strings, no markdown, no extra text. Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
`.trim();

  const raw = await callGemini(prompt);

  try {
    const parsed = JSON.parse(raw);

    if (
      Array.isArray(parsed) &&
      parsed.length === 5 &&
      parsed.every((q) => typeof q === "string")
    ) {
      return parsed;
    }

    throw new Error("Unexpected format");
  } catch {
    throw new Error("Gemini returned invalid question data.");
  }
}

// =====================================================================
// INTERVIEW FEEDBACK TYPES
// =====================================================================

export interface QuestionFeedback {
  question: string;
  answer: string;
  feedback: string;
  score: number; // 0-100
}

export interface InterviewReviewResult {
  overallScore: number;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  perQuestion: QuestionFeedback[];
}

// =====================================================================
// REVIEW INTERVIEW ANSWERS
// =====================================================================

export async function reviewInterviewAnswers(
  type: InterviewType,
  qas: { question: string; answer: string }[]
): Promise<InterviewReviewResult> {
  const prompt = `
You are an AI interview coach reviewing a student's ${type} interview answers.

Be honest, constructive, and specific.
Do not give high scores for vague or empty answers.

${qas
  .map(
    (qa, i) =>
      `Q${i + 1}: ${qa.question}\nA${i + 1}: ${
        qa.answer || "(no answer given)"
      }`
  )
  .join("\n\n")}

Return ONLY valid JSON (no markdown, no code fences) matching exactly this shape:

{
  "overallScore": 75,
  "overallFeedback": "Provide 2-3 sentences of overall feedback.",
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "weaknesses": [
    "Weakness 1",
    "Weakness 2"
  ],
  "perQuestion": [
    {
      "question": "Original question",
      "answer": "Student's answer",
      "feedback": "Provide 1-2 sentences of specific feedback.",
      "score": 75
    }
  ]
}

Rules:
- overallScore must be a number from 0 to 100.
- Each question score must be a number from 0 to 100.
- strengths must contain 2-4 short points.
- weaknesses must contain 2-4 short points.
- perQuestion must have exactly ${qas.length} entries.
- Keep the original question and answer for each entry.
- Maintain the original question order.
- Evaluate technical correctness for Technical interviews.
- Evaluate communication and relevance for HR interviews.
- Evaluate examples, actions, and outcomes for Behavioral interviews.
`.trim();

  const raw = await callGemini(prompt);

  try {
    const parsed = JSON.parse(raw) as InterviewReviewResult;

    if (
      typeof parsed.overallScore !== "number" ||
      typeof parsed.overallFeedback !== "string" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !Array.isArray(parsed.perQuestion) ||
      parsed.perQuestion.length !== qas.length
    ) {
      throw new Error("Unexpected review format");
    }

    return parsed;
  } catch {
    throw new Error("Gemini returned invalid review data.");
  }
}
