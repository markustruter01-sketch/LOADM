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
  notes: z.string().optional()
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

      const { scenarioId, answers, studentName, studentId, squadron, timeSpent, notes } = validationResult.data;
      console.log('✅ Validated submission data:', { scenarioId, answerCount: answers.length });

      // Verify scenario exists
      const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
      if (scenario.length === 0) {
        console.log('❌ Scenario not found:', scenarioId);
        return res.status(404).json({ error: 'Scenario not found' });
      }

      console.log('✅ Scenario verified:', scenario[0].title);

      // Create metadata object
      const metadata = {
        studentName: studentName || '',
        studentId: studentId || '',
        squadron: squadron || 'AMG',
        timeSpent: timeSpent || 0,
        notes: notes || ''
      };

      // Insert submission into database
      const [submission] = await db.insert(scenarioSubmissions).values({
        scenarioId,
        userId,
        answers,
        metadata,
        status: 'submitted'
      }).returning();

      console.log('✅ Submission created successfully:', submission.id);

      // Return clean response
      const response = {
        id: submission.id,
        scenarioId: submission.scenarioId,
        userId: submission.userId,
        submissionDate: submission.submissionDate,
        status: submission.status,
        answers: submission.answers,
        metadata: submission.metadata
      };

      res.status(201).json(response);

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
        metadata: scenarioSubmissions.metadata,
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

  // Get all submissions (admin/instructor view)
  static async getAllSubmissions(req: AuthRequest, res: Response) {
    console.log('📊 NEW SCENARIO SUBMISSION SERVICE - Get all submissions');
    
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For now, allow all authenticated users to see all submissions
      // In production, you might want to check for admin/instructor roles
      
      const submissions = await db.select({
        id: scenarioSubmissions.id,
        scenarioId: scenarioSubmissions.scenarioId,
        userId: scenarioSubmissions.userId,
        submissionDate: scenarioSubmissions.submissionDate,
        status: scenarioSubmissions.status,
        score: scenarioSubmissions.score,
        passed: scenarioSubmissions.passed,
        metadata: scenarioSubmissions.metadata,
        answers: scenarioSubmissions.answers,
        instructorFeedback: scenarioSubmissions.instructorFeedback,
        scenarioTitle: scenarios.title
      })
      .from(scenarioSubmissions)
      .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id));

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

      const [submission] = await db.select()
        .from(scenarioSubmissions)
        .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id))
        .where(eq(scenarioSubmissions.id, submissionId))
        .limit(1);

      if (!submission) {
        console.log('❌ Submission not found:', submissionId);
        return res.status(404).json({ error: 'Submission not found' });
      }

      console.log('✅ Submission found');

      res.json(submission);

    } catch (error) {
      console.error('❌ Failed to get submission:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve submission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}