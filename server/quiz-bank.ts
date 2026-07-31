import { db } from './db';
import { quizQuestions } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface BankQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fromDbRow(r: any): BankQuestion {
  const raw = [
    r.correctAnswer,
    r.incorrectOption1,
    r.incorrectOption2,
    r.incorrectOption3,
  ];
  const options = seededShuffle(raw, `qid-${r.id}`);
  let correctIndex = options.indexOf(r.correctAnswer);
  if (correctIndex < 0) correctIndex = 0;
  return {
    id: `db-${r.id}`,
    question: r.questionText,
    options,
    correctAnswer: correctIndex,
    category: r.category,
    difficulty: r.difficulty,
  };
}

// Live delivery source: active database questions only.
export async function getActiveQuestions(): Promise<BankQuestion[]> {
  const rows = await db.select().from(quizQuestions)
    .where(eq(quizQuestions.isActive, true));
  return rows.map(fromDbRow);
}

export async function getQuestionsByCategoriesDb(
  categories: string[],
  count: number
): Promise<BankQuestion[]> {
  const all = await getActiveQuestions();
  const filtered = categories?.length
    ? all.filter(q => categories.includes(q.category))
    : all;
  if (filtered.length <= count) return [...filtered];
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// Historical resolution ONLY. Existing submissions store legacy string
// ids such as "dg-1" that came from the static file. Never use this
// for delivering new quizzes.
export async function resolveQuestionById(
  id: string | number
): Promise<BankQuestion | null> {
  const key = String(id);
  if (key.startsWith('db-')) {
    const numeric = parseInt(key.slice(3), 10);
    if (Number.isNaN(numeric)) return null;
    const rows = await db.select().from(quizQuestions)
      .where(eq(quizQuestions.id, numeric));
    return rows[0] ? fromDbRow(rows[0]) : null;
  }
  const { loadmasterQuestions } = await import('@shared/quiz-questions');
  const legacy = loadmasterQuestions.find((q: any) => q.id === key);
  return legacy ? (legacy as BankQuestion) : null;
}
