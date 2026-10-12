// lib/judge0Client.ts
//
// Talks ONLY to our own Cloudflare Worker proxy — never to Judge0 or
// RapidAPI directly. The Worker holds the Judge0 credential server-side
// (via `wrangler secret put`); nothing in this file, or anywhere in the
// browser bundle, ever sees or sends that credential.
//
// Judge0 status IDs (from the official API docs):
//   3  = Accepted            6  = Compilation Error
//   4  = Wrong Answer        7-12 = Runtime Error (various signals/NZEC)
//   5  = Time Limit Exceeded 13 = Internal Error, 14 = Exec Format Error

export const PYTHON_LANGUAGE_ID = 71; // Python (3.8.1)

export type TestVerdict =
  | "Passed"
  | "Wrong Answer"
  | "Runtime Error"
  | "Time Limit Exceeded"
  | "Compilation Error"
  | "Execution Error"
  | "Network Error";

export interface TestRunResult {
  verdict: TestVerdict;
  stdout: string;
  stderr: string;
  input: string;
  expectedOutput: string;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time?: string | null;
  memory?: number | null;
}

function classifyStatus(statusId: number | undefined): TestVerdict | null {
  if (statusId === 3) return "Passed";
  if (statusId === 4) return "Wrong Answer";
  if (statusId === 5) return "Time Limit Exceeded";
  if (statusId === 6) return "Compilation Error";
  if (statusId !== undefined && statusId >= 7 && statusId <= 12) return "Runtime Error";
  return null; // 13, 14, or anything unrecognized falls through to Execution Error
}

async function callWorker(
  sourceCode: string,
  stdin: string,
  expectedOutput: string
): Promise<Judge0Response> {
  const workerUrl = import.meta.env.VITE_JUDGE0_WORKER_URL as string | undefined;
  if (!workerUrl) {
    throw new Error("Code execution isn't configured (missing VITE_JUDGE0_WORKER_URL).");
  }

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: PYTHON_LANGUAGE_ID,
      stdin,
      expected_output: expectedOutput,
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution service returned ${response.status}`);
  }

  return response.json();
}

/** Run the given Python code against one test case and classify the result. */
export async function runSingleTestCase(
  sourceCode: string,
  testCase: { input: string; expectedOutput: string }
): Promise<TestRunResult> {
  try {
    const data = await callWorker(sourceCode, testCase.input, testCase.expectedOutput);
    const verdict = classifyStatus(data.status?.id) ?? "Execution Error";
    return {
      verdict,
      stdout: (data.stdout ?? "").trim(),
      stderr: (data.stderr ?? data.compile_output ?? "").trim(),
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    };
  } catch (err) {
    // Network failure, Worker down, missing config, etc. — never confuse
    // this with a wrong-answer or runtime-error verdict on the student's code.
    console.error("Judge0 execution failed:", err);
    return {
      verdict: "Network Error",
      stdout: "",
      stderr: err instanceof Error ? err.message : "Could not reach the execution service.",
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    };
  }
}

/** Run all public test cases sequentially and return one result per case. */
export async function runPublicTestCases(
  sourceCode: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<TestRunResult[]> {
  const results: TestRunResult[] = [];
  for (const testCase of testCases) {
    results.push(await runSingleTestCase(sourceCode, testCase));
  }
  return results;
}

/**
 * Run all hidden test cases sequentially (Phase D — Submit Code).
 * Reuses the exact same runSingleTestCase execution path as public tests —
 * no separate/duplicate execution system. Callers are responsible for
 * never surfacing the returned `input`/`expectedOutput` fields to the UI,
 * since hidden test details must never be shown to the student.
 */
export async function runHiddenTestCases(
  sourceCode: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<TestRunResult[]> {
  const results: TestRunResult[] = [];
  for (const testCase of testCases) {
    results.push(await runSingleTestCase(sourceCode, testCase));
  }
  return results;
}
