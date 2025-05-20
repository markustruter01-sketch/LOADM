import { Router } from 'express';
import { loadmasterQuestions } from '@shared/quiz-questions';
import * as quizStorage from '../storage-quiz';

const router = Router();

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const quizzes = await quizStorage.getQuizzes(activeOnly);
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get a single quiz
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quiz = await quizStorage.getQuiz(id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error(`Error fetching quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create a new quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, questionCount, categories, isActive, expiresAt, createdById } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length || !createdById) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const quiz = await quizStorage.createQuiz({
      title,
      description: description || '',
      createdById,
      questionCount,
      categories,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update a quiz
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
    
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questionCount !== undefined) updateData.questionCount = questionCount;
    if (categories !== undefined) updateData.categories = categories;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    
    const quiz = await quizStorage.updateQuiz(id, updateData);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error(`Error updating quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await quizStorage.deleteQuiz(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error(`Error deleting quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Get quiz questions (for taking a quiz)
router.get('/:id/questions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quiz = await quizStorage.getQuiz(id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Filter questions based on the quiz categories
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz.categories.includes(question.category)
    );
    
    if (filteredQuestions.length === 0) {
      return res.status(400).json({ 
        error: 'No questions available for the selected categories' 
      });
    }
    
    // Randomly select questions
    const selectedQuestions = getRandomQuestions(
      filteredQuestions, 
      Math.min(quiz.questionCount, filteredQuestions.length)
    );
    
    // Include full question data but remove correctAnswer for security
    const quizQuestions = selectedQuestions.map(({ correctAnswer, ...rest }) => ({
      ...rest,
      // Ensure we keep the ID for answer matching
      id: rest.id
    }));
    
    res.json(quizQuestions);
  } catch (error) {
    console.error(`Error fetching quiz questions for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Submit a quiz
router.post('/:id/submit', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { userId, answers, squadron } = req.body;
    
    console.log("Quiz submission received:", {
      quizId,
      userId,
      answersCount: answers?.length,
      answers
    });
    
    if (!userId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const quiz = await quizStorage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Calculate score and prepare feedback
    let correctCount = 0;
    const feedback: Record<string, { correct: boolean; correctAnswer: string }> = {};
    
    // Log the questions being processed
    console.log(`Processing quiz with categories:`, quiz.categories);
    
    // Check each submitted answer against the master question bank
    for (const answer of answers) {
      const { questionId, answeredOption } = answer;
      console.log(`Processing answer for question ID: ${questionId}`);
      
      // Find the matching question from the full question bank
      const question = loadmasterQuestions.find(q => q.id === questionId);
      
      if (!question) {
        console.log(`Question not found: ${questionId}`);
        continue;
      }
      
      console.log(`Found question: ${question.question}`);
      console.log(`Options:`, question.options);
      console.log(`Correct answer index: ${question.correctAnswer}`);
      
      // Normalize the answer values for comparison
      const correctIndex = Number(question.correctAnswer);
      const userIndex = Number(answeredOption);
      
      // Check if answer is correct
      const isCorrect = correctIndex === userIndex;
      
      if (isCorrect) {
        correctCount++;
        console.log(`Correct answer! +1 to score`);
      } else {
        console.log(`Incorrect answer. User answered: ${userIndex}, correct is: ${correctIndex}`);
      }
      
      // Get the correct answer text
      let correctAnswerText = "Not available";
      
      if (question.options && 
          Array.isArray(question.options) && 
          correctIndex >= 0 && 
          correctIndex < question.options.length) {
        correctAnswerText = question.options[correctIndex];
        console.log(`Correct answer text: "${correctAnswerText}"`);
      } else {
        console.log(`Could not find correct answer text in options array`);
      }
      
      // Store feedback for this question
      feedback[questionId] = {
        correct: isCorrect,
        correctAnswer: correctAnswerText
      };
    }
    
    const score = Math.round((correctCount / answers.length) * 100);
    
    // Save submission
    const submission = await quizStorage.createQuizSubmission({
      quizId,
      userId,
      answers,
      score,
      squadron: squadron || 'AMG'
    });
    
    res.status(201).json({
      id: submission.id,
      score,
      correctCount,
      totalQuestions: answers.length,
      feedback
    });
  } catch (error) {
    console.error(`Error submitting quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz submissions
router.get('/submissions', async (req, res) => {
  try {
    const quizId = req.query.quizId ? parseInt(req.query.quizId as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    const submissions = await quizStorage.getQuizSubmissions(quizId, userId);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz submissions' });
  }
});

// Helper function to get random questions
function getRandomQuestions(questions: any[], count: number) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default router;