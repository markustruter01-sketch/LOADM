import { db } from "../server/db";
import { quizSubmissions, flightRecords, userQualifications, users, licenses } from "@shared/schema";
import { gte } from "drizzle-orm";

const QUALIFICATIONS = [
  "C-130J Basic Loadmaster",
  "C-17A Loadmaster Cat-D",
  "C-17A Loadmaster Cat-C",
  "C-17A Loadmaster Cat-B",
  "C-17A Loadmaster Cat-A",
  "KC-30A MRTT Loadmaster",
  "Airdrop Qualified",
  "Night Vision Goggle Qualified",
  "Hazardous Materials Handling",
  "Combat Air Drop Qualified",
  "Air Refueling Operator",
  "Tactical Operations",
  "Heavy Equipment Load Planner",
  "Air Medical Evacuation",
  "Survival Training - Current"
];

const AIRCRAFT_TYPES = ["C-130J", "C-17A", "KC-30A", "C-27J"];
const AIRPORTS = ["RAAF Amberley", "RAAF Richmond", "RAAF Edinburgh", "HMAS Albatross", "RAAF Townsville", "RAAF Darwin", "Pearce"];
const CAPTAINS = ["CAPT Roberts", "CAPT Williams", "CAPT Johnson", "CAPT Brown", "CAPT Taylor", "SQNLDR Smith", "SQNLDR Davis"];
const CALLSIGNS = ["STALLION", "MUSTANG", "RAPTOR", "EAGLE", "HAWK", "PHOENIX", "THUNDER"];

const QUIZ_IDS = [51, 52, 53, 54];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getScore(isHighPerformer: boolean): number {
  if (isHighPerformer) {
    return Math.floor(Math.random() * 11) + 85; // 85-95
  } else {
    return Math.floor(Math.random() * 21) + 55; // 55-75
  }
}

function getRandomDate(daysBack: number): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * daysBack);
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function getExpiryDate(startDate: Date): Date | null {
  if (Math.random() > 0.2) { // 80% have expiry dates
    const monthsToAdd = Math.floor(Math.random() * 24) + 6; // 6-30 months from start
    return new Date(startDate.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1000);
  }
  return null;
}

async function seedPerformanceData() {
  console.log("Starting to seed performance data...");
  
  // Get all new users (created with first login true)
  const newUsers = await db.select({
    id: users.id,
    email: users.email,
    userRole: users.userRole,
    licenseId: users.licenseId
  }).from(users).where(gte(users.id, 1705));
  
  console.log(`Found ${newUsers.length} users to create data for`);
  
  // Determine 85% high performers, 15% struggling
  const shuffled = [...newUsers].sort(() => Math.random() - 0.5);
  const highPerformerCount = Math.floor(shuffled.length * 0.85);
  const highPerformers = new Set(shuffled.slice(0, highPerformerCount).map(u => u.id));
  
  let quizCount = 0;
  let flightCount = 0;
  let qualCount = 0;
  
  for (const user of newUsers) {
    const isHighPerformer = highPerformers.has(user.id);
    
    // Create quiz submissions (2-8 per user)
    const numSubmissions = Math.floor(Math.random() * 7) + 2;
    for (let i = 0; i < numSubmissions; i++) {
      const quizId = getRandomElement(QUIZ_IDS);
      const score = getScore(isHighPerformer);
      
      // Generate fake answers based on score
      const numQuestions = Math.floor(Math.random() * 5) + 5;
      const answers = [];
      for (let q = 1; q <= numQuestions; q++) {
        const correct = Math.random() * 100 < score;
        answers.push({
          questionId: `q${q}`,
          answeredOption: correct ? 1 : Math.floor(Math.random() * 3) + 2
        });
      }
      
      try {
        await db.insert(quizSubmissions).values({
          quizId,
          userId: user.id,
          submissionDate: getRandomDate(180),
          answers,
          score,
          squadron: "AMG"
        });
        quizCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    
    // Create flight records (5-20 per user, more for loadmasters)
    const isLoadmaster = user.userRole === "loadmaster";
    const numFlights = Math.floor(Math.random() * (isLoadmaster ? 16 : 10)) + 5;
    
    for (let i = 0; i < numFlights; i++) {
      const departure = getRandomElement(AIRPORTS);
      let arrival = getRandomElement(AIRPORTS);
      while (arrival === departure) {
        arrival = getRandomElement(AIRPORTS);
      }
      
      const dayHours = Math.floor(Math.random() * 6) + 1;
      const nightHours = Math.random() > 0.6 ? Math.floor(Math.random() * 4) : 0;
      
      try {
        await db.insert(flightRecords).values({
          userId: user.id,
          date: getRandomDate(365),
          callsign: `${getRandomElement(CALLSIGNS)}${Math.floor(Math.random() * 99) + 1}`,
          departure,
          arrival,
          passengersCarried: Math.floor(Math.random() * 80),
          cargoWeight: Math.floor(Math.random() * 40000) + 1000,
          captain: getRandomElement(CAPTAINS),
          nightHours,
          dayHours,
          aircraftType: getRandomElement(AIRCRAFT_TYPES)
        });
        flightCount++;
      } catch (e) {
        // Skip errors
      }
    }
    
    // Create qualifications (3-8 per user, high performers get more)
    const numQuals = Math.floor(Math.random() * (isHighPerformer ? 6 : 3)) + 3;
    const usedQuals = new Set<string>();
    
    for (let i = 0; i < numQuals; i++) {
      let qualName = getRandomElement(QUALIFICATIONS);
      while (usedQuals.has(qualName)) {
        qualName = getRandomElement(QUALIFICATIONS);
      }
      usedQuals.add(qualName);
      
      const startDate = getRandomDate(730);
      const expiryDate = getExpiryDate(startDate);
      
      try {
        await db.insert(userQualifications).values({
          userId: user.id,
          name: qualName,
          startDate,
          expiryDate
        });
        qualCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  
  console.log(`Created ${quizCount} quiz submissions`);
  console.log(`Created ${flightCount} flight records`);
  console.log(`Created ${qualCount} qualifications`);
  console.log("Performance data seeding complete!");
}

seedPerformanceData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding performance data:", error);
    process.exit(1);
  });
