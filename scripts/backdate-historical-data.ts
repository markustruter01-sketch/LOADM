import { db } from "../server/db";
import { 
  users, 
  licenses, 
  quizSubmissions, 
  flightRecords, 
  userQualifications,
  safetyRecords,
  quizzes
} from "../shared/schema";
import { eq, sql, and, gte, lte, inArray, ne } from "drizzle-orm";

const MILITARY_PHOTOS = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1579503841516-e0bd7fca5faa?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
];

const CASUAL_PHOTOS = [
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(yearsBack: number, monthsVariation: number = 6): Date {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - yearsBack, now.getMonth() - monthsVariation, now.getDate());
  const endDate = new Date(now.getFullYear() - yearsBack, now.getMonth() + monthsVariation, now.getDate());
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function getProfilePhoto(isMilitary: boolean): string {
  if (isMilitary) {
    return MILITARY_PHOTOS[Math.floor(Math.random() * MILITARY_PHOTOS.length)];
  }
  return CASUAL_PHOTOS[Math.floor(Math.random() * CASUAL_PHOTOS.length)];
}

async function backdateHistoricalData() {
  console.log("🕐 Starting historical data backdating...\n");

  const allLicenses = await db.select().from(licenses).where(
    and(
      ne(licenses.licenseType, 'superadmin'),
      sql`${licenses.email} NOT LIKE '%loadmworkflow.com'`
    )
  );
  
  console.log(`Found ${allLicenses.length} licenses to process\n`);

  if (allLicenses.length === 0) {
    console.log("No licenses to process. Exiting.");
    return;
  }

  const allQuizzes = await db.select().from(quizzes);
  console.log(`Found ${allQuizzes.length} quizzes available for cyclic assessments\n`);

  let photoUpdates = 0;
  let dateUpdates = 0;
  let newSubmissionsCreated = 0;

  for (const license of allLicenses) {
    const yearsInService = randomInt(1, 12);
    const graduationDate = randomDate(yearsInService, 3);
    const licenseCreatedAt = new Date(graduationDate);
    licenseCreatedAt.setMonth(licenseCreatedAt.getMonth() - randomInt(1, 6));
    
    console.log(`\n👤 Processing: ${license.email}`);
    console.log(`   Years in service: ${yearsInService}`);
    console.log(`   Graduation date: ${graduationDate.toISOString().split('T')[0]}`);

    const isMilitary = Math.random() < 0.8;
    const photoUrl = getProfilePhoto(isMilitary);
    
    await db.update(licenses)
      .set({ 
        profilePhotoUrl: photoUrl,
        createdAt: licenseCreatedAt,
        issuedDate: licenseCreatedAt,
        expiryDate: new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate()),
      })
      .where(eq(licenses.id, license.id));
    photoUpdates++;

    const [user] = await db.select().from(users).where(eq(users.email, license.email));
    const userId = user?.id;
    
    if (userId) {
      await db.update(users)
        .set({ 
          createdAt: licenseCreatedAt,
        })
        .where(eq(users.id, userId));
      dateUpdates++;
    }

    if (!userId) {
      console.log(`   ⚠️ No user found for email ${license.email}, skipping submissions/records`);
      continue;
    }

    const existingSubmissions = await db.select().from(quizSubmissions)
      .where(eq(quizSubmissions.userId, userId));
    
    if (existingSubmissions.length > 0) {
      const updatedDates: Date[] = [];
      for (let i = 0; i < existingSubmissions.length; i++) {
        const sub = existingSubmissions[i];
        const submissionDate = new Date(graduationDate);
        submissionDate.setMonth(submissionDate.getMonth() + randomInt(0, yearsInService * 12));
        submissionDate.setDate(randomInt(1, 28));
        updatedDates.push(submissionDate);
        
        await db.update(quizSubmissions)
          .set({ submissionDate: submissionDate })
          .where(eq(quizSubmissions.id, sub.id));
      }
      console.log(`   Updated ${existingSubmissions.length} quiz submissions with historical dates`);
    }

    const yearsSinceGraduation = yearsInService;
    const requiredAssessments = yearsSinceGraduation * 4;
    const currentSubmissionCount = existingSubmissions.length;
    
    if (currentSubmissionCount < requiredAssessments && allQuizzes.length > 0) {
      const assessmentsToAdd = requiredAssessments - currentSubmissionCount;
      console.log(`   Need to add ${assessmentsToAdd} cyclic assessments (${requiredAssessments} required - ${currentSubmissionCount} existing)`);
      
      for (let i = 0; i < assessmentsToAdd; i++) {
        const quiz = allQuizzes[Math.floor(Math.random() * allQuizzes.length)];
        const yearOffset = Math.floor(i / 4);
        const quarterOffset = i % 4;
        
        const submissionDate = new Date(graduationDate);
        submissionDate.setFullYear(submissionDate.getFullYear() + yearOffset);
        submissionDate.setMonth(submissionDate.getMonth() + (quarterOffset * 3) + randomInt(0, 2));
        submissionDate.setDate(randomInt(1, 28));
        
        if (submissionDate > new Date()) {
          continue;
        }
        
        const isHighPerformer = Math.random() < 0.85;
        const score = isHighPerformer ? randomInt(85, 95) : randomInt(55, 75);
        
        const squadrons = ['33SQN', '35SQN', '36SQN', '37SQN'];
        const squadron = squadrons[Math.floor(Math.random() * squadrons.length)];
        
        await db.insert(quizSubmissions).values({
          quizId: quiz.id,
          userId: userId,
          submissionDate: submissionDate,
          answers: [],
          score: score,
          squadron: squadron,
        });
        newSubmissionsCreated++;
      }
    }

    const existingFlights = await db.select().from(flightRecords)
      .where(eq(flightRecords.userId, userId));
    
    for (const flight of existingFlights) {
      const flightDate = new Date(graduationDate);
      flightDate.setMonth(flightDate.getMonth() + randomInt(0, yearsInService * 12));
      flightDate.setDate(randomInt(1, 28));
      
      if (flightDate > new Date()) {
        flightDate.setTime(new Date().getTime() - randomInt(1, 365) * 24 * 60 * 60 * 1000);
      }
      
      await db.update(flightRecords)
        .set({ 
          date: flightDate,
          createdAt: flightDate,
        })
        .where(eq(flightRecords.id, flight.id));
    }
    if (existingFlights.length > 0) {
      console.log(`   Updated ${existingFlights.length} flight records with historical dates`);
    }

    const existingQuals = await db.select().from(userQualifications)
      .where(eq(userQualifications.userId, userId));
    
    for (const qual of existingQuals) {
      const qualStartDate = new Date(graduationDate);
      qualStartDate.setMonth(qualStartDate.getMonth() + randomInt(-6, yearsInService * 6));
      
      let qualExpiryDate: Date | null = null;
      if (qual.expiryDate) {
        qualExpiryDate = new Date(qualStartDate);
        qualExpiryDate.setFullYear(qualExpiryDate.getFullYear() + randomInt(1, 3));
        if (qualExpiryDate < new Date()) {
          qualExpiryDate = new Date();
          qualExpiryDate.setMonth(qualExpiryDate.getMonth() + randomInt(1, 24));
        }
      }
      
      await db.update(userQualifications)
        .set({ 
          startDate: qualStartDate,
          expiryDate: qualExpiryDate,
          createdAt: qualStartDate,
        })
        .where(eq(userQualifications.id, qual.id));
    }
    if (existingQuals.length > 0) {
      console.log(`   Updated ${existingQuals.length} qualifications with historical dates`);
    }

    const existingSafety = await db.select().from(safetyRecords)
      .where(eq(safetyRecords.userId, userId));
    
    for (const safety of existingSafety) {
      const safetyDate = new Date(graduationDate);
      safetyDate.setMonth(safetyDate.getMonth() + randomInt(0, yearsInService * 12));
      safetyDate.setDate(randomInt(1, 28));
      
      if (safetyDate > new Date()) {
        safetyDate.setTime(new Date().getTime() - randomInt(1, 365) * 24 * 60 * 60 * 1000);
      }
      
      await db.update(safetyRecords)
        .set({ 
          date: safetyDate,
          createdAt: safetyDate,
        })
        .where(eq(safetyRecords.id, safety.id));
    }
    if (existingSafety.length > 0) {
      console.log(`   Updated ${existingSafety.length} safety records with historical dates`);
    }
  }

  console.log("\n\n📊 SUMMARY:");
  console.log(`   Profile photos updated: ${photoUpdates}`);
  console.log(`   User/license dates updated: ${dateUpdates}`);
  console.log(`   New cyclic assessments created: ${newSubmissionsCreated}`);
  console.log("\n✅ Historical data backdating complete!");
}

backdateHistoricalData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error backdating data:", err);
    process.exit(1);
  });
