import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function analyzeResumeWithGemini(
  resumeText: string
) {
  const prompt = `
Analyze the resume below and give ATS analysis.

Return ONLY in this exact format:

ATS Score: number

Skills Score: number
Projects Score: number
Education Score: number
Formatting Score: number

Strengths:
- point 1
- point 2

Weaknesses:
- point 1
- point 2

Suggestions:
- suggestion 1
- suggestion 2

Resume:
${resumeText}
`;


  const result = await model.generateContent(prompt);

  return result.response.text();
}