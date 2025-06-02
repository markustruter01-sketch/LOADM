import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Generate realistic quiz submission data directly via SQL
async function generateQuizTestData() {
  console.log('🚀 Generating quiz test data...');
  
  try {
    // First, check existing users and quizzes
    const users = await sql`SELECT id, email FROM users LIMIT 10`;
    const quizzes = await sql`SELECT id, title FROM quizzes LIMIT 5`;
    
    console.log(`Found ${users.length} users and ${quizzes.length} quizzes`);
    
    if (users.length === 0 || quizzes.length === 0) {
      console.log('⚠️ Need users and quizzes to generate submissions');
      return;
    }
    
    // Generate 38 submissions over 3 months
    const squadrons = ['33 Squadron', '35 Squadron', '36 Squadron', '37 Squadron'];
    const submissions = [];
    
    for (let i = 0; i < 38; i++) {
      // Random date within last 3 months
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
      const submissionDate = new Date(randomTime);
      
      // Generate realistic scores (mostly high)
      let score;
      const rand = Math.random();
      if (rand < 0.15) {
        score = Math.floor(Math.random() * 20) + 50; // 15% low scores (50-69%)
      } else if (rand < 0.25) {
        score = Math.floor(Math.random() * 10) + 70; // 10% medium scores (70-79%)
      } else if (rand < 0.70) {
        score = Math.floor(Math.random() * 10) + 80; // 45% good scores (80-89%)
      } else {
        score = Math.floor(Math.random() * 11) + 90; // 30% excellent scores (90-100%)
      }
      
      // Random user and quiz
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const squadron = squadrons[Math.floor(Math.random() * squadrons.length)];
      
      // Generate sample answers
      const answers = [];
      for (let j = 0; j < 10; j++) {
        answers.push({
          questionId: `q${j + 1}`,
          answeredOption: Math.floor(Math.random() * 4)
        });
      }
      
      submissions.push({
        userId: randomUser.id,
        quizId: randomQuiz.id,
        squadron: squadron,
        score: score,
        answers: JSON.stringify(answers),
        submissionDate: submissionDate
      });
    }
    
    // Insert all submissions
    console.log('📊 Inserting submissions...');
    let successCount = 0;
    
    for (const submission of submissions) {
      try {
        await sql`
          INSERT INTO quiz_submissions (user_id, quiz_id, squadron, score, answers, submission_date)
          VALUES (${submission.userId}, ${submission.quizId}, ${submission.squadron}, ${submission.score}, ${submission.answers}, ${submission.submissionDate})
        `;
        successCount++;
        console.log(`✅ ${successCount}/38: ${submission.squadron} - ${submission.score}%`);
      } catch (error) {
        console.log(`❌ Failed to insert submission: ${error.message}`);
      }
    }
    
    // Show summary statistics
    const squadronStats = {};
    const scoreRanges = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0 };
    
    submissions.forEach(sub => {
      squadronStats[sub.squadron] = (squadronStats[sub.squadron] || 0) + 1;
      if (sub.score < 50) scoreRanges['0-49']++;
      else if (sub.score < 70) scoreRanges['50-69']++;
      else if (sub.score < 90) scoreRanges['70-89']++;
      else scoreRanges['90-100']++;
    });
    
    console.log('\n📈 Data Summary:');
    console.log(`Total submissions created: ${successCount}`);
    console.log('Squadron distribution:', squadronStats);
    console.log('Score distribution:', scoreRanges);
    console.log('\n✅ Quiz analytics data generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
}

generateQuizTestData();