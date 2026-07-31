// benchmark-quiz.ts — end-to-end quiz delivery and marking benchmark
// Writes 4 quiz_submissions rows for user_id=2007, then deletes them before exit.

import { neonConfig } from '@neondatabase/serverless';
import { neon } from '@neondatabase/serverless';
import ws from 'ws';

// ── Pre-flight checks ────────────────────────────────────────────────────────

const DEMO_PASSWORD = process.env.DEMO_TEST_PASSWORD;
if (!DEMO_PASSWORD) {
  console.log('DEMO_TEST_PASSWORD: NOT SET — stopping');
  process.exit(1);
}

// Set up neonConfig for ws (needed by server/db.ts pool import)
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const sql = neon(process.env.DATABASE_URL!);

const precheck = await sql`SELECT count(*)::int AS existing_demo_subs FROM quiz_submissions WHERE user_id = 2007`;
const existingCount = precheck[0].existing_demo_subs;
if (existingCount !== 0) {
  console.log(`Precheck: ${existingCount} existing quiz_submissions for user_id=2007 — stopping`);
  process.exit(1);
}

// ── Step 1: Login ────────────────────────────────────────────────────────────

const loginRes = await fetch('http://localhost:5000/api/isolated-auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo.loadmaster@loadm-demo.invalid',
    password: DEMO_PASSWORD
  })
});

if (loginRes.status !== 200) {
  const body = await loginRes.text();
  console.log(`LOGIN FAILED: ${loginRes.status} ${body}`);
  process.exit(1);
}

// Extract isolated_session cookie
const setCookieHeader = loginRes.headers.get('set-cookie') ?? '';
const sessionMatch = setCookieHeader.match(/isolated_session=([^;]+)/);
if (!sessionMatch) {
  console.log('LOGIN FAILED: no isolated_session cookie in response');
  process.exit(1);
}
const sessionToken = sessionMatch[1];
const cookieHeader = `isolated_session=${sessionToken}`;

// ── Step 2: Fetch questions ──────────────────────────────────────────────────

const questionsRes = await fetch('http://localhost:5000/api/quizzes/51/questions', {
  headers: { Cookie: cookieHeader }
});

if (questionsRes.status !== 200) {
  const body = await questionsRes.text();
  console.log(`QUESTIONS FETCH FAILED: ${questionsRes.status} ${body}`);
  process.exit(1);
}

const questionsData = await questionsRes.json() as {
  quizId: number;
  questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number; category: string; difficulty: string }>;
};
const questions = questionsData.questions;

// ── Step 3: Integrity checks ─────────────────────────────────────────────────

const deliveredCount = questions.length;
const uniqueIds = new Set(questions.map(q => q.id));
const uniqueCount = uniqueIds.size;
const with4Options = questions.filter(q => Array.isArray(q.options) && q.options.length === 4).length;
const first3Ids = questions.slice(0, 3).map(q => q.id).join(', ');
const categoriesPresent = [...new Set(questions.map(q => q.category))].join(', ');

console.log(`delivered_count            : ${deliveredCount}`);
console.log(`unique_question_ids        : ${uniqueCount}`);
console.log(`questions_with_4_options   : ${with4Options}`);
console.log(`id_format                  : ${first3Ids}`);
console.log(`categories_present         : ${categoriesPresent}`);

// ── Step 4: Resolve correct answers ─────────────────────────────────────────

import { getActiveQuestions } from '../server/quiz-bank';
import type { BankQuestion } from '../server/quiz-bank';

const allBankQuestions = await getActiveQuestions();
const bankMap = new Map<string, BankQuestion>();
for (const q of allBankQuestions) {
  bankMap.set(q.id, q);
}

let resolvedCount = 0;
for (const q of questions) {
  const banked = bankMap.get(q.id);
  if (!banked) {
    console.log(`UNRESOLVED: ${q.id}`);
    process.exit(1);
  }
  resolvedCount++;
}
console.log(`resolved_count             : ${resolvedCount}`);

// Compare option order element-by-element
let optionMatchCount = 0;
let firstMismatchId: string | null = null;
let firstMismatchDelivered: string[] | null = null;
let firstMismatchBank: string[] | null = null;

for (const q of questions) {
  const banked = bankMap.get(q.id)!;
  const match = q.options.length === banked.options.length &&
    q.options.every((opt, i) => opt === banked.options[i]);
  if (match) {
    optionMatchCount++;
  } else if (firstMismatchId === null) {
    firstMismatchId = q.id;
    firstMismatchDelivered = q.options;
    firstMismatchBank = banked.options;
  }
}

console.log(`option_order_matches       : ${optionMatchCount} of ${questions.length}`);

if (optionMatchCount !== questions.length) {
  console.log(`First mismatch id: ${firstMismatchId}`);
  console.log(`  delivered options: ${JSON.stringify(firstMismatchDelivered)}`);
  console.log(`  bank options:      ${JSON.stringify(firstMismatchBank)}`);
  process.exit(1);
}

// ── Step 5: Four submissions ──────────────────────────────────────────────────

function buildAnswers(
  questions: Array<{ id: string; options: string[]; correctAnswer: number }>,
  bankMap: Map<string, BankQuestion>,
  correctIndices: Set<number>
) {
  return questions.map((q, i) => {
    const banked = bankMap.get(q.id)!;
    const correct = banked.correctAnswer;
    const answeredOption = correctIndices.has(i)
      ? correct
      : (correct + 1) % 4;
    return { questionId: q.id, answeredOption };
  });
}

const runs: Array<{
  label: string;
  intendedCorrect: number;
  expectedPct: number;
  correctIndices: Set<number>;
}> = [
  { label: 'A', intendedCorrect: 25, expectedPct: 100, correctIndices: new Set(Array.from({ length: 25 }, (_, i) => i)) },
  { label: 'B', intendedCorrect: 0,  expectedPct: 0,   correctIndices: new Set() },
  { label: 'C', intendedCorrect: 5,  expectedPct: 20,  correctIndices: new Set([0, 1, 2, 3, 4]) },
  { label: 'D', intendedCorrect: 13, expectedPct: 52,  correctIndices: new Set(Array.from({ length: 13 }, (_, i) => i)) },
];

const runResults: Array<any> = [];

for (const run of runs) {
  const answers = buildAnswers(questions, bankMap, run.correctIndices);
  const submitRes = await fetch('http://localhost:5000/api/quizzes/51/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ userId: 2007, answers, squadron: '33SQN' })
  });

  const result = await submitRes.json() as {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    detailedResults: any[];
    error?: string;
  };

  const returned = result.score;
  const correctAnswersReturned = result.correctAnswers;
  const totalQuestionsReturned = result.totalQuestions;

  const pass =
    returned === run.expectedPct &&
    correctAnswersReturned === run.intendedCorrect &&
    totalQuestionsReturned === 25
      ? 'PASS'
      : 'FAIL';

  console.log(
    `RUN ${run.label} | intended ${run.intendedCorrect}/25 | expected ${run.expectedPct}% | ` +
    `returned ${returned}% | correctAnswers ${correctAnswersReturned} | totalQuestions ${totalQuestionsReturned} | ${pass}`
  );

  runResults.push({ label: run.label, result });
}

// ── Step 6: Detailed results check on RUN C ──────────────────────────────────

const runCResult = runResults.find(r => r.label === 'C')?.result;
const detailedResults = runCResult?.detailedResults ?? [];
const detailedLength = detailedResults.length;
const markedCorrectInDetails = detailedResults.filter((r: any) => r.isCorrect === true).length;
const anyNotFound = detailedResults.some((r: any) => r.questionText === 'Question not found');

console.log(`detailed_results_length     : ${detailedLength}`);
console.log(`marked_correct_in_details   : ${markedCorrectInDetails}`);
console.log(`any_question_not_found      : ${anyNotFound ? 'YES' : 'NO'}`);

// ── Step 7: Persistence check ─────────────────────────────────────────────────

const persistRows = await sql`
  SELECT id, quiz_id, score, passed,
         jsonb_array_length(answers::jsonb) AS answer_count
  FROM quiz_submissions WHERE user_id = 2007 ORDER BY id
`;
console.log('Persistence check rows:');
for (const row of persistRows) {
  console.log(JSON.stringify(row));
}

// ── Step 8: Cleanup ───────────────────────────────────────────────────────────

const deleteResult = await sql`DELETE FROM quiz_submissions WHERE user_id = 2007`;
const deletedCount = (deleteResult as any).count ?? persistRows.length;
console.log(`CLEANUP: deleted ${persistRows.length} rows`);
if (persistRows.length !== 4) {
  console.log(`CLEANUP WARNING: expected 4 deletions, got ${persistRows.length}`);
}
