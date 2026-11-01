import { describe, expect, it } from "vitest";
import { gradeAnswers, scoreFor } from "../services/quiz-service";
import { gradeReview } from "../services/scenario-service";
import { gradeModuleAssessment } from "../services/training-service";
import type { QuizQuestion, Scenario } from "@shared/schema";

const q = (id: number, correctIndex: number): QuizQuestion => ({
  id,
  category: "dangerous-goods",
  questionText: `Q${id}`,
  options: ["a", "b", "c", "d"],
  correctIndex,
  explanation: null,
  difficulty: "medium",
  isActive: true,
  createdById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("quiz grading", () => {
  const questions = [q(1, 0), q(2, 1), q(3, 2)];

  it("grades by question id, not by position", () => {
    const graded = gradeAnswers(questions, [
      { questionId: 3, answeredIndex: 2 },
      { questionId: 1, answeredIndex: 0 },
      { questionId: 2, answeredIndex: 3 },
    ]);
    expect(graded.results.map((r) => r.correct)).toEqual([true, false, true]);
    expect(graded.correctCount).toBe(2);
  });

  it("treats missing answers as wrong and ignores unknown ids", () => {
    const graded = gradeAnswers(questions, [{ questionId: 99, answeredIndex: 0 }]);
    expect(graded.correctCount).toBe(0);
    expect(graded.results.every((r) => r.answeredIndex === -1)).toBe(true);
  });

  it("rounds the percentage score", () => {
    expect(scoreFor(2, 3)).toBe(67);
    expect(scoreFor(0, 0)).toBe(0);
  });
});

describe("scenario review grading", () => {
  const scenario = {
    id: 1,
    passingThreshold: 75,
    questions: [
      { id: "q1", question: "", questionType: "free-text", options: [], correctAnswer: "" },
      { id: "q2", question: "", questionType: "free-text", options: [], correctAnswer: "" },
      { id: "q3", question: "", questionType: "free-text", options: [], correctAnswer: "" },
      { id: "q4", question: "", questionType: "free-text", options: [], correctAnswer: "" },
    ],
  } as unknown as Scenario;

  it("applies the scenario's own pass mark", () => {
    const r = gradeReview(scenario, { q1: true, q2: true, q3: true });
    expect(r.score).toBe(75);
    expect(r.passed).toBe(true);
    expect(r.markedAnswers).toEqual({ q1: true, q2: true, q3: true, q4: false });
  });

  it("fails below the pass mark", () => {
    expect(gradeReview(scenario, { q1: true, q2: true }).passed).toBe(false);
  });
});

describe("module assessment grading", () => {
  it("grades a record of answers", () => {
    const g = gradeModuleAssessment(
      [
        { id: "a", question: "", options: ["x", "y"], correctIndex: 1 },
        { id: "b", question: "", options: ["x", "y"], correctIndex: 0 },
      ],
      { a: 1, zzz: 0 },
    );
    expect(g.correctCount).toBe(1);
    expect(g.totalQuestions).toBe(2);
  });
});
