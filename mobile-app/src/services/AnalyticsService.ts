interface AnalyticsEvent {
  id: string;
  timestamp: string;
  userId?: number;
  event: string;
  properties?: Record<string, any>;
  screen?: string;
  sessionId: string;
}

interface UserSession {
  sessionId: string;
  userId?: number;
  startTime: string;
  endTime?: string;
  screenViews: string[];
  events: string[];
  duration?: number;
}

interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: 'app_start' | 'screen_load' | 'sync_duration' | 'quiz_completion' | 'load_plan_calculation';
  duration: number;
  details?: Record<string, any>;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessions: UserSession[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private currentSession: UserSession | null = null;
  private maxEvents = 1000;

  constructor() {
    this.startSession();
  }

  // Session Management
  startSession(userId?: number) {
    this.endCurrentSession();
    
    this.currentSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: new Date().toISOString(),
      screenViews: [],
      events: [],
    };
  }

  endCurrentSession() {
    if (this.currentSession) {
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.duration = new Date(this.currentSession.endTime).getTime() - 
                                   new Date(this.currentSession.startTime).getTime();
      this.sessions.push(this.currentSession);
      this.currentSession = null;
    }
  }

  // Event Tracking
  track(event: string, properties?: Record<string, any>, screen?: string) {
    if (!this.currentSession) {
      this.startSession();
    }

    const analyticsEvent: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentSession?.userId,
      event,
      properties,
      screen,
      sessionId: this.currentSession?.sessionId || 'unknown',
    };

    this.events.unshift(analyticsEvent);
    this.currentSession?.events.push(event);

    // Maintain event limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    if (__DEV__) {
      console.log(`[ANALYTICS] ${event}`, properties);
    }
  }

  // Screen Tracking
  screenView(screenName: string, properties?: Record<string, any>) {
    this.track('screen_view', { screen: screenName, ...properties }, screenName);
    this.currentSession?.screenViews.push(screenName);
  }

  // User Actions
  userLogin(userId: number, method: 'credentials' | 'offline') {
    this.startSession(userId);
    this.track('user_login', { method, userId });
  }

  userLogout() {
    this.track('user_logout');
    this.endCurrentSession();
  }

  // Quiz Analytics
  quizStarted(quizId: string, questionCount: number) {
    this.track('quiz_started', { quizId, questionCount });
  }

  quizCompleted(quizId: string, score: number, timeSpent: number, correctAnswers: number, totalQuestions: number) {
    this.track('quiz_completed', {
      quizId,
      score,
      timeSpent,
      correctAnswers,
      totalQuestions,
      accuracy: (correctAnswers / totalQuestions) * 100,
    });
  }

  questionAnswered(questionId: string, isCorrect: boolean, timeSpent: number) {
    this.track('question_answered', { questionId, isCorrect, timeSpent });
  }

  // Load Planning Analytics
  loadPlanStarted(aircraftType: string) {
    this.track('load_plan_started', { aircraftType });
  }

  loadPlanCompleted(aircraftType: string, totalWeight: number, balanceStatus: string) {
    this.track('load_plan_completed', { aircraftType, totalWeight, balanceStatus });
  }

  cargoItemPlaced(itemType: string, weight: number, position: string) {
    this.track('cargo_item_placed', { itemType, weight, position });
  }

  // Scenario Analytics
  scenarioStarted(scenarioId: string, scenarioType: string) {
    this.track('scenario_started', { scenarioId, scenarioType });
  }

  scenarioCompleted(scenarioId: string, score: number, timeSpent: number) {
    this.track('scenario_completed', { scenarioId, score, timeSpent });
  }

  // Sync Analytics
  syncStarted(dataTypes: string[]) {
    this.track('sync_started', { dataTypes });
  }

  syncCompleted(syncedItems: number, errors: string[]) {
    this.track('sync_completed', { syncedItems, errorCount: errors.length, errors });
  }

  // Performance Tracking
  recordPerformance(metric: PerformanceMetric['metric'], duration: number, details?: Record<string, any>) {
    const performanceMetric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric,
      duration,
      details,
    };

    this.performanceMetrics.unshift(performanceMetric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(0, 500);
    }
  }

  // Error Tracking
  recordError(error: string, context: string, userId?: number) {
    this.track('error_occurred', {
      error,
      context,
      userId,
    });
  }

  // Data Export
  getAnalyticsData() {
    return {
      events: this.events,
      sessions: this.sessions,
      performanceMetrics: this.performanceMetrics,
      currentSession: this.currentSession,
    };
  }

  getSessionSummary(): Record<string, any> {
    const totalSessions = this.sessions.length;
    const avgSessionDuration = this.sessions.reduce((sum, session) => 
      sum + (session.duration || 0), 0) / totalSessions;
    
    const topScreens = this.events
      .filter(e => e.event === 'screen_view')
      .reduce((acc, e) => {
        const screen = e.properties?.screen || 'unknown';
        acc[screen] = (acc[screen] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topEvents = this.events
      .reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalSessions,
      avgSessionDuration: Math.round(avgSessionDuration / 1000), // Convert to seconds
      totalEvents: this.events.length,
      topScreens,
      topEvents,
      performanceMetrics: {
        avgAppStart: this.getAvgPerformance('app_start'),
        avgScreenLoad: this.getAvgPerformance('screen_load'),
        avgSyncDuration: this.getAvgPerformance('sync_duration'),
      },
    };
  }

  private getAvgPerformance(metric: PerformanceMetric['metric']): number {
    const metrics = this.performanceMetrics.filter(m => m.metric === metric);
    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length);
  }

  // Clear data
  clearAnalytics() {
    this.events = [];
    this.sessions = [];
    this.performanceMetrics = [];
    this.endCurrentSession();
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;