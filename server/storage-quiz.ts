import { Pool } from 'pg';
import { Quiz, InsertQuiz, QuizSubmission, InsertQuizSubmission } from '@shared/schema';
import { pool } from './db';

// Quiz Management Methods
export async function getQuizzes(activeOnly: boolean = false): Promise<Quiz[]> {
  try {
    let query = `
      SELECT q.*, u.username as created_by_username
      FROM quizzes q
      LEFT JOIN users u ON q.created_by_id = u.id
    `;
    
    if (activeOnly) {
      query += ` WHERE q.is_active = true`;
    }
    
    query += ` ORDER BY q.created_at DESC`;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      createdById: row.created_by_id,
      questionCount: row.question_count,
      categories: row.categories,
      isActive: row.is_active,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    }));
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    throw error;
  }
}

export async function getQuiz(id: number): Promise<Quiz | undefined> {
  try {
    const query = `
      SELECT q.*, u.username as created_by_username
      FROM quizzes q
      LEFT JOIN users u ON q.created_by_id = u.id
      WHERE q.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      createdById: row.created_by_id,
      questionCount: row.question_count,
      categories: row.categories,
      isActive: row.is_active,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  } catch (error) {
    console.error(`Error fetching quiz ${id}:`, error);
    throw error;
  }
}

export async function createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
  try {
    const query = `
      INSERT INTO quizzes(
        title,
        description,
        created_by_id,
        question_count,
        categories,
        is_active,
        expires_at
      )
      VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      insertQuiz.title,
      insertQuiz.description || '',
      insertQuiz.createdById,
      insertQuiz.questionCount,
      JSON.stringify(insertQuiz.categories),
      insertQuiz.isActive,
      insertQuiz.expiresAt
    ];
    
    const result = await pool.query(query, values);
    const quiz = result.rows[0];
    
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdById: quiz.created_by_id,
      questionCount: quiz.question_count,
      categories: quiz.categories,
      isActive: quiz.is_active,
      createdAt: quiz.created_at,
      expiresAt: quiz.expires_at
    };
  } catch (error) {
    console.error("Error creating quiz:", error);
    throw error;
  }
}

export async function updateQuiz(id: number, updateData: Partial<InsertQuiz>): Promise<Quiz | undefined> {
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (updateData.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(updateData.title);
      paramIndex++;
    }
    
    if (updateData.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(updateData.description);
      paramIndex++;
    }
    
    if (updateData.questionCount !== undefined) {
      updates.push(`question_count = $${paramIndex}`);
      values.push(updateData.questionCount);
      paramIndex++;
    }
    
    if (updateData.categories !== undefined) {
      updates.push(`categories = $${paramIndex}`);
      values.push(JSON.stringify(updateData.categories));
      paramIndex++;
    }
    
    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(updateData.isActive);
      paramIndex++;
    }
    
    if (updateData.expiresAt !== undefined) {
      updates.push(`expires_at = $${paramIndex}`);
      values.push(updateData.expiresAt);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      console.warn(`No valid fields to update for quiz ${id}`);
      return undefined;
    }
    
    const query = `
      UPDATE quizzes
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const quiz = result.rows[0];
    
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdById: quiz.created_by_id,
      questionCount: quiz.question_count,
      categories: quiz.categories,
      isActive: quiz.is_active,
      createdAt: quiz.created_at,
      expiresAt: quiz.expires_at
    };
  } catch (error) {
    console.error(`Error updating quiz ${id}:`, error);
    throw error;
  }
}

export async function deleteQuiz(id: number): Promise<boolean> {
  try {
    const query = `DELETE FROM quizzes WHERE id = $1`;
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error(`Error deleting quiz ${id}:`, error);
    throw error;
  }
}

// Quiz Submission Methods
export async function getQuizSubmissions(quizId?: number, userId?: number): Promise<QuizSubmission[]> {
  try {
    let query = `
      SELECT qs.*, q.title as quiz_title, u.username
      FROM quiz_submissions qs
      LEFT JOIN quizzes q ON qs.quiz_id = q.id
      LEFT JOIN users u ON qs.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (quizId) {
      query += ` AND qs.quiz_id = $${paramIndex}`;
      params.push(quizId);
      paramIndex++;
    }
    
    if (userId) {
      query += ` AND qs.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    query += ` ORDER BY qs.submission_date DESC`;
    
    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      quizId: row.quiz_id,
      userId: row.user_id,
      submissionDate: row.submission_date,
      answers: row.answers,
      score: row.score,
      squadron: row.squadron
    }));
  } catch (error) {
    console.error("Error fetching quiz submissions:", error);
    throw error;
  }
}

export async function getQuizSubmission(id: number): Promise<QuizSubmission | undefined> {
  try {
    const query = `
      SELECT qs.*, q.title as quiz_title, u.username
      FROM quiz_submissions qs
      LEFT JOIN quizzes q ON qs.quiz_id = q.id
      LEFT JOIN users u ON qs.user_id = u.id
      WHERE qs.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    
    return {
      id: row.id,
      quizId: row.quiz_id,
      userId: row.user_id,
      submissionDate: row.submission_date,
      answers: row.answers,
      score: row.score,
      squadron: row.squadron
    };
  } catch (error) {
    console.error(`Error fetching quiz submission ${id}:`, error);
    throw error;
  }
}

export async function createQuizSubmission(insertSubmission: InsertQuizSubmission): Promise<QuizSubmission> {
  try {
    const query = `
      INSERT INTO quiz_submissions(
        quiz_id,
        user_id,
        answers,
        score,
        squadron
      )
      VALUES($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      insertSubmission.quizId,
      insertSubmission.userId,
      JSON.stringify(insertSubmission.answers),
      insertSubmission.score,
      insertSubmission.squadron
    ];
    
    const result = await pool.query(query, values);
    const submission = result.rows[0];
    
    return {
      id: submission.id,
      quizId: submission.quiz_id,
      userId: submission.user_id,
      submissionDate: submission.submission_date,
      answers: submission.answers,
      score: submission.score,
      squadron: submission.squadron
    };
  } catch (error) {
    console.error("Error creating quiz submission:", error);
    throw error;
  }
}