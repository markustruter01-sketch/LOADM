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
    
    // Remove correct answers before sending to client
    const quizQuestions = selectedQuestions.map(({ correctAnswer, ...question }) => ({
      ...question,
      id: question.id // Keep original ID for grading
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
    
    // Get questions to grade the answers
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz.categories.includes(question.category)
    );
    
    // Calculate score and prepare feedback
    let correctCount = 0;
    const feedback: Record<string, { correct: boolean; correctAnswer: string }> = {};
    
    // Debug the filteredQuestions structure
    console.log(`Found ${filteredQuestions.length} filtered questions`);
    if (filteredQuestions.length > 0) {
      console.log(`Sample question: ${JSON.stringify(filteredQuestions[0])}`);
    }
    
    // Debug the submitted answers
    console.log(`Processing ${answers.length} answers: ${JSON.stringify(answers)}`);
    
    answers.forEach(answer => {
      console.log(`Processing answer for question ID: ${answer.questionId}, answer: ${answer.answeredOption}`);
      
      const question = filteredQuestions.find(q => q.id === answer.questionId);
      if (question) {
        console.log(`Found question: ${JSON.stringify(question)}`);
        console.log(`Question correctAnswer: ${question.correctAnswer}, type: ${typeof question.correctAnswer}`);
        console.log(`User answeredOption: ${answer.answeredOption}, type: ${typeof answer.answeredOption}`);
        
        // Convert both values to same type for comparison
        const normalizedCorrectAnswer = Number(question.correctAnswer);
        const normalizedUserAnswer = Number(answer.answeredOption);
        
        const isCorrect = !isNaN(normalizedCorrectAnswer) && 
                         !isNaN(normalizedUserAnswer) && 
                         normalizedCorrectAnswer === normalizedUserAnswer;
                         
        console.log(`Is answer correct: ${isCorrect}`);
        
        if (isCorrect) {
          correctCount++;
        }
        
        // Add feedback for each question with properly formatted correct answer
        let correctAnswerText = 'Not available';
        
        if (Array.isArray(question.options) && 
            typeof question.correctAnswer === 'number' &&
            question.correctAnswer >= 0 && 
            question.correctAnswer < question.options.length) {
          correctAnswerText = question.options[question.correctAnswer];
          console.log(`Found correct answer text: ${correctAnswerText}`);
        } else {
          console.log(`Could not find correct answer text. Options: ${JSON.stringify(question.options)}`);
        }
          
        feedback[answer.questionId] = {
          correct: isCorrect,
          correctAnswer: correctAnswerText
        };
      } else {
        console.log(`Question not found for ID: ${answer.questionId}`);
      }
    });
    
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