import * as SQLite from 'expo-sqlite';

export class OfflineDataService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  // Quiz Management
  async getQuizzes(): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM quizzes WHERE is_active = 1 ORDER BY created_at DESC'
    );
  }

  async getQuizQuestions(quizId: number): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC',
      [quizId]
    );
  }

  async saveQuizSubmission(submission: {
    quizId: number;
    userId: number;
    answers: any;
    score: number;
    passed: boolean;
  }): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO quiz_submissions 
       (quiz_id, user_id, answers, score, passed, submitted_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        submission.quizId,
        submission.userId,
        JSON.stringify(submission.answers),
        submission.score,
        submission.passed ? 1 : 0,
        new Date().toISOString(),
        0
      ]
    );
    return result.lastInsertRowId as number;
  }

  async getUserQuizSubmissions(userId: number): Promise<any[]> {
    return await this.db.getAllAsync(
      `SELECT qs.*, q.title as quiz_title 
       FROM quiz_submissions qs 
       JOIN quizzes q ON qs.quiz_id = q.id 
       WHERE qs.user_id = ? 
       ORDER BY qs.submitted_at DESC`,
      [userId]
    );
  }

  // Scenario Management
  async getScenarios(): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM scenarios WHERE is_active = 1 ORDER BY created_at DESC'
    );
  }

  async saveScenarioSubmission(submission: {
    scenarioId: number;
    userId: number;
    formData: any;
    answers: any;
    score?: number;
    passed?: boolean;
  }): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO scenario_submissions 
       (scenario_id, user_id, form_data, answers, score, passed, submitted_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submission.scenarioId,
        submission.userId,
        JSON.stringify(submission.formData),
        JSON.stringify(submission.answers),
        submission.score || 0,
        submission.passed ? 1 : 0,
        new Date().toISOString(),
        0
      ]
    );
    return result.lastInsertRowId as number;
  }

  // Load Plan Management
  async saveLoadPlan(plan: {
    title: string;
    aircraftType: string;
    userId: number;
    cargoData: any;
    balanceData: any;
  }): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO load_plans 
       (title, aircraft_type, user_id, cargo_data, balance_data, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        plan.title,
        plan.aircraftType,
        plan.userId,
        JSON.stringify(plan.cargoData),
        JSON.stringify(plan.balanceData),
        new Date().toISOString(),
        0
      ]
    );
    return result.lastInsertRowId as number;
  }

  async getUserLoadPlans(userId: number): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM load_plans WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async updateLoadPlan(id: number, cargoData: any, balanceData: any): Promise<void> {
    await this.db.runAsync(
      'UPDATE load_plans SET cargo_data = ?, balance_data = ?, synced = 0 WHERE id = ?',
      [JSON.stringify(cargoData), JSON.stringify(balanceData), id]
    );
  }

  // Chat Management
  async getChatMessages(limit: number = 50): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM chat_messages ORDER BY timestamp ASC LIMIT ?',
      [limit]
    );
  }

  async saveChatMessage(message: {
    userId: number;
    message: string;
  }): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO chat_messages (user_id, message, timestamp, synced) VALUES (?, ?, ?, ?)',
      [message.userId, message.message, new Date().toISOString(), 0]
    );
    return result.lastInsertRowId as number;
  }

  // Documents Management
  async getDocuments(): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM documents WHERE is_active = 1 ORDER BY title ASC'
    );
  }

  // Sync Queue Management
  async addToSyncQueue(tableName: string, recordId: number, action: string, data?: any): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, action, data) VALUES (?, ?, ?, ?)',
      [tableName, recordId, action, JSON.stringify(data || {})]
    );
  }

  async getSyncQueue(): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM sync_queue ORDER BY created_at ASC'
    );
  }

  async clearSyncQueue(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `DELETE FROM sync_queue WHERE id IN (${placeholders})`,
      ids
    );
  }

  // User Management
  async updateUser(userId: number, userData: any): Promise<void> {
    await this.db.runAsync(
      `UPDATE users SET 
       first_name = ?, last_name = ?, squadron = ?, category = ?, updated_at = ? 
       WHERE id = ?`,
      [
        userData.firstName || '',
        userData.lastName || '',
        userData.squadron || '',
        userData.category || '',
        new Date().toISOString(),
        userId
      ]
    );
  }

  // Statistics and Analytics
  async getUserStats(userId: number): Promise<any> {
    const quizCount = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM quiz_submissions WHERE user_id = ?',
      [userId]
    );

    const quizPassed = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM quiz_submissions WHERE user_id = ? AND passed = 1',
      [userId]
    );

    const scenarioCount = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM scenario_submissions WHERE user_id = ?',
      [userId]
    );

    const loadPlanCount = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM load_plans WHERE user_id = ?',
      [userId]
    );

    return {
      quizzesCompleted: quizCount?.count || 0,
      quizzesPassed: quizPassed?.count || 0,
      scenariosCompleted: scenarioCount?.count || 0,
      loadPlansCreated: loadPlanCount?.count || 0,
    };
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<any[]> {
    const activities = [];

    // Recent quiz submissions
    const quizzes = await this.db.getAllAsync(
      `SELECT 'quiz' as type, q.title, qs.score, qs.passed, qs.submitted_at as timestamp
       FROM quiz_submissions qs
       JOIN quizzes q ON qs.quiz_id = q.id
       WHERE qs.user_id = ?
       ORDER BY qs.submitted_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    // Recent scenario submissions
    const scenarios = await this.db.getAllAsync(
      `SELECT 'scenario' as type, s.title, ss.score, ss.passed, ss.submitted_at as timestamp
       FROM scenario_submissions ss
       JOIN scenarios s ON ss.scenario_id = s.id
       WHERE ss.user_id = ?
       ORDER BY ss.submitted_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    // Recent load plans
    const loadPlans = await this.db.getAllAsync(
      `SELECT 'load_plan' as type, title, aircraft_type as aircraft, created_at as timestamp
       FROM load_plans
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    activities.push(...quizzes, ...scenarios, ...loadPlans);
    
    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}