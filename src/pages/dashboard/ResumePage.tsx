import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import jsPDF from "jspdf";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "../../lib/firebase";

// pdfjs needs a worker. This CDN-free setup works with Vite.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ---------- Types ----------

interface ATSBreakdown {
  skills: number;
  projects: number;
  education: number;
  formatting: number;
}

interface AnalysisResult {
  atsScore: number;
  breakdown: ATSBreakdown;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobMatchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

interface ResumeHistoryItem {
  id: string;
  fileName: string;
  createdAt: Timestamp | null;
  analysis: AnalysisResult;
}

// ---------- Component ----------

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<ResumeHistoryItem[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] =
    useState<ResumeHistoryItem | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // ---------- Load resume history from Firestore ----------
  async function loadHistory() {
    const user = auth.currentUser;
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const historyRef = collection(db, "users", user.uid, "resumeHistory");
      const q = query(historyRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items: ResumeHistoryItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fileName: data.fileName,
          createdAt: data.createdAt ?? null,
          analysis: data.analysis as AnalysisResult,
        };
      });
      setHistory(items);
    } catch (err) {
      console.error("Failed to load resume history:", err);
      setError("Could not load your resume history. Please try again.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // ---------- Handle PDF upload + text extraction ----------
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setFile(selected);
    setAnalysis(null);
    setViewingHistoryItem(null);
    setError(null);
    setIsExtracting(true);

    try {
      const text = await extractTextFromPdf(selected);
      setResumeText(text);
    } catch (err) {
      console.error("PDF extraction failed:", err);
      setError("Could not read text from this PDF. Try a different file.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function extractTextFromPdf(pdfFile: File): Promise<string> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }
    return fullText.trim();
  }

  // ---------- Analyze resume with Gemini ----------
  async function analyzeResume() {
    if (!resumeText) {
      setError("Please upload a resume first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await callGeminiForAnalysis(resumeText, jobDescription);
      setAnalysis(result);
      await saveResumeToHistory(result);
    } catch (err) {
      console.error("Gemini analysis failed:", err);
      setError("Analysis failed. Please try again in a moment.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function callGeminiForAnalysis(
    text: string,
    jobDesc: string
  ): Promise<AnalysisResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing VITE_GEMINI_API_KEY in .env");
    }

    const prompt = `
You are an ATS (Applicant Tracking System) resume analyzer.
Analyze the resume text below${jobDesc ? " against the provided job description" : ""}.

Return ONLY valid JSON (no markdown, no code fences, no extra text) matching exactly this shape:
{
  "atsScore": number (0-100),
  "breakdown": {
    "skills": number (0-100),
    "projects": number (0-100),
    "education": number (0-100),
    "formatting": number (0-100)
  },
  "strengths": string[] (3-5 short bullet points),
  "weaknesses": string[] (3-5 short bullet points),
  "suggestions": string[] (3-5 short actionable bullet points),
  "jobMatchScore": number (0-100, use 0 if no job description was provided),
  "matchedKeywords": string[] (keywords from the job description found in the resume; empty array if no job description),
  "missingKeywords": string[] (important keywords from the job description missing from the resume; empty array if no job description)
}

RESUME TEXT:
"""
${text}
"""

${jobDesc ? `JOB DESCRIPTION:\n"""\n${jobDesc}\n"""` : "No job description was provided."}
`.trim();

    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    }),
  }
);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const rawText: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let parsed: AnalysisResult;

try {
  parsed = JSON.parse(cleaned);
} catch {
  throw new Error("Gemini returned invalid JSON.");
}

return parsed;
  }

  // ---------- Save to Firestore ----------
  async function saveResumeToHistory(result: AnalysisResult) {
    const user = auth.currentUser;
    if (!user || !file) return;

    try {
      const historyRef = collection(db, "users", user.uid, "resumeHistory");
      await addDoc(historyRef, {
        fileName: file.name,
        analysis: result,
        createdAt: serverTimestamp(),
      });
      await loadHistory();
    } catch (err) {
      console.error("Failed to save resume history:", err);
      setError("Analysis succeeded but saving to history failed.");
    }
  }

  // ---------- Delete history item ----------
  async function deleteHistoryItem(id: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "resumeHistory", id));
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (viewingHistoryItem?.id === id) setViewingHistoryItem(null);
    } catch (err) {
      console.error("Failed to delete resume history item:", err);
      setError("Could not delete this history item.");
    }
  }

  // ---------- View a past report ----------
  function viewHistoryItem(item: ResumeHistoryItem) {
  console.log(item);
  console.log(item.analysis);

  setViewingHistoryItem(item);
  setAnalysis(null);
}

  // ---------- Download PDF report ----------
  function downloadPdfReport() {
    const result = viewingHistoryItem?.analysis ?? analysis;
    if (!result) return;

    const pdfDoc = new jsPDF();
    let y = 18;
    const lineGap = 7;

    const addLine = (text: string, opts?: { bold?: boolean; size?: number }) => {
      pdfDoc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      pdfDoc.setFontSize(opts?.size ?? 11);
      const lines = pdfDoc.splitTextToSize(text, 180);
      pdfDoc.text(lines, 14, y);
      y += lineGap * lines.length;
    };

    addLine("PlacementAI — Resume Analysis Report", { bold: true, size: 16 });
    y += 2;
    addLine(`ATS Score: ${result.atsScore}/100`, { bold: true });
    addLine(`Job Match Score: ${result.jobMatchScore}/100`);
    y += 2;

    addLine("ATS Breakdown", { bold: true });
    addLine(`Skills: ${result.breakdown.skills}/100`);
    addLine(`Projects: ${result.breakdown.projects}/100`);
    addLine(`Education: ${result.breakdown.education}/100`);
    addLine(`Formatting: ${result.breakdown.formatting}/100`);
    y += 2;

    addLine("Strengths", { bold: true });
    result.strengths.forEach((s) => addLine(`• ${s}`));
    y += 2;

    addLine("Weaknesses", { bold: true });
    result.weaknesses.forEach((w) => addLine(`• ${w}`));
    y += 2;

    addLine("Suggestions", { bold: true });
    result.suggestions.forEach((s) => addLine(`• ${s}`));
    y += 2;

    if (result.matchedKeywords.length > 0) {
      addLine("Matched Keywords", { bold: true });
      addLine(result.matchedKeywords.join(", "));
      y += 2;
    }

    if (result.missingKeywords.length > 0) {
      addLine("Missing Keywords", { bold: true });
      addLine(result.missingKeywords.join(", "));
    }

    pdfDoc.save(`resume-report-${Date.now()}.pdf`);
  }

  const displayedResult = viewingHistoryItem?.analysis ?? analysis;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resume Agent</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Upload + Job Description */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume (PDF)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
            />
            {file && (
  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">

    <h3 className="text-lg font-semibold text-green-700">
      📄 Resume Uploaded Successfully
    </h3>

    <p className="mt-3">
      <span className="font-semibold">Resume Name:</span> {file.name}
    </p>

    <p className="mt-2">
      <span className="font-semibold">Resume Size:</span>{" "}
      {file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(2)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
    </p>

    {isExtracting && (
      <p className="mt-2 text-blue-600">
        Extracting resume text...
      </p>
    )}

    <div className="mt-4 flex gap-3">

      <button
        onClick={() => {
          const url = URL.createObjectURL(file);
          window.open(url, "_blank");
        }}
        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        👁 View Resume
      </button>

      <button
        onClick={() => {
          const url = URL.createObjectURL(file);

          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          a.click();
        }}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        ⬇ Download Resume
      </button>

    </div>

  </div>
)}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description (optional — enables Job Match Score)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            placeholder="Paste the job description here..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={analyzeResume}
          disabled={!resumeText || isAnalyzing || isExtracting}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>

      {/* Results */}
      {displayedResult && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewingHistoryItem ? "Past Report" : "Analysis Result"}
            </h2>
            <button
              onClick={downloadPdfReport}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Download PDF Report
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <ScoreCard label="ATS Score" value={displayedResult.atsScore} />
            <ScoreCard label="Job Match Score" value={displayedResult.jobMatchScore} />
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              ATS Breakdown
            </h3>
            <div className="space-y-3">
              <BreakdownBar label="Skills" value={displayedResult.breakdown.skills} />
              <BreakdownBar label="Projects" value={displayedResult.breakdown.projects} />
              <BreakdownBar label="Education" value={displayedResult.breakdown.education} />
              <BreakdownBar label="Formatting" value={displayedResult.breakdown.formatting} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <ListCard title="Strengths" items={displayedResult.strengths} color="green" />
            <ListCard title="Weaknesses" items={displayedResult.weaknesses} color="red" />
            <ListCard title="Suggestions" items={displayedResult.suggestions} color="blue" />
          </div>

          {(displayedResult.matchedKeywords.length > 0 ||
            displayedResult.missingKeywords.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <KeywordChips
                title="Matched Keywords"
                keywords={displayedResult.matchedKeywords}
                color="green"
              />
              <KeywordChips
                title="Missing Keywords"
                keywords={displayedResult.missingKeywords}
                color="red"
              />
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume History</h2>

        {isLoadingHistory && <p className="text-sm text-gray-500">Loading history...</p>}

        {!isLoadingHistory && history.length === 0 && (
          <p className="text-sm text-gray-500">No past resumes analyzed yet.</p>
        )}

        <ul className="divide-y divide-gray-200">
          {history.map((item) => (
            <li key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.fileName}</p>
                <p className="text-xs text-gray-500">
                  ATS Score: {item.analysis.atsScore}/100
                  {item.createdAt
  ? ` • ${item.createdAt.toDate().toLocaleString()}`
  : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => viewHistoryItem(item)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View Report
                </button>
                <button
                  onClick={() => deleteHistoryItem(item.id)}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Small presentational helpers ----------

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-center">
      <p className="text-3xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: "green" | "red" | "blue";
}) {
  const colorMap = {
    green: "text-green-700 bg-green-50 border-green-200",
    red: "text-red-700 bg-red-50 border-red-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <ul className="text-sm space-y-1.5 list-disc list-inside">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function KeywordChips({
  title,
  keywords,
  color,
}: {
  title: string;
  keywords: string[];
  color: "green" | "red";
}) {
  const chipColor =
    color === "green"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${chipColor}`}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}