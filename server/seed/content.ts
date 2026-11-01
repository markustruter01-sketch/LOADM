import type { InsertQuiz, InsertScenario, InsertChecklist, InsertDocument, InsertPhoneDirectory, ModuleQuizQuestion } from "@shared/schema";
import type { SeedModule } from "./modules";
import type { QuestionCategory } from "@shared/constants";

// ---------------------------------------------------------------------------
// Quizzes (question sets are drawn from the question bank at attempt time)
// ---------------------------------------------------------------------------

export const QUIZZES: InsertQuiz[] = [
  {
    title: "Dangerous Goods Refresher",
    description: "Annual DG currency check covering classification, documentation and segregation.",
    categories: ["dangerous-goods", "regulations"],
    questionCount: 10,
    passingThreshold: 80,
    timeLimitMinutes: 20,
  },
  {
    title: "Weight & Balance Fundamentals",
    description: "Centre of gravity, moment arms and load planning arithmetic.",
    categories: ["weight-balance", "loadmaster-fundamentals"],
    questionCount: 12,
    passingThreshold: 70,
    timeLimitMinutes: 25,
  },
  {
    title: "Cargo Restraint & Securing",
    description: "Tie-down patterns, restraint factors and equipment limits.",
    categories: ["cargo-securing", "equipment-handling"],
    questionCount: 10,
    passingThreshold: 75,
    timeLimitMinutes: 20,
  },
  {
    title: "Emergency Procedures",
    description: "In-flight fire, rapid decompression, emergency egress and crew coordination.",
    categories: ["emergency-procedures", "aircraft-systems"],
    questionCount: 10,
    passingThreshold: 80,
    timeLimitMinutes: 15,
  },
  {
    title: "Loadmaster Core Competency",
    description: "Broad check across every category. Used for category upgrade boards.",
    categories: [
      "dangerous-goods", "loadmaster-fundamentals", "emergency-procedures", "weight-balance",
      "cargo-securing", "aircraft-systems", "regulations", "equipment-handling",
    ],
    questionCount: 20,
    passingThreshold: 70,
    timeLimitMinutes: 40,
  },
  {
    title: "Aircraft Systems Quick Check",
    description: "Short systems knowledge check. No time limit.",
    categories: ["aircraft-systems"],
    questionCount: 6,
    passingThreshold: 70,
    timeLimitMinutes: null,
  },
];

// ---------------------------------------------------------------------------
// Scenarios (instructor-marked)
// ---------------------------------------------------------------------------

export const SCENARIOS: InsertScenario[] = [
  {
    title: "C-17 Mixed Load: Vehicles and Palletised Cargo",
    description:
      "You are the primary loadmaster for a C-17A tasked to move two Bushmaster PMVs, four 463L pallets of general stores and 28 passengers from Amberley to Townsville. Plan the load and answer the questions.",
    aircraft: "C17",
    passingThreshold: 75,
    questions: [
      {
        id: "q1",
        question: "Which cargo should be loaded first and why?",
        questionType: "free-text",
        options: [],
        correctAnswer: "Vehicles first, driven forward to their planned positions, so palletised cargo can be rolled in behind them without blocking the ramp.",
      },
      {
        id: "q2",
        question: "The computed CG is forward of the limit. Which action is correct?",
        questionType: "multiple-choice",
        options: ["Move pallets aft", "Move the Bushmasters forward", "Add fuel to the forward tanks", "Board passengers in the forward seats"],
        correctAnswer: "Move pallets aft",
      },
      {
        id: "q3",
        question: "State the minimum restraint factor required in the forward direction for this load.",
        questionType: "free-text",
        options: [],
        correctAnswer: "3.0g forward (per the aircraft loading manual for the C-17A).",
      },
      {
        id: "q4",
        question: "One pallet is marked with a Class 3 flammable liquid label. Where may it be positioned relative to passengers?",
        questionType: "multiple-choice",
        options: ["Anywhere on the main deck", "Separated from passengers by at least one pallet position and accessible in flight", "Only on the ramp", "Not permitted with passengers aboard"],
        correctAnswer: "Separated from passengers by at least one pallet position and accessible in flight",
      },
    ],
  },
  {
    title: "KC-30A Aeromedical Evacuation Configuration",
    description:
      "A KC-30A is reconfigured for AME with six stretcher stations and a medical team. Describe the configuration decisions and answer the questions.",
    aircraft: "KC30A",
    passingThreshold: 70,
    questions: [
      {
        id: "q1",
        question: "Which stretcher stations must remain clear for in-flight access to the oxygen outlets?",
        questionType: "free-text",
        options: [],
        correctAnswer: "The stations adjacent to the overhead oxygen outlets on the left side must be kept clear; medical oxygen bottles must be restrained and accessible.",
      },
      {
        id: "q2",
        question: "How are medical oxygen cylinders classified for carriage?",
        questionType: "multiple-choice",
        options: ["Class 2.2 non-flammable gas", "Class 2.1 flammable gas", "Class 5.1 oxidiser", "Not dangerous goods when for medical use"],
        correctAnswer: "Class 2.2 non-flammable gas",
      },
      {
        id: "q3",
        question: "A patient's weight is not recorded on the manifest. What do you do?",
        questionType: "free-text",
        options: [],
        correctAnswer: "Do not depart until an actual or standard weight is confirmed and the trim sheet is updated.",
      },
    ],
  },
  {
    title: "C-130J Tactical Airdrop Preparation",
    description:
      "Prepare a C-130J for a CDS airdrop of eight A-22 containers. Answer the questions on rigging checks, release sequence and emergency procedures.",
    aircraft: "C130J",
    passingThreshold: 80,
    questions: [
      {
        id: "q1",
        question: "What is the correct order of the pre-drop checklist items for the loadmaster?",
        questionType: "free-text",
        options: [],
        correctAnswer: "Rigging inspection, restraint check, ramp and door operation check, crew brief, then the time-critical drop checks on the run-in.",
      },
      {
        id: "q2",
        question: "During the run-in a container fails to release. What is the immediate action?",
        questionType: "multiple-choice",
        options: ["Attempt manual release", "Call 'no drop', secure the load and abort the pass", "Continue the drop with the remaining containers", "Close the ramp immediately"],
        correctAnswer: "Call 'no drop', secure the load and abort the pass",
      },
      {
        id: "q3",
        question: "What is the maximum permitted CG shift during the release sequence?",
        questionType: "multiple-choice",
        options: ["Within the published airdrop CG envelope for the gross weight", "Any shift is acceptable in level flight", "No more than 2% MAC", "No more than 5% MAC"],
        correctAnswer: "Within the published airdrop CG envelope for the gross weight",
      },
      {
        id: "q4",
        question: "Name two hazards to the loadmaster during ramp-open operations and how each is mitigated.",
        questionType: "free-text",
        options: [],
        correctAnswer: "Falling from the ramp (restraint harness attached) and loose equipment/debris (secure all items, helmet and eye protection).",
      },
      {
        id: "q5",
        question: "Which document authorises the airdrop load configuration?",
        questionType: "multiple-choice",
        options: ["The crew brief", "The approved rigging/load plan signed by the loadmaster and aircraft captain", "A verbal clearance from ATC", "The DG declaration"],
        correctAnswer: "The approved rigging/load plan signed by the loadmaster and aircraft captain",
      },
    ],
  },
  {
    title: "C-27J Short-Field Resupply with Dangerous Goods",
    description:
      "A C-27J will deliver fuel drums and ammunition to a forward strip. Identify the DG segregation, documentation and loading constraints.",
    aircraft: "C27J",
    passingThreshold: 75,
    questions: [
      {
        id: "q1",
        question: "Which DG classes are present and may they be loaded together?",
        questionType: "free-text",
        options: [],
        correctAnswer: "Class 3 (fuel) and Class 1 (ammunition). They must be segregated per the compatibility table; 1.4S may be carried with Class 3 if separated.",
      },
      {
        id: "q2",
        question: "What is required before accepting the fuel drums?",
        questionType: "multiple-choice",
        options: ["Visual inspection only", "DG declaration, package inspection, correct labelling and orientation arrows", "A signed waiver from the unit", "Nothing; military fuel is exempt"],
        correctAnswer: "DG declaration, package inspection, correct labelling and orientation arrows",
      },
      {
        id: "q3",
        question: "Describe the loading sequence that keeps the ramp usable for a rapid offload.",
        questionType: "free-text",
        options: [],
        correctAnswer: "Load the items required first at the destination last (nearest the ramp); keep DG accessible; ensure restraint is applied before taxi.",
      },
    ],
  },
  {
    title: "Oversized Cargo: Helicopter Fuselage on C-17",
    description:
      "An MRH-90 fuselage is to be loaded on a C-17A using shoring and a winch. Answer the questions about floor loading, shoring and winching.",
    aircraft: "C17",
    passingThreshold: 70,
    questions: [
      {
        id: "q1",
        question: "Why is shoring required under the cradle?",
        questionType: "free-text",
        options: [],
        correctAnswer: "To spread point loads below the cargo floor's maximum pounds-per-square-inch and axle limits.",
      },
      {
        id: "q2",
        question: "What must be verified before winching begins?",
        questionType: "multiple-choice",
        options: ["Winch cable inspected, cradle wheels chocked, ground crew clear, communications established", "Only that the winch is powered", "Fuel load", "Passenger seating"],
        correctAnswer: "Winch cable inspected, cradle wheels chocked, ground crew clear, communications established",
      },
      {
        id: "q3",
        question: "The ramp angle is too steep for the cradle. What options are available?",
        questionType: "free-text",
        options: [],
        correctAnswer: "Use ramp toes/extensions, kneel the aircraft, or use a K-loader to reduce the approach angle.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Checklists
// ---------------------------------------------------------------------------

export const CHECKLISTS: InsertChecklist[] = [
  {
    title: "C-17A Pre-Load Inspection",
    description: "Cargo compartment inspection before any loading commences.",
    aircraftType: "C17",
    category: "pre-flight",
    enforceLinearProgression: true,
    items: [
      { itemText: "Cargo floor clear of debris and FOD", section: "Compartment" },
      { itemText: "Rail and roller systems inspected and operational", section: "Compartment" },
      { itemText: "Tie-down rings inspected; damaged rings tagged", section: "Compartment" },
      { itemText: "Ramp and door hydraulics checked; no leaks", section: "Ramp" },
      { itemText: "Ramp toes available and serviceable", section: "Ramp" },
      { itemText: "Winch cable inspected along full length", section: "Equipment" },
      { itemText: "Restraint equipment counted against the load plan", section: "Equipment" },
      { itemText: "Fire extinguishers in date and accessible", section: "Safety" },
      { itemText: "Emergency lighting test complete", section: "Safety" },
      { itemText: "Load plan reviewed and signed by aircraft captain", section: "Documentation" },
    ],
  },
  {
    title: "KC-30A Passenger Cabin Preparation",
    description: "Cabin configuration and safety checks before passenger boarding.",
    aircraftType: "KC30A",
    category: "pre-flight",
    items: [
      { itemText: "Seat configuration matches the manifest", section: "Cabin" },
      { itemText: "Seat belts and life vests checked at every seat", section: "Cabin" },
      { itemText: "Overhead bins latched and placarded", section: "Cabin" },
      { itemText: "Galley equipment secured and power checked", section: "Galley" },
      { itemText: "Lavatories serviced and stocked", section: "Galley" },
      { itemText: "Emergency equipment checked against the station list", section: "Safety" },
      { itemText: "PA and interphone test complete", section: "Safety" },
      { itemText: "Passenger brief cards present at every seat", section: "Documentation" },
    ],
  },
  {
    title: "C-130J Post-Flight Cargo Compartment",
    description: "Shutdown checks after the final offload.",
    aircraftType: "C130J",
    category: "post-flight",
    items: [
      { itemText: "All restraint equipment accounted for and stowed", section: "Equipment" },
      { itemText: "Cargo compartment swept and FOD check complete", section: "Compartment" },
      { itemText: "Ramp and door closed and pinned", section: "Ramp" },
      { itemText: "Lavatory serviced", section: "Compartment" },
      { itemText: "Damage or defects recorded in the maintenance log", section: "Documentation" },
      { itemText: "Load documentation filed", section: "Documentation" },
    ],
  },
  {
    title: "In-Flight Fire: Cargo Compartment",
    description: "Quick reference drill. Items must be completed in order.",
    aircraftType: "General",
    category: "emergency",
    enforceLinearProgression: true,
    items: [
      { itemText: "Alert the flight deck: 'FIRE, FIRE, FIRE' with location" },
      { itemText: "Don oxygen mask and goggles" },
      { itemText: "Identify source; select extinguisher type" },
      { itemText: "Attack the fire from upwind of the airflow" },
      { itemText: "Confirm extinguished; monitor for re-ignition" },
      { itemText: "Report status to the aircraft captain" },
      { itemText: "Record the event for the safety report" },
    ],
  },
  {
    title: "Dangerous Goods Acceptance",
    description: "Acceptance check for any DG consignment, all aircraft types.",
    aircraftType: "General",
    category: "pre-flight",
    items: [
      { itemText: "Shipper's declaration complete and signed", section: "Documentation" },
      { itemText: "UN number, proper shipping name and class match the package", section: "Documentation" },
      { itemText: "Package type and quantity within limits for the aircraft", section: "Package" },
      { itemText: "Labels and marks legible; orientation arrows correct", section: "Package" },
      { itemText: "No damage, leakage or odour", section: "Package" },
      { itemText: "Segregation table checked against other DG on board", section: "Loading" },
      { itemText: "NOTOC prepared for the aircraft captain", section: "Documentation" },
    ],
  },
  {
    title: "C-27J Engine Start: Loadmaster Actions",
    description: "Loadmaster duties during engine start.",
    aircraftType: "C27J",
    category: "startup",
    items: [
      { itemText: "Ground crew in position and in communication" },
      { itemText: "Ramp and doors closed; cargo restrained" },
      { itemText: "Fire guard posted" },
      { itemText: "Clear to start called to the flight deck" },
      { itemText: "Monitor the start and report any abnormality" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Documents (form templates)
// ---------------------------------------------------------------------------

export const DOCUMENTS: InsertDocument[] = [
  {
    title: "Passenger and Cargo Manifest",
    description: "Standard manifest for every leg carrying passengers or cargo.",
    type: "manifest",
    fields: [
      { id: "flightNumber", label: "Flight / Mission", type: "text", required: true },
      { id: "date", label: "Date", type: "date", required: true },
      { id: "departure", label: "Departure", type: "text", required: true },
      { id: "arrival", label: "Arrival", type: "text", required: true },
      { id: "passengers", label: "Passengers", type: "number", required: true },
      { id: "cargoWeightKg", label: "Cargo weight (kg)", type: "number", required: true },
      { id: "dangerousGoods", label: "Dangerous goods on board", type: "checkbox" },
      { id: "remarks", label: "Remarks", type: "textarea" },
    ],
  },
  {
    title: "Dangerous Goods Declaration Check",
    description: "Loadmaster acceptance record for a DG consignment.",
    type: "dg",
    fields: [
      { id: "unNumber", label: "UN number", type: "text", required: true },
      { id: "shippingName", label: "Proper shipping name", type: "text", required: true },
      { id: "class", label: "Class", type: "select", options: ["1", "2.1", "2.2", "3", "4.1", "5.1", "6.1", "7", "8", "9"], required: true },
      { id: "packages", label: "Number of packages", type: "number", required: true },
      { id: "netQuantity", label: "Net quantity", type: "text" },
      { id: "accepted", label: "Accepted for carriage", type: "checkbox" },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    title: "Load and Trim Sheet Summary",
    description: "Summary of the computed weight and balance for the sortie.",
    type: "trim",
    fields: [
      { id: "aircraft", label: "Aircraft", type: "select", options: ["C130J", "C17", "C27J", "KC30A"], required: true },
      { id: "zfw", label: "Zero fuel weight (kg)", type: "number", required: true },
      { id: "tow", label: "Take-off weight (kg)", type: "number", required: true },
      { id: "cgPercentMac", label: "CG (% MAC)", type: "number", required: true },
      { id: "withinLimits", label: "Within limits", type: "checkbox" },
      { id: "preparedBy", label: "Prepared by", type: "text", required: true },
    ],
  },
  {
    title: "Hazard Observation Report",
    description: "Report any observed hazard, near miss or unsafe act.",
    type: "safety",
    fields: [
      { id: "date", label: "Date", type: "date", required: true },
      { id: "location", label: "Location", type: "text", required: true },
      { id: "description", label: "What happened", type: "textarea", required: true },
      { id: "immediateAction", label: "Immediate action taken", type: "textarea" },
      { id: "severity", label: "Perceived severity", type: "select", options: ["Low", "Medium", "High"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Phone directory
// ---------------------------------------------------------------------------

const ops = (code: string, prefix: string): InsertPhoneDirectory["contacts"] => [
  { id: `${code}-1`, name: "Air Movements", phoneNumber: `${prefix} 1001`, description: "Cargo and passenger movements" },
  { id: `${code}-2`, name: "Operations", phoneNumber: `${prefix} 1002`, description: "Base operations desk" },
  { id: `${code}-3`, name: "Dangerous Goods Officer", phoneNumber: `${prefix} 1003`, description: "DG acceptance and queries" },
  { id: `${code}-4`, name: "Ground Equipment", phoneNumber: `${prefix} 1004`, description: "K-loaders and forklifts" },
];

export const DIRECTORY: InsertPhoneDirectory[] = [
  { airbaseCode: "YAMB", airbaseName: "RAAF Base Amberley", contacts: ops("YAMB", "+61 7 5461") },
  { airbaseCode: "YSRI", airbaseName: "RAAF Base Richmond", contacts: ops("YSRI", "+61 2 4587") },
  { airbaseCode: "YBTL", airbaseName: "RAAF Base Townsville", contacts: ops("YBTL", "+61 7 4752") },
  { airbaseCode: "YPEA", airbaseName: "RAAF Base Pearce", contacts: ops("YPEA", "+61 8 9571") },
  { airbaseCode: "YPTN", airbaseName: "RAAF Base Tindal", contacts: ops("YPTN", "+61 8 8973") },
  { airbaseCode: "YPDN", airbaseName: "RAAF Base Darwin", contacts: ops("YPDN", "+61 8 8923") },
  { airbaseCode: "YPED", airbaseName: "RAAF Base Edinburgh", contacts: ops("YPED", "+61 8 7383") },
  { airbaseCode: "YBAS", airbaseName: "Alice Springs", contacts: ops("YBAS", "+61 8 8951") },
  { airbaseCode: "WSSS", airbaseName: "Singapore Changi", contacts: ops("WSSS", "+65 6595") },
  { airbaseCode: "PHIK", airbaseName: "Joint Base Pearl Harbor-Hickam", contacts: ops("PHIK", "+1 808 449") },
  { airbaseCode: "PGUA", airbaseName: "Andersen AFB, Guam", contacts: ops("PGUA", "+1 671 366") },
  { airbaseCode: "OMAM", airbaseName: "Al Minhad Air Base", contacts: ops("OMAM", "+971 4 227") },
];

// ---------------------------------------------------------------------------
// Module content helpers
// ---------------------------------------------------------------------------

const CATEGORY_FOR_MODULE: Record<string, QuestionCategory> = {
  "Dangerous Goods": "dangerous-goods",
  "Weight": "weight-balance",
  "Emergency": "emergency-procedures",
  "Leadership": "regulations",
};

export function moduleCategory(m: SeedModule): QuestionCategory {
  for (const [needle, cat] of Object.entries(CATEGORY_FOR_MODULE)) if (m.title.includes(needle)) return cat;
  if (m.difficulty === "beginner") return "loadmaster-fundamentals";
  if (m.difficulty === "intermediate") return "weight-balance";
  if (m.difficulty === "advanced") return "cargo-securing";
  return "aircraft-systems";
}

export function readingFor(m: SeedModule): string {
  const topics = m.topics.map((t) => `- **${t}**`).join("\n");
  const objectives = m.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return `## Overview

${m.description}. This lesson is the reading component of the module; the video walkthrough and the end-of-module assessment follow it.

## Topics covered

${topics}

## Learning objectives

By the end of this module you will be able to:

${objectives}

## Key points

- Always begin with the aircraft loading manual limits for the airframe. Every planning decision is a check against a published limit.
- Weight and balance is computed, never estimated. Record actual weights where available and use standard weights only where authorised.
- Restraint is applied before the aircraft moves. The loadmaster signs for the load; that signature is the final check.
- Dangerous goods are accepted only with complete documentation and after physical inspection of every package.
- Brief the crew. The aircraft captain must know what is on board, where it is, and what the hazards are.

## Before the assessment

Review the topics above and complete the video walkthrough. The assessment draws questions from this module's category and must be passed to mark the module complete.`;
}

export function moduleQuizFor(questions: { id: number; questionText: string; options: string[]; correctIndex: number }[]): ModuleQuizQuestion[] {
  return questions.map((q) => ({ id: `bank-${q.id}`, question: q.questionText, options: q.options, correctIndex: q.correctIndex }));
}
