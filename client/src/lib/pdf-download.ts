import jsPDF from "jspdf";

const NAVY = [15, 25, 50] as const;
const ORANGE = [249, 115, 22] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_GREY = [245, 247, 250] as const;
const MID_GREY = [200, 205, 215] as const;
const DARK_GREY = [60, 70, 85] as const;
const TEXT_DARK = [20, 30, 50] as const;
const TEXT_MED = [80, 95, 115] as const;

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 28, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 28, w, 2.5, "F");
  doc.setTextColor(...ORANGE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("LOADMworkflow", 12, 11);
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Military Loadmaster Training Platform", 12, 17);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, w - 24);
  doc.text(titleLines[0], 12, subtitle ? 23 : 26);
  if (subtitle) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 215, 230);
    const subLine = doc.splitTextToSize(subtitle, w - 24)[0];
    doc.text(subLine, 12, 29);
  }
  doc.setTextColor(...TEXT_DARK);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...MID_GREY);
  doc.rect(0, h - 10, w, 10, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_GREY);
  doc.text("UNCLASSIFIED — FOR TRAINING PURPOSES ONLY", 12, h - 3.5);
  doc.text(`Page ${pageNum} of ${totalPages}`, w - 12, h - 3.5, { align: "right" });
}

function addMetaBadge(doc: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  doc.setFillColor(...LIGHT_GREY);
  doc.setDrawColor(...MID_GREY);
  doc.roundedRect(x, y, width, 9, 1.5, 1.5, "FD");
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_MED);
  doc.text(label.toUpperCase(), x + 3, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(value, x + 3, y + 7.5);
}

function addSectionTitle(doc: jsPDF, text: string, y: number): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ORANGE);
  doc.rect(12, y, 3.5, 6, "F");
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(text, 19, y + 5);
  doc.setDrawColor(...MID_GREY);
  doc.line(19, y + 7, w - 12, y + 7);
  return y + 13;
}

function ensurePage(doc: jsPDF, y: number, needed: number, title: string, sub?: string): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - 14) {
    doc.addPage();
    addHeader(doc, title, sub);
    return 38;
  }
  return y;
}

export function downloadQuizPDF(
  quiz: {
    title: string;
    description?: string;
    questionCount?: number;
    expiresAt?: string;
    timeLimit?: number;
    passingThreshold?: number;
  },
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    category?: string;
    difficulty?: string;
  }>,
  squadron?: string
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const sub = quiz.description ? quiz.description.slice(0, 100) : undefined;

  addHeader(doc, quiz.title, sub);

  let y = 38;

  const bw = (w - 24 - 9) / 4;
  addMetaBadge(doc, "Squadron", squadron || "—", 12, y, bw);
  addMetaBadge(doc, "Questions", String(quiz.questionCount ?? questions.length), 12 + bw + 3, y, bw);
  addMetaBadge(doc, "Passing Score", `${quiz.passingThreshold ?? 70}%`, 12 + (bw + 3) * 2, y, bw);
  addMetaBadge(doc, "Time Limit", quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit", 12 + (bw + 3) * 3, y, bw);
  y += 15;

  if (quiz.expiresAt) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...TEXT_MED);
    doc.text(
      `Expires: ${new Date(quiz.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`,
      12,
      y
    );
    y += 7;
  }

  y = addSectionTitle(doc, "Questions", y);

  questions.forEach((q, idx) => {
    const qText = `${idx + 1}.  ${q.question}`;
    const qLines = doc.splitTextToSize(qText, w - 24);
    const optLineGroups = q.options.map((opt) => doc.splitTextToSize(opt, w - 40));
    const blockH =
      qLines.length * 5 +
      optLineGroups.reduce((s, l) => s + l.length * 4.5 + 3, 0) +
      14;

    y = ensurePage(doc, y, blockH, quiz.title, sub);

    if (idx > 0) {
      doc.setDrawColor(...MID_GREY);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(12, y - 4, w - 12, y - 4);
      doc.setLineDashPattern([], 0);
    }

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(qLines, 12, y);
    y += qLines.length * 5 + 1;

    if (q.category || q.difficulty) {
      const tags = [q.category, q.difficulty].filter(Boolean).join("  ·  ");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...TEXT_MED);
      doc.text(tags.toUpperCase(), 14, y);
      y += 5;
    }

    optLineGroups.forEach((lines, i) => {
      const optH = lines.length * 4.5 + 3;
      doc.setFillColor(...LIGHT_GREY);
      doc.setDrawColor(...MID_GREY);
      doc.roundedRect(14, y - 0.5, w - 28, optH, 1, 1, "FD");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ORANGE);
      doc.text(String.fromCharCode(65 + i), 19, y + lines.length * 2.2 + 0.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(8.5);
      doc.text(lines, 28, y + 3);
      y += optH + 2;
    });

    y += 5;
  });

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addFooter(doc, p, total);
  }

  doc.save(`${quiz.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
}

export function downloadModulePDF(module: {
  title: string;
  description?: string;
  aircraft?: string;
  difficulty?: string;
  duration?: string;
  topics?: string[];
  objectives?: string[];
  content?: Array<{
    title: string;
    type: string;
    duration?: string;
    description?: string;
    content?: string;
  }>;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  const aircraftMap: Record<string, string> = {
    c17: "C-17 Globemaster III",
    c130: "C-130 Hercules",
    kc30a: "KC30-A MRTT",
    c27j: "C-27J Spartan",
    all: "All Aircraft",
  };
  const aircraftStr = module.aircraft != null ? String(module.aircraft) : "";
  const aircraftLabel = aircraftStr
    ? aircraftMap[aircraftStr.toLowerCase()] ?? aircraftStr.toUpperCase()
    : "General";

  addHeader(doc, module.title, aircraftLabel);

  let y = 38;

  const bw3 = (w - 24 - 6) / 3;
  addMetaBadge(doc, "Aircraft", aircraftLabel, 12, y, bw3);
  addMetaBadge(
    doc,
    "Difficulty",
    module.difficulty ? module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1) : "—",
    12 + bw3 + 3,
    y,
    bw3
  );
  addMetaBadge(doc, "Duration", module.duration ?? "—", 12 + (bw3 + 3) * 2, y, bw3);
  y += 15;

  if (module.description) {
    const dLines = doc.splitTextToSize(module.description, w - 24);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MED);
    doc.text(dLines, 12, y);
    y += dLines.length * 5 + 4;
  }

  if (module.objectives && module.objectives.length > 0) {
    y = addSectionTitle(doc, "Learning Objectives", y);
    module.objectives.forEach((obj) => {
      const lines = doc.splitTextToSize(obj, w - 32);
      y = ensurePage(doc, y, lines.length * 5 + 4, module.title, aircraftLabel);
      doc.setFillColor(...ORANGE);
      doc.circle(16, y - 0.3, 1.2, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT_DARK);
      doc.text(lines, 21, y + 0.5);
      y += lines.length * 5 + 3;
    });
    y += 3;
  }

  if (module.topics && module.topics.length > 0) {
    y = ensurePage(doc, y, 22, module.title, aircraftLabel);
    y = addSectionTitle(doc, "Topics Covered", y);
    const colW = (w - 24 - 4) / 2;
    module.topics.forEach((topic, i) => {
      const col = i % 2;
      const tx = 12 + col * (colW + 4);
      const ty = y + Math.floor(i / 2) * 9;
      y = ensurePage(doc, ty, 9, module.title, aircraftLabel);
      doc.setFillColor(...LIGHT_GREY);
      doc.setDrawColor(...MID_GREY);
      doc.roundedRect(tx, ty - 2, colW, 7, 1, 1, "FD");
      const tl = doc.splitTextToSize(topic, colW - 7);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT_DARK);
      doc.text(tl[0], tx + 4, ty + 3.5);
    });
    y += Math.ceil(module.topics.length / 2) * 9 + 5;
  }

  if (module.content && module.content.length > 0) {
    y = ensurePage(doc, y, 22, module.title, aircraftLabel);
    y = addSectionTitle(doc, "Module Lessons", y);

    module.content.forEach((lesson, idx) => {
      const typeColors: Record<string, readonly [number, number, number]> = {
        video: [30, 90, 200],
        reading: [20, 130, 80],
        quiz: [180, 90, 0],
        assessment: [130, 30, 150],
      };
      const typeLabel =
        { video: "VIDEO", reading: "READING", quiz: "QUIZ", assessment: "ASSESSMENT" }[lesson.type] ??
        lesson.type.toUpperCase();
      const typeColor = typeColors[lesson.type] ?? ([80, 80, 80] as const);

      const descLines = lesson.description ? doc.splitTextToSize(lesson.description, w - 28) : [];
      const blockH = 12 + (lesson.duration ? 5 : 0) + descLines.length * 4.5 + 4;
      y = ensurePage(doc, y, blockH, module.title, aircraftLabel);

      doc.setFillColor(...NAVY);
      doc.roundedRect(12, y - 2, w - 24, 8, 1.5, 1.5, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(`${idx + 1}.  ${lesson.title}`, 16, y + 3.8);

      const typeW = doc.getTextWidth(typeLabel) + 7;
      doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
      doc.roundedRect(w - 12 - typeW, y - 0.5, typeW, 5.5, 1, 1, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(typeLabel, w - 12 - typeW + 3.5, y + 3.3);
      y += 10;

      if (lesson.duration) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...TEXT_MED);
        doc.text(`Estimated time: ${lesson.duration}`, 14, y);
        y += 5;
      }

      if (descLines.length > 0) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT_MED);
        doc.text(descLines, 14, y);
        y += descLines.length * 4.5 + 2;
      }

      y += 5;
    });
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addFooter(doc, p, total);
  }

  doc.save(`${module.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
}

export function downloadScenariosPDF(
  scenarios: Array<{
    title: string;
    description?: string;
    numberOfQuestions?: number;
    passingThreshold?: number;
  }>,
  quizzes: Array<{
    title: string;
    description?: string;
    questionCount?: number;
    passingThreshold?: number;
    expiresAt?: string;
  }>
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const mainTitle = "Training Assessments & Quizzes";
  const mainSub = "Complete reference for all available assessments";

  addHeader(doc, mainTitle, mainSub);

  let y = 40;

  if (scenarios && scenarios.length > 0) {
    y = addSectionTitle(doc, `Training Scenarios  (${scenarios.length})`, y);

    scenarios.forEach((sc, idx) => {
      const descLines = sc.description ? doc.splitTextToSize(sc.description, w - 30) : [];
      const blockH = 10 + descLines.length * 4.5 + 8;
      y = ensurePage(doc, y, blockH, mainTitle, mainSub);

      doc.setFillColor(idx % 2 === 0 ? 248 : 253, idx % 2 === 0 ? 250 : 253, idx % 2 === 0 ? 252 : 255);
      doc.setDrawColor(...MID_GREY);
      doc.roundedRect(12, y - 3, w - 24, blockH - 2, 1.5, 1.5, "FD");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(sc.title, 17, y + 3.5);

      const qLabel = `${sc.numberOfQuestions ?? "?"} questions`;
      const pLabel = `Pass: ${sc.passingThreshold ?? 70}%`;
      const qW = doc.getTextWidth(qLabel) + 8;
      const pW = doc.getTextWidth(pLabel) + 8;

      doc.setFillColor(...NAVY);
      doc.roundedRect(w - 14 - qW - pW - 3, y - 1.5, qW, 6, 1, 1, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(qLabel, w - 14 - qW - pW - 3 + 4, y + 3);

      doc.setFillColor(...ORANGE);
      doc.roundedRect(w - 14 - pW, y - 1.5, pW, 6, 1, 1, "F");
      doc.text(pLabel, w - 14 - pW + 4, y + 3);

      y += 8;

      if (descLines.length > 0) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT_MED);
        doc.text(descLines, 17, y);
        y += descLines.length * 4.5 + 2;
      }

      y += 6;
    });
    y += 2;
  }

  if (quizzes && quizzes.length > 0) {
    y = ensurePage(doc, y, 20, mainTitle, mainSub);
    y = addSectionTitle(doc, `Pop Quizzes  (${quizzes.length})`, y);

    quizzes.forEach((qz, idx) => {
      const descLines = qz.description ? doc.splitTextToSize(qz.description, w - 30) : [];
      const blockH = 10 + descLines.length * 4.5 + (qz.expiresAt ? 5 : 0) + 8;
      y = ensurePage(doc, y, blockH, mainTitle, mainSub);

      doc.setFillColor(idx % 2 === 0 ? 248 : 253, idx % 2 === 0 ? 250 : 253, idx % 2 === 0 ? 252 : 255);
      doc.setDrawColor(...MID_GREY);
      doc.roundedRect(12, y - 3, w - 24, blockH - 2, 1.5, 1.5, "FD");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(qz.title, 17, y + 3.5);

      const qLabel = `${qz.questionCount ?? "?"} questions`;
      const pLabel = `Pass: ${qz.passingThreshold ?? 70}%`;
      const qW = doc.getTextWidth(qLabel) + 8;
      const pW = doc.getTextWidth(pLabel) + 8;

      doc.setFillColor(...NAVY);
      doc.roundedRect(w - 14 - qW - pW - 3, y - 1.5, qW, 6, 1, 1, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(qLabel, w - 14 - qW - pW - 3 + 4, y + 3);

      doc.setFillColor(...ORANGE);
      doc.roundedRect(w - 14 - pW, y - 1.5, pW, 6, 1, 1, "F");
      doc.text(pLabel, w - 14 - pW + 4, y + 3);

      y += 8;

      if (descLines.length > 0) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT_MED);
        doc.text(descLines, 17, y);
        y += descLines.length * 4.5 + 2;
      }

      if (qz.expiresAt) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(190, 70, 30);
        doc.text(`Expires: ${new Date(qz.expiresAt).toLocaleDateString("en-AU")}`, 17, y);
        y += 5;
      }

      y += 6;
    });
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addFooter(doc, p, total);
  }

  doc.save("training_assessments_reference.pdf");
}

export function downloadScenarioPDF(
  scenario: {
    title: string;
    description?: string | null;
    numberOfQuestions?: number | null;
    passingThreshold?: number | null;
  },
  questions: Array<{
    id: string;
    question: string;
    questionType: "multiple-choice" | "free-text";
    options?: string[];
    correctAnswer?: string;
  }>
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const sub = scenario.description ? scenario.description.slice(0, 100) : undefined;

  addHeader(doc, scenario.title, sub);

  let y = 38;

  const bw2 = (w - 24 - 3) / 2;
  addMetaBadge(doc, "Questions", String(scenario.numberOfQuestions ?? questions.length), 12, y, bw2);
  addMetaBadge(doc, "Passing Score", `${scenario.passingThreshold ?? 70}%`, 12 + bw2 + 3, y, bw2);
  y += 15;

  y = addSectionTitle(doc, "Assessment Questions", y);

  questions.forEach((q, idx) => {
    const isChoice = q.questionType === "multiple-choice" && q.options && q.options.length > 0;
    const qText = `${idx + 1}.  ${q.question}`;
    const qLines = doc.splitTextToSize(qText, w - 24);

    const optLineGroups = isChoice
      ? q.options!.map((opt) => doc.splitTextToSize(opt, w - 40))
      : [];
    const freeTextH = isChoice ? 0 : 22;
    const blockH =
      qLines.length * 5 +
      optLineGroups.reduce((s, l) => s + l.length * 4.5 + 3, 0) +
      freeTextH +
      14;

    y = ensurePage(doc, y, blockH, scenario.title, sub);

    if (idx > 0) {
      doc.setDrawColor(...MID_GREY);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(12, y - 4, w - 12, y - 4);
      doc.setLineDashPattern([], 0);
    }

    const typeLabel = isChoice ? "MULTIPLE CHOICE" : "FREE TEXT";
    const typeColor = isChoice ? NAVY : ([60, 140, 80] as const);
    const typeW = doc.getTextWidth(typeLabel) + 7;
    doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
    doc.roundedRect(w - 12 - typeW, y - 3.5, typeW, 5.5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(typeLabel, w - 12 - typeW + 3.5, y + 0.5);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(qLines, 12, y);
    y += qLines.length * 5 + 2;

    if (isChoice) {
      optLineGroups.forEach((lines, i) => {
        const optH = lines.length * 4.5 + 3;
        doc.setFillColor(...LIGHT_GREY);
        doc.setDrawColor(...MID_GREY);
        doc.roundedRect(14, y - 0.5, w - 28, optH, 1, 1, "FD");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...ORANGE);
        doc.text(String.fromCharCode(65 + i), 19, y + lines.length * 2.2 + 0.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT_DARK);
        doc.setFontSize(8.5);
        doc.text(lines, 28, y + 3);
        y += optH + 2;
      });
    } else {
      doc.setFillColor(250, 251, 252);
      doc.setDrawColor(...MID_GREY);
      doc.roundedRect(14, y, w - 28, 18, 1.5, 1.5, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(180, 185, 195);
      doc.text("Write your answer here...", 18, y + 6);
      y += 22;
    }

    y += 5;
  });

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addFooter(doc, p, total);
  }

  doc.save(`${scenario.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
}
