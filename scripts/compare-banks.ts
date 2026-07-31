// Throwaway script: compare static quiz bank vs DB quiz bank
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const { loadmasterQuestions } = await import('../shared/quiz-questions');

const sql = neon(process.env.DATABASE_URL!);
const dbRows = await sql`SELECT question_text FROM quiz_questions` as any[];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const staticTexts = new Set(loadmasterQuestions.map(q => norm(q.question)));
const dbTexts    = new Set(dbRows.map((r: any) => norm(r.question_text)));

let exactMatches = 0;
for (const t of dbTexts) {
  if (staticTexts.has(t)) exactMatches++;
}

const dbOnly = dbTexts.size - exactMatches;

console.log(`static_count: ${staticTexts.size}`);
console.log(`db_count: ${dbTexts.size}`);
console.log(`exact_text_matches: ${exactMatches}`);
console.log(`db_only: ${dbOnly}`);
