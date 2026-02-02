import * as SQLite from 'expo-sqlite';

export interface Qualification {
  id?: number;
  userId: number;
  name: string;
  startDate: string;
  expiryDate?: string | null;
  synced?: boolean;
}

export interface FlightRecord {
  id?: number;
  userId: number;
  date: string;
  callsign?: string;
  departure: string;
  arrival: string;
  captain: string;
  passengersCarried?: number;
  cargoWeight?: number;
  nightHours?: number;
  dayHours?: number;
  synced?: boolean;
}

export interface FlightStatistics {
  totalFlightHours: number;
  nightHours: number;
  dayHours: number;
  totalCargoWeight: number;
  totalPassengers: number;
  totalMissions: number;
}

export class OfflineDataService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  // ==========================================
  // USER QUALIFICATIONS MANAGEMENT
  // ==========================================

  async getUserQualifications(userId: number): Promise<Qualification[]> {
    const results = await this.db.getAllAsync(
      'SELECT * FROM user_qualifications WHERE user_id = ? ORDER BY expiry_date ASC',
      [userId]
    );
    return results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      synced: Boolean(row.synced),
    }));
  }

  async saveQualification(qualification: Qualification): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO user_qualifications 
       (user_id, name, start_date, expiry_date, created_at, updated_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        qualification.userId,
        qualification.name,
        qualification.startDate,
        qualification.expiryDate || null,
        new Date().toISOString(),
        new Date().toISOString(),
        0
      ]
    );
    return result.lastInsertRowId as number;
  }

  async updateQualification(id: number, qualification: Partial<Qualification>): Promise<void> {
    await this.db.runAsync(
      `UPDATE user_qualifications SET 
       name = COALESCE(?, name),
       start_date = COALESCE(?, start_date),
       expiry_date = ?,
       updated_at = ?,
       synced = 0
       WHERE id = ?`,
      [
        qualification.name || null,
        qualification.startDate || null,
        qualification.expiryDate || null,
        new Date().toISOString(),
        id
      ]
    );
  }

  async deleteQualification(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM user_qualifications WHERE id = ?', [id]);
  }

  async getExpiringQualifications(userId: number, daysThreshold: number = 90): Promise<Qualification[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    const results = await this.db.getAllAsync(
      `SELECT * FROM user_qualifications 
       WHERE user_id = ? 
       AND expiry_date IS NOT NULL 
       AND expiry_date <= ? 
       AND expiry_date >= date('now')
       ORDER BY expiry_date ASC`,
      [userId, thresholdDate.toISOString().split('T')[0]]
    );
    return results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      synced: Boolean(row.synced),
    }));
  }

  // ==========================================
  // FLIGHT RECORDS MANAGEMENT
  // ==========================================

  async getUserFlightRecords(userId: number): Promise<FlightRecord[]> {
    const results = await this.db.getAllAsync(
      'SELECT * FROM flight_records WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    return results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      callsign: row.callsign,
      departure: row.departure,
      arrival: row.arrival,
      captain: row.captain,
      passengersCarried: row.passengers_carried,
      cargoWeight: row.cargo_weight,
      nightHours: row.night_hours,
      dayHours: row.day_hours,
      synced: Boolean(row.synced),
    }));
  }

  async saveFlightRecord(record: FlightRecord): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO flight_records 
       (user_id, date, callsign, departure, arrival, captain, passengers_carried, cargo_weight, night_hours, day_hours, created_at, updated_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.userId,
        record.date,
        record.callsign || null,
        record.departure,
        record.arrival,
        record.captain,
        record.passengersCarried || 0,
        record.cargoWeight || 0,
        record.nightHours || 0,
        record.dayHours || 0,
        new Date().toISOString(),
        new Date().toISOString(),
        0
      ]
    );
    return result.lastInsertRowId as number;
  }

  async updateFlightRecord(id: number, record: Partial<FlightRecord>): Promise<void> {
    await this.db.runAsync(
      `UPDATE flight_records SET 
       date = COALESCE(?, date),
       callsign = COALESCE(?, callsign),
       departure = COALESCE(?, departure),
       arrival = COALESCE(?, arrival),
       captain = COALESCE(?, captain),
       passengers_carried = COALESCE(?, passengers_carried),
       cargo_weight = COALESCE(?, cargo_weight),
       night_hours = COALESCE(?, night_hours),
       day_hours = COALESCE(?, day_hours),
       updated_at = ?,
       synced = 0
       WHERE id = ?`,
      [
        record.date || null,
        record.callsign || null,
        record.departure || null,
        record.arrival || null,
        record.captain || null,
        record.passengersCarried ?? null,
        record.cargoWeight ?? null,
        record.nightHours ?? null,
        record.dayHours ?? null,
        new Date().toISOString(),
        id
      ]
    );
  }

  async deleteFlightRecord(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM flight_records WHERE id = ?', [id]);
  }

  async getFlightStatistics(userId: number): Promise<FlightStatistics> {
    const stats = await this.db.getFirstAsync(
      `SELECT 
       COALESCE(SUM(night_hours + day_hours), 0) as total_flight_hours,
       COALESCE(SUM(night_hours), 0) as night_hours,
       COALESCE(SUM(day_hours), 0) as day_hours,
       COALESCE(SUM(cargo_weight), 0) as total_cargo_weight,
       COALESCE(SUM(passengers_carried), 0) as total_passengers,
       COUNT(*) as total_missions
       FROM flight_records WHERE user_id = ?`,
      [userId]
    );

    return {
      totalFlightHours: (stats as any)?.total_flight_hours || 0,
      nightHours: (stats as any)?.night_hours || 0,
      dayHours: (stats as any)?.day_hours || 0,
      totalCargoWeight: (stats as any)?.total_cargo_weight || 0,
      totalPassengers: (stats as any)?.total_passengers || 0,
      totalMissions: (stats as any)?.total_missions || 0,
    };
  }

  // ==========================================
  // QUIZ MANAGEMENT
  // ==========================================

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

  // ==========================================
  // SCENARIO MANAGEMENT
  // ==========================================

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

  // ==========================================
  // LOAD PLAN MANAGEMENT
  // ==========================================

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

  // ==========================================
  // CHAT MANAGEMENT
  // ==========================================

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

  // ==========================================
  // DOCUMENTS MANAGEMENT
  // ==========================================

  async getDocuments(): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM documents WHERE is_active = 1 ORDER BY title ASC'
    );
  }

  // ==========================================
  // SYNC QUEUE MANAGEMENT
  // ==========================================

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

  // ==========================================
  // PENDING SYNC DATA
  // ==========================================

  async getPendingQualifications(userId: number): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM user_qualifications WHERE user_id = ? AND synced = 0',
      [userId]
    );
  }

  async getPendingFlightRecords(userId: number): Promise<any[]> {
    return await this.db.getAllAsync(
      'SELECT * FROM flight_records WHERE user_id = ? AND synced = 0',
      [userId]
    );
  }

  async markQualificationSynced(id: number): Promise<void> {
    await this.db.runAsync(
      'UPDATE user_qualifications SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  async markFlightRecordSynced(id: number): Promise<void> {
    await this.db.runAsync(
      'UPDATE flight_records SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  async updateUser(userId: number, userData: any): Promise<void> {
    await this.db.runAsync(
      `UPDATE users SET 
       first_name = ?, last_name = ?, squadron = ?, category = ?, rank = ?, updated_at = ? 
       WHERE id = ?`,
      [
        userData.firstName || '',
        userData.lastName || '',
        userData.squadron || '',
        userData.category || '',
        userData.rank || '',
        new Date().toISOString(),
        userId
      ]
    );
  }

  // ==========================================
  // STATISTICS AND ANALYTICS
  // ==========================================

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

    const qualificationCount = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM user_qualifications WHERE user_id = ?',
      [userId]
    );

    const flightStats = await this.getFlightStatistics(userId);

    return {
      quizzesCompleted: (quizCount as any)?.count || 0,
      quizzesPassed: (quizPassed as any)?.count || 0,
      scenariosCompleted: (scenarioCount as any)?.count || 0,
      loadPlansCreated: (loadPlanCount as any)?.count || 0,
      qualificationsActive: (qualificationCount as any)?.count || 0,
      totalFlightHours: flightStats.totalFlightHours,
      totalMissions: flightStats.totalMissions,
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

    // Recent flight records
    const flights = await this.db.getAllAsync(
      `SELECT 'flight' as type, callsign as title, departure, arrival, date as timestamp
       FROM flight_records
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT ?`,
      [userId, limit]
    );

    activities.push(...quizzes, ...scenarios, ...loadPlans, ...flights);
    
    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}
