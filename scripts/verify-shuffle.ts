// Determinism check: call getActiveQuestions() twice, compare option order
import * as dotenv from 'dotenv';
dotenv.config();

const { getActiveQuestions } = await import('../server/quiz-bank');

const first  = await getActiveQuestions();
const second = await getActiveQuestions();

let allIdentical = true;
let correctAtIndex0 = 0;

for (let i = 0; i < first.length; i++) {
  const a = first[i];
  const b = second[i];
  if (JSON.stringify(a.options) !== JSON.stringify(b.options)) {
    allIdentical = false;
  }
  if (a.correctAnswer === 0) correctAtIndex0++;
}

console.log(`identical_option_order: ${allIdentical ? 'YES' : 'NO'}`);
console.log(`questions_where_correct_is_index_0: ${correctAtIndex0}`);
console.log(`total_questions: ${first.length}`);
