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
    
    if (!userId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const quiz = await quizStorage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Get all questions for this quiz's categories
    const allPossibleQuestions = loadmasterQuestions.filter(q => 
      quiz.categories.includes(q.category)
    );
    
    // Initialize scoring variables
    let correctCount = 0;
    const feedback: Record<string, { 
      correct: boolean; 
      correctAnswer: string;
      yourAnswer: string;
    }> = {};
    
    // Process each answer
    for (const answer of answers) {
      const { questionId, answeredOption } = answer;
      
      // Find the question in the full question bank by ID
      const question = allPossibleQuestions.find(q => q.id === questionId);
      
      if (!question) {
        console.error(`Question with ID ${questionId} not found in the question bank`);
        continue;
      }
      
      // Get the correct answer index as a number
      const correctAnswerIndex = Number(question.correctAnswer);
      
      // Convert user answer to a number for comparison
      const userAnswerIndex = Number(answeredOption);
      
      // Check if the answer is correct
      const isCorrect = correctAnswerIndex === userAnswerIndex;
      
      // Add to score if correct
      if (isCorrect) {
        correctCount++;
      }
      
      // Prepare answer text for feedback
      let correctAnswerText = "Not available";
      let userAnswerText = "Not selected";
      
      // Get the correct answer text from the options array
      if (Array.isArray(question.options) && 
          correctAnswerIndex >= 0 && 
          correctAnswerIndex < question.options.length) {
        correctAnswerText = question.options[correctAnswerIndex];
      }
      
      // Get the user's answer text
      if (Array.isArray(question.options) && 
          userAnswerIndex >= 0 && 
          userAnswerIndex < question.options.length) {
        userAnswerText = question.options[userAnswerIndex];
      }
      
      // Store detailed feedback for this question
      feedback[questionId] = {
        correct: isCorrect,
        correctAnswer: correctAnswerText,
        yourAnswer: userAnswerText
      };
    }
    
    // Calculate final score
    const score = Math.round((correctCount / answers.length) * 100);
    
    console.log("Quiz feedback:", JSON.stringify(feedback, null, 2));
    
    // Store questions with feedback to help debug client display
    const submissionQuestions = answers.map(answer => {
      const question = allPossibleQuestions.find(q => q.id === answer.questionId);
      const answerFeedback = feedback[answer.questionId];
      
      return {
        questionId: answer.questionId,
        questionText: question?.question || "Unknown Question",
        yourAnswer: answerFeedback?.yourAnswer || "Not recorded",
        correctAnswer: answerFeedback?.correctAnswer || "Not available",
        isCorrect: answerFeedback?.correct || false
      };
    });
    
    // Save submission with basic data
    const submission = await quizStorage.createQuizSubmission({
      quizId,
      userId,
      score,
      totalQuestions: answers.length,
      squadron: squadron || 'AMG'
    });
    
    // Return enhanced response with detailed feedback
    res.status(201).json({
      id: submission.id,
      score,
      correctCount,
      totalQuestions: answers.length,
      feedback,
      // Include additional data to help client display
      questions: submissionQuestions
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