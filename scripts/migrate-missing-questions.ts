// Migrate static quiz questions that are missing from the database
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const { loadmasterQuestions } = await import('../shared/quiz-questions');

const sql = neon(process.env.DATABASE_URL!);
const dbRows = await sql`SELECT question_text FROM quiz_questions` as any[];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const dbTexts = new Set(dbRows.map((r: any) => norm(r.question_text)));

const missing = loadmasterQuestions.filter(q => !dbTexts.has(norm(q.question)));

let inserted = 0;
let skippedWrongOptionCount = 0;

for (const q of missing) {
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    console.log(`SKIP id=${q.id} option_count=${q.options?.length ?? 0}`);
    skippedWrongOptionCount++;
    continue;
  }

  const correctAnswer = q.options[q.correctAnswer];
  const incorrects = q.options.filter((_: string, i: number) => i !== q.correctAnswer);

  await sql`
    INSERT INTO quiz_questions (
      category, question_text, correct_answer,
      incorrect_option_1, incorrect_option_2, incorrect_option_3,
      difficulty, created_by_id, is_active
    ) VALUES (
      ${q.category}, ${q.question}, ${correctAnswer},
      ${incorrects[0]}, ${incorrects[1]}, ${incorrects[2]},
      ${q.difficulty}, ${9}, ${true}
    )
  `;
  inserted++;
}

console.log(`missing_found: ${missing.length}`);
console.log(`inserted: ${inserted}`);
console.log(`skipped_wrong_option_count: ${skippedWrongOptionCount}`);
