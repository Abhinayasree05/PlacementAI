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
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Award,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { auth, db } from "../../lib/firebase";
import { AgentBackground } from "../../components/shared/AgentBackground";
import { createNotification } from "../../lib/notificationService";

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

if (!text.trim()) {
  throw new Error("No readable text found. Please upload a text-based PDF.");
}

setResumeText(text);
   } catch (err) {
  console.error("PDF extraction failed:", err);
  setResumeText("");
  setFile(null);
  setError(
    err instanceof Error
      ? err.message
      : "Could not read text from this PDF. Try a different file."
  );
}finally {
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

  const message = err instanceof Error ? err.message : "";

  if (message.includes("(429)") || message.includes("RESOURCE_EXHAUSTED")) {
    setError(
      "Gemini's daily free-tier quota has been exhausted. Your uploaded resume is retained. Please try again after the quota resets."
    );
  } else {
    setError(message || "Analysis failed. Please try again.");
  }
}finally {
      setIsAnalyzing(false);
    }
  }
    async function callGeminiForAnalysis(
    text: string,
    jobDesc: string
  ): Promise<AnalysisResult> {
    const workerUrl = import.meta.env.VITE_GEMINI_WORKER_URL;

    if (!workerUrl) {
      throw new Error("Missing VITE_GEMINI_WORKER_URL in .env");
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

    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini Worker error (${response.status}): ${errBody}`);
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
      createNotification(
        user.uid,
        "resume",
        "Resume analysis complete",
        `Your ATS score is ${result.atsScore}%.`,
        "/dashboard/resume"
      );
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

    addLine("PlacementAI â€” Resume Analysis Report", { bold: true, size: 16 });
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
    result.strengths.forEach((s) => addLine(`â€¢ ${s}`));
    y += 2;

    addLine("Weaknesses", { bold: true });
    result.weaknesses.forEach((w) => addLine(`â€¢ ${w}`));
    y += 2;

    addLine("Suggestions", { bold: true });
    result.suggestions.forEach((s) => addLine(`â€¢ ${s}`));
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
    <AgentBackground>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-11 h-11 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Resume Agent
            </h1>
            <p className="text-sm text-[#A1A1AA]">AI-powered ATS analysis for your resume</p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-[#E50914]/40 bg-[#E50914]/10 text-white px-4 py-3 text-sm flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-[#E50914] shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Upload + Job Description */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-[20px] border border-white/[0.08] bg-[#151515] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-6 mb-6 hover:border-[#E50914]/30 transition-colors duration-300"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA] mb-2">
                Upload Resume (PDF)
              </label>

              <label
                htmlFor="resume-upload-input"
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E50914]/40 bg-white/[0.02] px-6 py-8 text-center cursor-pointer transition-colors hover:border-[#E50914] hover:bg-[#E50914]/5"
              >
                <div className="w-10 h-10 rounded-full bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-4 h-4 text-[#E50914]" />
                </div>
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-[#E50914]">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-[#A1A1AA]">PDF only</p>
              </label>
              <input
                id="resume-upload-input"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 rounded-xl border border-[#E50914]/30 bg-[#E50914]/5 p-4"
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <CheckCircle className="w-4 h-4 text-[#E50914]" />
                    Resume Uploaded Successfully
                  </h3>

                  <p className="mt-3 text-sm text-white/80">
                    <span className="font-semibold text-[#A1A1AA]">Resume Name:</span> {file.name}
                  </p>

                  <p className="mt-1 text-sm text-white/80">
                    <span className="font-semibold text-[#A1A1AA]">Resume Size:</span>{" "}
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                  </p>

                  {isExtracting && (
  <p className="mt-2 flex items-center gap-2 text-sm text-[#E50914]">
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
    Extracting resume text...
  </p>
)}

{resumeText && !isExtracting && (
  <p className="mt-2 flex items-center gap-2 text-sm text-green-400">
    <CheckCircle className="w-4 h-4" />
    Resume text extracted successfully ({resumeText.length.toLocaleString()} characters).
  </p>
)}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(file);
                        window.open(url, "_blank");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:border-[#E50914] hover:bg-[#E50914]/10 transition"
                    >
                      <Eye className="w-4 h-4" /> View Resume
                    </button>

                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(file);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = file.name;
                        a.click();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:border-[#E50914] hover:bg-[#E50914]/10 transition"
                    >
                      <Download className="w-4 h-4" /> Download Resume
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA] mb-2">
              Job Description (optional â€” enables Job Match Score)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              placeholder="Paste the job description here..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#E50914]/50 focus:border-[#E50914]/60 transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: resumeText && !isAnalyzing && !isExtracting ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={analyzeResume}
            disabled={!resumeText || isAnalyzing || isExtracting}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all
              bg-gradient-to-r from-[#E50914] to-[#B20710]
              shadow-[0_0_18px_rgba(229,9,20,0.35)] hover:shadow-[0_0_26px_rgba(229,9,20,0.55)]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" /> Analyze Resume
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Results */}
        {displayedResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-[20px] border border-white/[0.08] bg-[#151515] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E50914]" />
                {viewingHistoryItem ? "Past Report" : "Analysis Result"}
              </h2>
              <button
                onClick={downloadPdfReport}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:border-[#E50914] hover:bg-[#E50914]/10 transition"
              >
                <Download className="w-4 h-4" /> Download PDF Report
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <ScoreCard label="ATS Score" value={displayedResult.atsScore} icon={Award} />
              <ScoreCard label="Job Match" value={displayedResult.jobMatchScore} icon={Target} />
            </div>

            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA] mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#E50914]" /> ATS Breakdown
              </h3>
              <div className="space-y-4">
                <BreakdownBar label="Skills" value={displayedResult.breakdown.skills} />
                <BreakdownBar label="Projects" value={displayedResult.breakdown.projects} />
                <BreakdownBar label="Education" value={displayedResult.breakdown.education} />
                <BreakdownBar label="Formatting" value={displayedResult.breakdown.formatting} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <ListCard title="Strengths" items={displayedResult.strengths} icon={CheckCircle} />
              <ListCard title="Weaknesses" items={displayedResult.weaknesses} icon={AlertTriangle} />
              <ListCard title="AI Suggestions" items={displayedResult.suggestions} icon={Sparkles} />
            </div>

            {(displayedResult.matchedKeywords.length > 0 ||
              displayedResult.missingKeywords.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KeywordChips
                  title="Matched Keywords"
                  keywords={displayedResult.matchedKeywords}
                  variant="matched"
                />
                <KeywordChips
                  title="Missing Keywords"
                  keywords={displayedResult.missingKeywords}
                  variant="missing"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-[20px] border border-white/[0.08] bg-[#151515] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Resume History</h2>

          {isLoadingHistory && (
            <p className="flex items-center gap-2 text-sm text-[#A1A1AA]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading history...
            </p>
          )}

          {!isLoadingHistory && history.length === 0 && (
            <p className="text-sm text-[#A1A1AA]">No past resumes analyzed yet.</p>
          )}

          <ul className="divide-y divide-white/[0.06]">
            {history.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.fileName}</p>
                  <p className="text-xs text-[#A1A1AA]">
                    ATS Score: {item.analysis.atsScore}/100
                    {item.createdAt ? ` â€¢ ${item.createdAt.toDate().toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <button
                    onClick={() => viewHistoryItem(item)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-[#E50914] transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Report
                  </button>
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E50914]/80 hover:text-[#E50914] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </AgentBackground>
  );
}

// ---------- Small presentational helpers ----------

function ScoreCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Award;
}) {
  const status =
    value >= 75 ? "Excellent" : value >= 50 ? "Good" : value >= 30 ? "Fair" : "Needs Improvement";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-center hover:border-[#E50914]/40 hover:shadow-[0_0_24px_rgba(229,9,20,0.15)] transition-all"
    >
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-[#E50914]" />
        <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">{label}</p>
      </div>
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-4xl font-extrabold bg-gradient-to-r from-[#E50914] to-[#FF4D4D] bg-clip-text text-transparent"
      >
        {value}
      </motion.p>
      <p className="text-xs font-medium text-white/60 mt-1">{status}</p>
    </motion.div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#A1A1AA] mb-1.5">
        <span className="font-medium text-white/70">{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden bg-[#242424]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#FF4D4D]"
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:border-[#E50914]/40 hover:shadow-[0_0_20px_rgba(229,9,20,0.12)] transition-all"
    >
      <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <Icon className="w-4 h-4 text-[#E50914]" />
        {title}
      </h4>
      <ul className="text-sm text-white/70 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-[#E50914] mt-1.5 w-1 h-1 rounded-full bg-[#E50914] shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function KeywordChips({
  title,
  keywords,
  variant,
}: {
  title: string;
  keywords: string[];
  variant: "matched" | "missing";
}) {
  const Icon = variant === "matched" ? CheckCircle : AlertTriangle;
  const chipClass =
    variant === "matched"
      ? "bg-white/[0.04] border border-white/15 text-white/80"
      : "bg-[#E50914]/10 border border-[#E50914]/30 text-white/80";

  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA] mb-2.5">
        <Icon className="w-3.5 h-3.5 text-[#E50914]" />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${chipClass}`}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
