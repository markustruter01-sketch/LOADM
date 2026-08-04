import { db } from "../server/db";
import { licenses, users } from "@shared/schema";
import * as bcrypt from "bcryptjs";

const FIRST_NAMES = [
  "James", "Michael", "William", "David", "Richard", "Christopher", "Daniel", "Matthew",
  "Anthony", "Joshua", "Andrew", "Ryan", "Brandon", "Jason", "Justin", "Brian",
  "Thomas", "Robert", "John", "Mark", "Steven", "Timothy", "Kevin", "Eric",
  "Patrick", "Adam", "Scott", "Nathan", "Sean", "Peter", "Luke", "Simon",
  "Nicholas", "Benjamin", "Samuel", "Alexander", "Mitchell", "Cameron", "Aaron", "Dylan",
  "Blake", "Connor", "Ethan", "Harrison", "Jackson", "Jordan", "Kyle", "Liam",
  "Mason", "Noah", "Oliver", "Oscar", "Riley", "Spencer", "Tyler", "Xavier",
  "Sarah", "Emma", "Jessica", "Michelle", "Amanda", "Jennifer", "Stephanie", "Nicole",
  "Rebecca", "Ashley", "Melissa", "Lauren", "Rachel", "Katherine", "Elizabeth", "Victoria",
  "Megan", "Samantha", "Brooke", "Brittany", "Hannah", "Courtney", "Danielle", "Christina"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
  "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Thompson", "White",
  "Harris", "Clark", "Lewis", "Robinson", "Walker", "Hall", "Young", "King",
  "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Ramirez",
  "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner", "Torres",
  "Parker", "Collins", "Edwards", "Stewart", "Flores", "Morris", "Murphy", "Rivera",
  "Cook", "Rogers", "Morgan", "Peterson", "Cooper", "Reed", "Bailey", "Bell",
  "Gomez", "Kelly", "Howard", "Ward", "Cox", "Diaz", "Richardson", "Wood"
];

const RANKS = ["CPL", "SGT", "FSGT", "WO"];
const SQUADRONS = ["33SQN", "35SQN", "36SQN", "37SQN"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const middleInitial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${firstName.toLowerCase()}.${middleInitial.toLowerCase()}.${lastName.toLowerCase()}${index}@raaf.mil.au`;
}

function generateLicenseKey(firstName: string, index: number): string {
  return `LIC-${firstName.toUpperCase().slice(0,4)}-${Date.now()}-${index.toString().padStart(3, '0')}`;
}

function getExpiryDate(): Date {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * 365) + 30;
  return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

function getCategory(): string {
  const rand = Math.random();
  if (rand < 0.4) return "D"; // 40% junior
  if (rand < 0.7) return "C"; // 30%
  if (rand < 0.9) return "B"; // 20%
  return "A"; // 10% senior
}

async function seedRealisticUsers() {
  console.log("Starting to seed 150 realistic users...");
  
  const defaultPassword = "Password1!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  let createdCount = 0;
  const usedEmails = new Set<string>();
  
  // Create 40 loadmasters
  console.log("Creating 40 loadmasters...");
  for (let i = 0; i < 40; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const rank = getRandomElement(RANKS);
    let email = generateEmail(firstName, lastName, i);
    
    while (usedEmails.has(email)) {
      email = generateEmail(firstName, lastName, Math.floor(Math.random() * 1000));
    }
    usedEmails.add(email);
    
    try {
      const newLicense = await db.insert(licenses).values({
        email,
        firstName: `${rank} ${firstName}`,
        lastName,
        licenseKey: generateLicenseKey(firstName, i),
        licenseType: "loadmaster",
        squadron: getRandomElement(SQUADRONS),
        category: getCategory(),
        isActive: true,
        expiryDate: getExpiryDate(),
        maxConcurrentSessions: 3,
        maxDevices: 2,
        createdByAdmin: 9,
        notes: "",
        totalMissionsFlown: Math.floor(Math.random() * 200),
        totalCargoWeight: Math.floor(Math.random() * 500000),
        isFlightReady: Math.random() > 0.1,
      }).returning();

      await db.insert(users).values({
        email,
        hashedPassword,
        isFirstLogin: true,
        licenseId: newLicense[0].id,
        createdBy: 9,
        userRole: "loadmaster",
        isAdmin: false,
        isSuperAdmin: false,
      });

      createdCount++;
    } catch (error) {
      console.log(`Skipped duplicate email: ${email}`);
    }
  }
  
  // Create 30 instructors
  console.log("Creating 30 instructors...");
  for (let i = 0; i < 30; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const rank = getRandomElement(["SGT", "FSGT", "WO"]); // Instructors are typically more senior
    let email = generateEmail(firstName, lastName, i + 100);
    
    while (usedEmails.has(email)) {
      email = generateEmail(firstName, lastName, Math.floor(Math.random() * 1000) + 100);
    }
    usedEmails.add(email);
    
    try {
      const newLicense = await db.insert(licenses).values({
        email,
        firstName: `${rank} ${firstName}`,
        lastName,
        licenseKey: generateLicenseKey(firstName, i + 100),
        licenseType: "instructor",
        squadron: getRandomElement(SQUADRONS),
        category: getRandomElement(["A", "B"]), // Instructors are senior
        isActive: true,
        expiryDate: getExpiryDate(),
        maxConcurrentSessions: 3,
        maxDevices: 2,
        createdByAdmin: 9,
        notes: "Instructor account",
        totalMissionsFlown: Math.floor(Math.random() * 300) + 100,
        totalCargoWeight: Math.floor(Math.random() * 800000) + 200000,
        isFlightReady: true,
      }).returning();

      await db.insert(users).values({
        email,
        hashedPassword,
        isFirstLogin: true,
        licenseId: newLicense[0].id,
        createdBy: 9,
        userRole: "instructor",
        isAdmin: true,
        isSuperAdmin: false,
      });

      createdCount++;
    } catch (error) {
      console.log(`Skipped duplicate email: ${email}`);
    }
  }
  
  // Create remaining 80 loadmasters with varying distributions
  console.log("Creating 80 additional loadmasters...");
  for (let i = 0; i < 80; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const rank = getRandomElement(RANKS);
    let email = generateEmail(firstName, lastName, i + 200);
    
    while (usedEmails.has(email)) {
      email = generateEmail(firstName, lastName, Math.floor(Math.random() * 1000) + 200);
    }
    usedEmails.add(email);
    
    try {
      const newLicense = await db.insert(licenses).values({
        email,
        firstName: `${rank} ${firstName}`,
        lastName,
        licenseKey: generateLicenseKey(firstName, i + 200),
        licenseType: "loadmaster",
        squadron: getRandomElement(SQUADRONS),
        category: getCategory(),
        isActive: Math.random() > 0.05, // 95% active
        expiryDate: getExpiryDate(),
        maxConcurrentSessions: 3,
        maxDevices: 2,
        createdByAdmin: 9,
        notes: "",
        totalMissionsFlown: Math.floor(Math.random() * 250),
        totalCargoWeight: Math.floor(Math.random() * 600000),
        isFlightReady: Math.random() > 0.15,
      }).returning();

      await db.insert(users).values({
        email,
        hashedPassword,
        isFirstLogin: true,
        licenseId: newLicense[0].id,
        createdBy: 9,
        userRole: "loadmaster",
        isAdmin: false,
        isSuperAdmin: false,
      });

      createdCount++;
    } catch (error) {
      console.log(`Skipped duplicate email: ${email}`);
    }
  }
  
  console.log(`Successfully created ${createdCount} users!`);
  console.log("All users have default password: Password1!");
}

seedRealisticUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding users:", error);
    process.exit(1);
  });
