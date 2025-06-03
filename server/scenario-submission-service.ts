import { Request, Response } from 'express';
import { db } from './db';
import { scenarioSubmissions, scenarios } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Extend Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Modern submission schema
const SubmissionSchema = z.object({
  scenarioId: z.number(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
    notes: z.string().optional()
  })),
  studentName: z.string().optional(),
  studentId: z.string().optional(),
  squadron: z.string().optional(),
  timeSpent: z.number().optional(),
  notes: z.string().optional(),
  submissionType: z.enum(['training', 'assessment']).default('assessment')
});

export class ScenarioSubmissionService {
  
  // Create a new scenario submission
  static async createSubmission(req: AuthRequest, res: Response) {
    console.log('🆕 NEW SCENARIO SUBMISSION SERVICE - Create request');
    
    try {
      // Validate user authentication
      if (!req.user?.id) {
        console.log('❌ No authenticated user found');
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id;
      console.log('✅ Authenticated user ID:', userId);

      // Validate request body
      const validationResult = SubmissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('❌ Validation failed:', validationResult.error.errors);
        return res.status(400).json({ 
          error: 'Invalid submission data',
          details: validationResult.error.errors 
        });
      }

      const { scenarioId, answers, studentName, studentId, squadron, timeSpent, notes, submissionType } = validationResult.data;
      console.log('✅ Validated submission data:', { scenarioId, answerCount: answers.length, submissionType });

      // Verify scenario exists
      const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
      if (scenario.length === 0) {
        console.log('❌ Scenario not found:', scenarioId);
        return res.status(404).json({ error: 'Scenario not found' });
      }

      console.log('✅ Scenario verified:', scenario[0].title);

      if (submissionType === 'training') {
        // For training submissions, store only in activity history - NOT in instructor portal
        console.log('📚 TRAINING SUBMISSION - Storing in activity history only');
        
        // Use proper SQL query with parameterized values
        const activityDetails = JSON.stringify({
          scenarioId,
          answers,
          squadron: squadron || 'AMG',
          notes: notes || ''
        });

        await db.execute(`
          INSERT INTO user_activity_history 
          (user_id, activity_type, activity_title, activity_description, completion_date, time_spent, details)
          VALUES (${userId}, 'training_scenario', '${scenario[0].title.replace("'", "''")}', 'Training scenario completed', NOW(), ${timeSpent || 0}, '${activityDetails.replace("'", "''")}')
        `);

        console.log('✅ Training submission stored in activity history');

        // Return response for training submission
        res.status(201).json({
          type: 'training',
          message: 'Training submission completed successfully',
          scenarioTitle: scenario[0].title,
          completionDate: new Date().toISOString()
        });

      } else {
        // For assessment submissions, store in instructor portal as before
        console.log('📝 ASSESSMENT SUBMISSION - Storing for instructor review');
        
        const [submission] = await db.insert(scenarioSubmissions).values({
          scenarioId,
          userId,
          answers,
          status: 'submitted',
          studentName: studentName || '',
          studentId: studentId || '',
          squadron: squadron || 'AMG',
          timeSpent: timeSpent || 0,
          notes: notes || '',
          submissionType: 'assessment'
        }).returning();

        console.log('✅ Assessment submission created successfully:', submission.id);

        // Return clean response using the updated schema fields
        const response = {
          id: submission.id,
          scenarioId: submission.scenarioId,
          userId: submission.userId,
          submissionDate: submission.submissionDate,
          status: submission.status,
          answers: submission.answers,
          studentName: submission.studentName,
          studentId: submission.studentId,
          squadron: submission.squadron,
          timeSpent: submission.timeSpent,
          notes: submission.notes,
          submissionType: submission.submissionType
        };

        res.status(201).json(response);
      }

    } catch (error) {
      console.error('❌ Submission creation failed:', error);
      res.status(500).json({ 
        error: 'Failed to create submission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get user's scenario submissions
  static async getUserSubmissions(req: AuthRequest, res: Response) {
    console.log('📋 NEW SCENARIO SUBMISSION SERVICE - Get user submissions');
    
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id;
      console.log('✅ Getting submissions for user:', userId);

      const submissions = await db.select({
        id: scenarioSubmissions.id,
        scenarioId: scenarioSubmissions.scenarioId,
        submissionDate: scenarioSubmissions.submissionDate,
        status: scenarioSubmissions.status,
        score: scenarioSubmissions.score,
        passed: scenarioSubmissions.passed,
        answers: scenarioSubmissions.answers,
        scenarioTitle: scenarios.title
      })
      .from(scenarioSubmissions)
      .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id))
      .where(eq(scenarioSubmissions.userId, userId));

      console.log('✅ Found submissions:', submissions.length);

      res.json(submissions);

    } catch (error) {
      console.error('❌ Failed to get submissions:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve submissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all submissions (admin/instructor view) - ONLY ASSESSMENT SUBMISSIONS
  static async getAllSubmissions(req: AuthRequest, res: Response) {
    console.log('📊 NEW SCENARIO SUBMISSION SERVICE - Get all submissions (ASSESSMENT ONLY)');
    
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Only show assessment submissions in instructor portal - filter out training
      
      const submissions = await db.select({
        id: scenarioSubmissions.id,
        scenarioId: scenarioSubmissions.scenarioId,
        userId: scenarioSubmissions.userId,
        submissionDate: scenarioSubmissions.submissionDate,
        status: scenarioSubmissions.status,
        score: scenarioSubmissions.score,
        passed: scenarioSubmissions.passed,
        answers: scenarioSubmissions.answers,
        instructorFeedback: scenarioSubmissions.instructorFeedback,
        scenarioTitle: scenarios.title,
        submissionType: scenarioSubmissions.submissionType
      })
      .from(scenarioSubmissions)
      .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id))
      .where(eq(scenarioSubmissions.submissionType, 'assessment')); // ONLY ASSESSMENT SUBMISSIONS

      console.log('✅ Retrieved all submissions:', submissions.length);

      res.json(submissions);

    } catch (error) {
      console.error('❌ Failed to get all submissions:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve submissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get specific submission by ID
  static async getSubmissionById(req: AuthRequest, res: Response) {
    console.log('🔍 NEW SCENARIO SUBMISSION SERVICE - Get submission by ID');
    
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const submissionId = parseInt(req.params.id);
      if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Invalid submission ID' });
      }

      console.log('✅ Getting submission:', submissionId);

      const [result] = await db.select({
        id: scenarioSubmissions.id,
        scenarioId: scenarioSubmissions.scenarioId,
        userId: scenarioSubmissions.userId,
        submissionDate: scenarioSubmissions.submissionDate,
        answers: scenarioSubmissions.answers,
        score: scenarioSubmissions.score,
        studentName: scenarioSubmissions.studentName,
        studentId: scenarioSubmissions.studentId,
        squadron: scenarioSubmissions.squadron,
        instructorFeedback: scenarioSubmissions.instructorFeedback,
        markedAnswers: scenarioSubmissions.markedAnswers,
        status: scenarioSubmissions.status,
        passed: scenarioSubmissions.passed,
        timeSpent: scenarioSubmissions.timeSpent,
        notes: scenarioSubmissions.notes,
        scenarioTitle: scenarios.title,
        scenarioQuestions: scenarios.questions
      })
        .from(scenarioSubmissions)
        .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id))
        .where(eq(scenarioSubmissions.id, submissionId))
        .limit(1);

      if (!result) {
        console.log('❌ Submission not found:', submissionId);
        return res.status(404).json({ error: 'Submission not found' });
      }

      console.log('✅ Submission found');

      res.json(result);

    } catch (error) {
      console.error('❌ Failed to get submission:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve submission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update submission with instructor feedback and marking
  static async updateSubmission(req: AuthRequest, res: Response) {
    console.log('📝 NEW SCENARIO SUBMISSION SERVICE - Update submission');
    
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const submissionId = parseInt(req.params.id);
      if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Invalid submission ID' });
      }

      const { instructorFeedback, markedAnswers, status, score, passed } = req.body;

      console.log('✅ Updating submission:', submissionId);
      console.log('✅ Update data:', { instructorFeedback, markedAnswers, status, score, passed });

      // Convert markedAnswers to JSON string if it's an object
      const markedAnswersJson = typeof markedAnswers === 'object' ? 
        JSON.stringify(markedAnswers) : markedAnswers;

      const [updatedSubmission] = await db.update(scenarioSubmissions)
        .set({
          instructorFeedback,
          markedAnswers: markedAnswersJson,
          status,
          score,
          passed
        })
        .where(eq(scenarioSubmissions.id, submissionId))
        .returning();

      if (!updatedSubmission) {
        console.log('❌ Submission not found for update:', submissionId);
        return res.status(404).json({ error: 'Submission not found' });
      }

      console.log('✅ Submission updated successfully');

      res.json(updatedSubmission);

    } catch (error) {
      console.error('❌ Failed to update submission:', error);
      res.status(500).json({ 
        error: 'Failed to update submission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get user's activity history (training submissions)
  static async getUserActivityHistory(req: AuthRequest, res: Response) {
    console.log('📋 NEW SCENARIO SUBMISSION SERVICE - Get user activity history');
    
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id;
      console.log('✅ Getting activity history for user:', userId);

      const activities = await db.execute(`
        SELECT 
          id,
          activity_type,
          activity_title,
          activity_description,
          score,
          passed,
          completion_date,
          time_spent,
          details
        FROM user_activity_history 
        WHERE user_id = ${userId} 
        ORDER BY completion_date DESC
      `);

      console.log('✅ Found activities:', activities.length);

      res.json(activities);

    } catch (error) {
      console.error('❌ Failed to get activity history:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve activity history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}