import { sql } from "drizzle-orm";
import type { Tx } from "../db";
import {
  users, quizQuestions, quizzes, quizAttempts, quizSubmissions, scenarios, scenarioSubmissions,
  trainingModules, trainingModuleContent, trainingModuleCompletions, checklists, checklistItems,
  checklistCompletions, documents, documentSubmissions, phoneDirectory, userQualifications,
  flightRecords, safetyRecords, missions, chatMessages, readinessSnapshots, activityLog,
  type User, type QuizQuestion, type ScenarioQuestion,
} from "@shared/schema";
import {
  FLYING_SQUADRONS, STANDARD_QUALIFICATION_TYPES, NOT_READY_REASONS, THRESHOLDS, SQUADRON_AIRCRAFT,
  isPassing, type Squadron, type FlyingSquadron, type AircraftType,
} from "@shared/constants";
import { Rng, daysAgo, daysFromNow } from "./rng";
import { buildPeople } from "./people";
import { QUESTION_BANK } from "./question-bank";
import { MODULES } from "./modules";
import { QUIZZES, SCENARIOS, CHECKLISTS, DOCUMENTS, DIRECTORY, moduleCategory, readingFor, moduleQuizFor } from "./content";
import { computeReadinessForDate } from "../services/readiness-service";

/**
 * Squadron "personality" drives the analytics texture: 33 is strong, 35 is
 * under pressure, 36 is large and average, 37 is improving.
 */
const SQN_PROFILE: Record<FlyingSquadron, { skill: number; activity: number; safety: number; readyRate: number }> = {
  "33SQN": { skill: 82, activity: 1.2, safety: 0.6, readyRate: 0.92 },
  "35SQN": { skill: 68, activity: 0.8, safety: 1.6, readyRate: 0.74 },
  "36SQN": { skill: 75, activity: 1.0, safety: 1.0, readyRate: 0.85 },
  "37SQN": { skill: 73, activity: 1.1, safety: 0.9, readyRate: 0.88 },
};

const ROUTES: Array<[string, string]> = [
  ["YAMB", "YBTL"], ["YAMB", "YPDN"], ["YSRI", "YAMB"], ["YSRI", "YPED"], ["YBTL", "YPTN"],
  ["YAMB", "WSSS"], ["YPDN", "PGUA"], ["YSRI", "YBAS"], ["YAMB", "PHIK"], ["YPEA", "YSRI"],
];
const CAPTAINS = ["SQNLDR Price", "FLTLT Hammond", "FLTLT Nakamura", "SQNLDR Bennett", "FLTLT O'Connor", "FLTLT Dwyer", "SQNLDR Lim"];

export interface SeedSummary {
  users: number;
  questions: number;
  quizzes: number;
  scenarios: number;
  modules: number;
  checklists: number;
  submissions: number;
  flightRecords: number;
  snapshots: number;
}

/** Truncate everything, then rebuild. Must run inside a transaction. */
export async function runSeed(tx: Tx): Promise<SeedSummary> {
  const rng = new Rng();

  await tx.execute(sql`
    TRUNCATE TABLE
      showcase.activity_log, showcase.chat_messages, showcase.readiness_snapshots, showcase.safety_records, showcase.flight_records, showcase.user_qualifications, showcase.mission_documents, showcase.missions, showcase.checklist_step_audit, showcase.checklist_completions, showcase.checklist_items, showcase.checklists, showcase.training_module_completions, showcase.training_module_content, showcase.training_modules, showcase.quiz_submissions, showcase.quiz_attempts, showcase.quizzes, showcase.quiz_questions, showcase.scenario_submissions, showcase.scenarios, showcase.document_submissions, showcase.documents, showcase.phone_directory, showcase.users
    RESTART IDENTITY CASCADE
  `);

  // ---- People ------------------------------------------------------------
  const people = buildPeople(rng);
  const userRows = await tx
    .insert(users)
    .values(
      people.map((p) => ({
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        rank: p.rank,
        role: p.role,
        squadron: p.squadron,
        category: p.category,
        isActive: p.isActive ?? true,
        isDemoPersona: p.isDemoPersona ?? false,
        lastActiveAt: daysAgo(rng.int(0, 20)),
        createdAt: daysAgo(rng.int(200, 900)),
      })),
    )
    .returning();
  const byKey = new Map<string, User>();
  people.forEach((p, i) => byKey.set(p.key, userRows[i]));
  const persona = (k: "student" | "loadmaster" | "instructor" | "command") => byKey.get(k)!;
  const instructors = userRows.filter((u) => u.role === "instructor");
  const aircrew = userRows.filter((u) => (u.role === "student" || u.role === "loadmaster") && u.squadron !== "AMG");
  const profile = (u: User) => SQN_PROFILE[u.squadron as FlyingSquadron];

  // Readiness flags
  for (const u of aircrew) {
    if (!u.isActive) continue;
    if (!rng.chance(profile(u).readyRate)) {
      await tx
        .update(users)
        .set({ isFlightReady: false, notReadyReason: rng.pick(NOT_READY_REASONS), readinessUpdatedAt: daysAgo(rng.int(1, 30)) })
        .where(sql`${users.id} = ${u.id}`);
      u.isFlightReady = false;
    }
  }

  // ---- Question bank -----------------------------------------------------
  const questionRows = await tx
    .insert(quizQuestions)
    .values(
      QUESTION_BANK.map((q) => ({
        category: q.category,
        questionText: q.question,
        options: q.options,
        correctIndex: q.correctAnswer,
        difficulty: q.difficulty,
        createdById: persona("instructor").id,
        createdAt: daysAgo(rng.int(120, 400)),
      })),
    )
    .returning();
  const bankByCategory = new Map<string, QuizQuestion[]>();
  for (const q of questionRows) bankByCategory.set(q.category, [...(bankByCategory.get(q.category) ?? []), q]);

  // ---- Quizzes -----------------------------------------------------------
  const quizRows = await tx
    .insert(quizzes)
    .values(
      QUIZZES.map((q, i) => ({
        ...q,
        description: q.description ?? "",
        createdById: i % 2 === 0 ? persona("instructor").id : rng.pick(instructors).id,
        createdAt: daysAgo(rng.int(90, 300)),
      })),
    )
    .returning();

  // ---- Scenarios ---------------------------------------------------------
  const scenarioRows = await tx
    .insert(scenarios)
    .values(
      SCENARIOS.map((s) => ({
        ...s,
        questions: s.questions as ScenarioQuestion[],
        createdById: rng.pick(instructors).id,
        createdAt: daysAgo(rng.int(60, 300)),
      })),
    )
    .returning();

  // ---- Training modules + content ----------------------------------------
  const moduleRows = await tx
    .insert(trainingModules)
    .values(
      MODULES.map((m) => ({
        title: m.title,
        description: m.description,
        aircraft: m.aircraft,
        difficulty: m.difficulty,
        durationMinutes: m.durationMinutes,
        topics: m.topics,
        objectives: m.objectives,
        passingThreshold: m.difficulty === "expert" ? 80 : null,
        createdById: persona("instructor").id,
        createdAt: daysAgo(rng.int(150, 400)),
      })),
    )
    .returning();
  for (let i = 0; i < moduleRows.length; i++) {
    const m = moduleRows[i];
    const seed = MODULES[i];
    const cat = moduleCategory(seed);
    const bank = rng.sample(bankByCategory.get(cat) ?? questionRows, 5);
    await tx.insert(trainingModuleContent).values([
      { moduleId: m.id, title: `${seed.title}: Reading`, type: "reading", durationMinutes: Math.round(seed.durationMinutes * 0.7), description: "Core reading for this module.", body: readingFor(seed), orderIndex: 1 },
      { moduleId: m.id, title: `${seed.title}: Assessment`, type: "assessment", durationMinutes: Math.round(seed.durationMinutes * 0.3), description: "End-of-module assessment. Pass mark applies.", questions: moduleQuizFor(bank), orderIndex: 2 },
    ]);
  }

  // ---- Checklists --------------------------------------------------------
  const checklistRows = [];
  for (const c of CHECKLISTS) {
    const { items, ...rest } = c;
    const [row] = await tx.insert(checklists).values({ ...rest, createdById: rng.pick(instructors).id }).returning();
    await tx.insert(checklistItems).values(
      items.map((it, idx) => ({ checklistId: row.id, itemText: it.itemText, itemOrder: idx + 1, isRequired: it.isRequired ?? true, section: it.section ?? null })),
    );
    checklistRows.push({ row, itemCount: items.length });
  }

  // ---- Documents, directory ---------------------------------------------
  const documentRows = await tx
    .insert(documents)
    .values(DOCUMENTS.map((d) => ({ ...d, createdById: persona("instructor").id })))
    .returning();
  await tx.insert(phoneDirectory).values(DIRECTORY);

  // ---- Qualifications ----------------------------------------------------
  const qualRows: { userId: number; expiryDate: Date | null }[] = [];
  for (const u of aircrew) {
    const typeRating = `${SQUADRON_AIRCRAFT[u.squadron as Squadron]} Type Rating`;
    const quals: { name: string; start: number; expiry: number | null }[] = [
      { name: "Basic Loadmaster Certification", start: rng.int(400, 2000), expiry: null },
      { name: typeRating, start: rng.int(200, 1500), expiry: rng.int(-20, 540) },
      { name: "Dangerous Goods (DG) Handling", start: rng.int(100, 700), expiry: rng.int(-30, 400) },
      { name: "Annual Proficiency Check", start: rng.int(30, 365), expiry: rng.int(-15, 350) },
    ];
    if (u.role === "loadmaster") {
      quals.push({ name: "Night Operations Currency", start: rng.int(30, 300), expiry: rng.int(-10, 180) });
      if (u.squadron === "33SQN") quals.push({ name: "Air-to-Air Refueling (AAR)", start: rng.int(60, 600), expiry: rng.int(0, 500) });
      if (rng.chance(0.4)) quals.push({ name: "Aeromedical Evacuation", start: rng.int(60, 600), expiry: rng.int(0, 500) });
      if (rng.chance(0.5)) quals.push({ name: "Combat Readiness", start: rng.int(60, 600), expiry: rng.int(0, 400) });
    }
    // Struggling squadrons let more lapse.
    const lapseBias = profile(u).readyRate < 0.8 ? -40 : 0;
    const values = quals.map((q) => ({
      userId: u.id,
      name: q.name,
      startDate: daysAgo(q.start),
      expiryDate: q.expiry === null ? null : daysFromNow(q.expiry + lapseBias),
    }));
    const inserted = await tx.insert(userQualifications).values(values).returning();
    qualRows.push(...inserted.map((r) => ({ userId: r.userId, expiryDate: r.expiryDate })));
  }
  void STANDARD_QUALIFICATION_TYPES;

  // ---- Flight records ----------------------------------------------------
  let flightCount = 0;
  for (const u of aircrew) {
    const sorties = Math.round((u.role === "loadmaster" ? rng.int(18, 40) : rng.int(4, 12)) * profile(u).activity);
    const aircraft = SQUADRON_AIRCRAFT[u.squadron as Squadron] as AircraftType;
    const rows = [];
    for (let i = 0; i < sorties; i++) {
      const [dep, arr] = rng.pick(ROUTES);
      const total = aircraft === "KC30A" ? rng.float(3, 9) : aircraft === "C17" ? rng.float(2, 8) : rng.float(1, 4.5);
      const night = rng.chance(0.35) ? rng.float(0.5, total * 0.6) : 0;
      rows.push({
        userId: u.id,
        date: daysAgo(rng.int(0, 365), rng.int(5, 20)),
        aircraft,
        callsign: `${rng.pick(["ASY", "DRGN", "TROJ", "WOLF"])}${rng.int(100, 999)}`,
        departure: rng.chance(0.5) ? dep : arr,
        arrival: rng.chance(0.5) ? arr : dep,
        captain: rng.pick(CAPTAINS),
        passengersCarried: aircraft === "KC30A" ? rng.int(0, 260) : rng.int(0, 60),
        cargoWeightKg: aircraft === "C17" ? rng.int(5000, 60000) : aircraft === "KC30A" ? rng.int(0, 30000) : rng.int(500, 15000),
        dayHours: Number((total - night).toFixed(1)),
        nightHours: night,
      });
    }
    if (rows.length) {
      await tx.insert(flightRecords).values(rows);
      flightCount += rows.length;
    }
  }

  // ---- Quiz attempts + submissions --------------------------------------
  let submissionCount = 0;
  for (const u of aircrew) {
    const attempts = Math.round(rng.int(3, 9) * profile(u).activity);
    for (let i = 0; i < attempts; i++) {
      const quiz = rng.pick(quizRows);
      const pool = quiz.categories.flatMap((c) => bankByCategory.get(c) ?? []);
      const drawn = rng.sample(pool, Math.min(quiz.questionCount, pool.length));
      const when = daysAgo(rng.int(0, 180), rng.int(7, 21));
      const [attempt] = await tx
        .insert(quizAttempts)
        .values({ quizId: quiz.id, userId: u.id, questionIds: drawn.map((q) => q.id), startedAt: when, submittedAt: when })
        .returning();
      const ability = rng.gauss(profile(u).skill + (u.role === "loadmaster" ? 6 : -4), 12, 30, 99) / 100;
      const answers = drawn.map((q) => ({
        questionId: q.id,
        answeredIndex: rng.chance(ability) ? q.correctIndex : (q.correctIndex + rng.int(1, q.options.length - 1)) % q.options.length,
      }));
      const correct = answers.filter((a, idx) => a.answeredIndex === drawn[idx].correctIndex).length;
      const score = Math.round((correct / drawn.length) * 100);
      await tx.insert(quizSubmissions).values({
        attemptId: attempt.id,
        quizId: quiz.id,
        userId: u.id,
        squadron: u.squadron,
        submittedAt: when,
        answers,
        correctCount: correct,
        totalQuestions: drawn.length,
        score,
        passed: isPassing(score, quiz),
        timeSpentSeconds: rng.int(240, (quiz.timeLimitMinutes ?? 30) * 60),
      });
      submissionCount++;
    }
  }

  // ---- Scenario submissions ---------------------------------------------
  for (const u of aircrew) {
    const n = Math.round(rng.int(1, 4) * profile(u).activity);
    for (let i = 0; i < n; i++) {
      const sc = rng.pick(scenarioRows);
      const when = daysAgo(rng.int(0, 180), rng.int(7, 21));
      const ability = rng.gauss(profile(u).skill, 14, 25, 98) / 100;
      const marked: Record<string, boolean> = {};
      const answers = sc.questions.map((q) => {
        const right = rng.chance(ability);
        marked[q.id] = right;
        return {
          questionId: q.id,
          answer: q.questionType === "multiple-choice" ? (right ? q.correctAnswer : rng.pick(q.options.filter((o) => o !== q.correctAnswer))) : right ? q.correctAnswer : "Partial answer; key point missed.",
        };
      });
      const reviewed = rng.chance(0.78) || (daysAgo(0).getTime() - when.getTime()) / 86_400_000 > 14;
      const correct = Object.values(marked).filter(Boolean).length;
      const score = Math.round((correct / sc.questions.length) * 100);
      await tx.insert(scenarioSubmissions).values({
        scenarioId: sc.id,
        userId: u.id,
        squadron: u.squadron,
        submissionType: rng.chance(0.3) ? "training" : "assessment",
        submittedAt: when,
        answers,
        timeSpentSeconds: rng.int(600, 2400),
        status: reviewed ? "reviewed" : "submitted",
        ...(reviewed
          ? {
              score,
              passed: isPassing(score, sc),
              markedAnswers: marked,
              instructorFeedback: score >= 85 ? "Strong, well-reasoned answers. Ready for the next level." : score >= 60 ? "Sound fundamentals; revisit restraint factors and DG segregation." : "Below standard. Re-attempt after reviewing the module reading.",
              reviewedById: rng.pick(instructors).id,
              reviewedAt: new Date(when.getTime() + rng.int(1, 5) * 86_400_000),
              notificationSeen: rng.chance(0.7),
            }
          : {}),
      });
      submissionCount++;
    }
  }

  // ---- Module completions ------------------------------------------------
  for (const u of aircrew) {
    const done = rng.sample(moduleRows, Math.round(rng.int(2, 8) * profile(u).activity));
    for (const m of done) {
      const total = 5;
      const ability = rng.gauss(profile(u).skill, 12, 30, 99) / 100;
      const correct = Array.from({ length: total }).filter(() => rng.chance(ability)).length;
      const score = Math.round((correct / total) * 100);
      await tx.insert(trainingModuleCompletions).values({
        moduleId: m.id,
        userId: u.id,
        squadron: u.squadron,
        score,
        passed: isPassing(score, m),
        correctCount: correct,
        totalQuestions: total,
        answers: {},
        submittedAt: daysAgo(rng.int(0, 150)),
      });
    }
  }

  // ---- Checklist completions --------------------------------------------
  for (const u of aircrew.filter((a) => a.role === "loadmaster")) {
    for (const { row, itemCount } of rng.sample(checklistRows, rng.int(1, 3))) {
      const complete = rng.chance(0.7);
      const itemIds = await tx.select({ id: checklistItems.id }).from(checklistItems).where(sql`${checklistItems.checklistId} = ${row.id}`);
      const ids = itemIds.map((r) => r.id).slice(0, complete ? itemCount : rng.int(1, itemCount - 1));
      await tx.insert(checklistCompletions).values({
        checklistId: row.id,
        userId: u.id,
        completedItemIds: ids,
        isComplete: complete,
        startedAt: daysAgo(rng.int(1, 60)),
        completedAt: complete ? daysAgo(rng.int(0, 59)) : null,
      });
    }
  }

  // ---- Document submissions ---------------------------------------------
  for (const u of aircrew.filter((a) => a.role === "loadmaster")) {
    for (let i = 0; i < rng.int(1, 4); i++) {
      const d = rng.pick(documentRows);
      const [dep, arr] = rng.pick(ROUTES);
      await tx.insert(documentSubmissions).values({
        documentId: d.id,
        userId: u.id,
        submittedAt: daysAgo(rng.int(0, 120)),
        formData: { flightNumber: `ASY${rng.int(100, 999)}`, departure: dep, arrival: arr, passengers: rng.int(0, 80), cargoWeightKg: rng.int(500, 20000), remarks: "Nil." },
      });
    }
  }

  // ---- Safety records ----------------------------------------------------
  const safetyTemplates = [
    { type: "observation", sev: null, text: "Tie-down strap found frayed during pre-load inspection; strap quarantined.", level: "Level 4 - Negligible", phase: "ground" },
    { type: "incident", sev: "minor", text: "Pallet rolled free on the K-loader during transfer; no injury, no damage.", level: "Level 3 - Marginal", phase: "ground" },
    { type: "incident", sev: "moderate", text: "Cargo shifted on landing due to incorrect restraint pattern on an irregular load.", level: "Level 2 - Critical", phase: "landing" },
    { type: "observation", sev: null, text: "DG declaration accepted with an incomplete emergency contact; corrected before departure.", level: "Level 4 - Negligible", phase: "ground" },
    { type: "commendation", sev: null, text: "Identified a mislabelled Class 8 package before loading; prevented an unsafe carriage.", level: null, phase: "ground" },
    { type: "training_failure", sev: null, text: "Failed the Dangerous Goods Refresher twice; remedial training scheduled.", level: null, phase: null },
    { type: "incident", sev: "minor", text: "Headset cable snagged on the ramp hinge during ramp-open operations.", level: "Level 3 - Marginal", phase: "cruise" },
    { type: "incident", sev: "major", text: "Vehicle exceeded the ramp load limit during loading; ramp inspected and cleared by maintenance.", level: "Level 2 - Critical", phase: "ground" },
    { type: "observation", sev: null, text: "FOD found on the cargo floor after offload; sweep procedure reinforced.", level: "Level 4 - Negligible", phase: "parking" },
    { type: "commendation", sev: null, text: "Exemplary crew coordination during a simulated cargo fire drill.", level: null, phase: null },
  ] as const;
  for (const sqn of FLYING_SQUADRONS) {
    const members = aircrew.filter((a) => a.squadron === sqn);
    const n = Math.round(8 * SQN_PROFILE[sqn].safety);
    for (let i = 0; i < n; i++) {
      const t = rng.pick(safetyTemplates);
      const subject = rng.pick(members);
      const when = daysAgo(rng.int(0, 240));
      const closed = rng.chance(0.6);
      await tx.insert(safetyRecords).values({
        userId: subject.id,
        squadron: sqn,
        recordType: t.type,
        description: t.text,
        severity: t.sev,
        date: when,
        reportedById: rng.pick(instructors).id,
        status: closed ? "closed" : rng.chance(0.5) ? "reviewed" : "open",
        resolutionNotes: closed ? "Investigated; corrective action complete and briefed to the squadron." : null,
        location: rng.pick(["RAAF Base Amberley", "RAAF Base Richmond", "RAAF Base Townsville", "En route", "Forward operating base"]),
        aircraft: SQUADRON_AIRCRAFT[sqn],
        flightPhase: t.phase,
        safetyLevel: t.level,
        immediateActions: t.type === "incident" ? "Operation stopped; area made safe; supervisor informed." : null,
        contributingFactors: t.type === "incident" ? rng.pick(["Time pressure", "Incomplete handover", "Equipment wear", "Procedure not followed"]) : null,
        correctiveActions: closed ? rng.pick(["Procedure amended", "Refresher training delivered", "Equipment replaced", "Supervisor check added"]) : null,
      });
    }
  }

  // ---- Missions for the loadmaster persona ------------------------------
  const lm = persona("loadmaster");
  const missionRows = await tx
    .insert(missions)
    .values([
      { userId: lm.id, missionName: "Op RESOLUTE resupply", aircraft: "KC30A", aircraftCallSign: "DRGN21", captainName: "SQNLDR Price", departureLocation: "YAMB", arrivalDestination: "YPDN", loadmaster1Name: "SGT S. Mackenzie", loadmaster2Name: "CPL J. Nguyen", hasDangerousGoods: true, isCompleted: true, completedAt: daysAgo(12), createdAt: daysAgo(14) },
      { userId: lm.id, missionName: "Ex TALISMAN SABRE lift 3", aircraft: "KC30A", aircraftCallSign: "DRGN34", captainName: "FLTLT Hammond", departureLocation: "YAMB", arrivalDestination: "YBTL", loadmaster1Name: "SGT S. Mackenzie", loadmaster2Name: null, hasDangerousGoods: false, isCompleted: true, completedAt: daysAgo(5), createdAt: daysAgo(7) },
      { userId: lm.id, missionName: "Pacific partner engagement", aircraft: "KC30A", aircraftCallSign: "DRGN12", captainName: "SQNLDR Lim", departureLocation: "YAMB", arrivalDestination: "PHIK", loadmaster1Name: "SGT S. Mackenzie", loadmaster2Name: "CPL A. Taylor", hasDangerousGoods: true, isCompleted: false, createdAt: daysAgo(1) },
    ])
    .returning();
  void missionRows;

  // ---- Chat ----------------------------------------------------------------
  const chat = [
    { who: aircrew[3], type: "question", text: "Can a Class 9 lithium battery shipment go on the same pallet as general stores if it's UN3481 Section II?", d: 2, h: 8 },
    { who: instructors[0], type: "answer", text: "Yes for Section II, provided the package marking is present and it's not co-loaded with Class 1 or Class 3. Keep it accessible.", d: 2, h: 9 },
    { who: aircrew[10], type: "question", text: "Is the 3.0g forward restraint still the figure for the C-17 with the new ALM revision?", d: 1, h: 14 },
    { who: persona("instructor"), type: "answer", text: "Unchanged. The revision only altered the lateral figures for vehicles over 20,000 kg.", d: 1, h: 15 },
    { who: aircrew[21], type: "question", text: "Where's the AME oxygen outlet diagram for the KC-30A?", d: 0, h: 7 },
    { who: instructors[1], type: "answer", text: "Training modules > KC30-A Mixed Operations > Reading, figure 3. I've also pinned it in the resources tab.", d: 0, h: 8 },
  ] as const;
  for (const c of chat) {
    await tx.insert(chatMessages).values({ userId: c.who.id, messageType: c.type, content: c.text, createdAt: daysAgo(c.d, c.h) });
  }

  // ---- Readiness snapshots (last 90 days) ---------------------------------
  // Computed from the data above so history and "now" agree by construction;
  // earlier days get a gentle drift so the trend line is not flat.
  const snapshotValues = [];
  const todayAll = await computeReadinessForDate(tx, daysAgo(0));
  for (let d = 90; d >= 0; d--) {
    const date = daysAgo(d, 0);
    for (const snap of d === 0 ? todayAll : await computeReadinessForDate(tx, date)) {
      const drift = d === 0 ? 0 : rng.gauss(0, 2.5, -6, 6) - d * 0.05;
      const ready = Math.max(0, Math.min(snap.totalPersonnel, Math.round(snap.readyCount + (drift * snap.totalPersonnel) / 100)));
      snapshotValues.push({
        snapshotDate: date,
        squadron: snap.squadron,
        totalPersonnel: snap.totalPersonnel,
        readyCount: ready,
        notReadyCount: snap.totalPersonnel - ready,
        readyPercent: snap.totalPersonnel ? Number(((ready / snap.totalPersonnel) * 100).toFixed(1)) : 0,
        currentQuals: snap.currentQuals,
        expiringQuals: snap.expiringQuals,
        expiredQuals: snap.expiredQuals,
        personnelAtRisk: snap.personnelAtRisk,
      });
    }
  }
  await tx.insert(readinessSnapshots).values(snapshotValues);

  await tx.insert(activityLog).values({
    userId: null,
    action: "RESET",
    resourceType: "Demo data",
    resourceName: "Seed",
    details: `Seeded ${userRows.length} users, ${questionRows.length} questions, ${submissionCount} submissions`,
  });

  void THRESHOLDS;
  return {
    users: userRows.length,
    questions: questionRows.length,
    quizzes: quizRows.length,
    scenarios: scenarioRows.length,
    modules: moduleRows.length,
    checklists: checklistRows.length,
    submissions: submissionCount,
    flightRecords: flightCount,
    snapshots: snapshotValues.length,
  };
}
