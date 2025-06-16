interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface MemoryUsage {
  timestamp: number;
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private memorySnapshots: MemoryUsage[] = [];
  private maxMetrics = 200;
  private maxMemorySnapshots = 50;
  private performanceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startPerformanceMonitoring();
  }

  // Start tracking a performance metric
  startMetric(name: string, metadata?: Record<string, any>): string {
    const metricId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.push(metric);
    return metricId;
  }

  // End tracking a performance metric
  endMetric(name: string, metadata?: Record<string, any>) {
    const metric = this.metrics.find(m => m.name === name && !m.endTime);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      if (metadata) {
        metric.metadata = { ...metric.metadata, ...metadata };
      }
    }

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Track screen load performance
  trackScreenLoad(screenName: string) {
    this.startMetric(`screen_load_${screenName}`, { screen: screenName });
    
    // Use requestAnimationFrame to measure when rendering is complete
    requestAnimationFrame(() => {
      this.endMetric(`screen_load_${screenName}`, { completed: true });
    });
  }

  // Track database operation performance
  trackDatabaseOperation(operation: string, query?: string) {
    const startTime = performance.now();
    
    return {
      end: (success: boolean, recordCount?: number) => {
        const duration = performance.now() - startTime;
        this.metrics.push({
          name: `db_${operation}`,
          startTime,
          endTime: performance.now(),
          duration,
          metadata: {
            operation,
            query: query?.substring(0, 100), // Truncate long queries
            success,
            recordCount,
          },
        });
      },
    };
  }

  // Track sync operation performance
  trackSyncOperation(syncType: string, itemCount: number) {
    const startTime = performance.now();
    
    return {
      end: (success: boolean, syncedCount: number, errors: string[]) => {
        const duration = performance.now() - startTime;
        this.metrics.push({
          name: `sync_${syncType}`,
          startTime,
          endTime: performance.now(),
          duration,
          metadata: {
            syncType,
            itemCount,
            syncedCount,
            success,
            errorCount: errors.length,
            errors: errors.slice(0, 5), // Keep only first 5 errors
          },
        });
      },
    };
  }

  // Track quiz performance
  trackQuizPerformance(quizId: string, questionCount: number) {
    const startTime = performance.now();
    
    return {
      questionAnswered: (questionId: string, isCorrect: boolean) => {
        this.metrics.push({
          name: 'quiz_question_answered',
          startTime: performance.now(),
          endTime: performance.now(),
          duration: 0,
          metadata: {
            quizId,
            questionId,
            isCorrect,
          },
        });
      },
      
      end: (score: number, correctAnswers: number) => {
        const duration = performance.now() - startTime;
        this.metrics.push({
          name: 'quiz_completed',
          startTime,
          endTime: performance.now(),
          duration,
          metadata: {
            quizId,
            questionCount,
            score,
            correctAnswers,
            accuracy: (correctAnswers / questionCount) * 100,
            avgTimePerQuestion: duration / questionCount,
          },
        });
      },
    };
  }

  // Memory monitoring
  private startPerformanceMonitoring() {
    this.performanceTimer = setInterval(() => {
      this.captureMemorySnapshot();
    }, 30000); // Every 30 seconds
  }

  private captureMemorySnapshot() {
    // Memory monitoring for React Native is limited, but we can track basic metrics
    const memoryUsage: MemoryUsage = {
      timestamp: Date.now(),
      jsHeapSizeUsed: 0, // Not available in React Native
      jsHeapSizeTotal: 0, // Not available in React Native
      jsHeapSizeLimit: 0, // Not available in React Native
    };

    this.memorySnapshots.push(memoryUsage);

    // Keep only recent snapshots
    if (this.memorySnapshots.length > this.maxMemorySnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.maxMemorySnapshots);
    }
  }

  // Get performance analytics
  getPerformanceAnalytics() {
    const screenLoadMetrics = this.metrics.filter(m => m.name.startsWith('screen_load_'));
    const dbMetrics = this.metrics.filter(m => m.name.startsWith('db_'));
    const syncMetrics = this.metrics.filter(m => m.name.startsWith('sync_'));
    const quizMetrics = this.metrics.filter(m => m.name === 'quiz_completed');

    return {
      screenLoads: {
        count: screenLoadMetrics.length,
        avgDuration: this.calculateAverageDuration(screenLoadMetrics),
        slowestScreen: this.findSlowestMetric(screenLoadMetrics),
      },
      database: {
        count: dbMetrics.length,
        avgDuration: this.calculateAverageDuration(dbMetrics),
        slowestOperation: this.findSlowestMetric(dbMetrics),
        successRate: this.calculateSuccessRate(dbMetrics),
      },
      sync: {
        count: syncMetrics.length,
        avgDuration: this.calculateAverageDuration(syncMetrics),
        successRate: this.calculateSuccessRate(syncMetrics),
        totalItemsSynced: syncMetrics.reduce((sum, m) => sum + (m.metadata?.syncedCount || 0), 0),
      },
      quizzes: {
        count: quizMetrics.length,
        avgDuration: this.calculateAverageDuration(quizMetrics),
        avgAccuracy: this.calculateAverageAccuracy(quizMetrics),
        avgTimePerQuestion: this.calculateAverageTimePerQuestion(quizMetrics),
      },
    };
  }

  private calculateAverageDuration(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const validMetrics = metrics.filter(m => m.duration !== undefined);
    if (validMetrics.length === 0) return 0;
    return validMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / validMetrics.length;
  }

  private findSlowestMetric(metrics: PerformanceMetric[]): PerformanceMetric | null {
    if (metrics.length === 0) return null;
    return metrics.reduce((slowest, current) => 
      (current.duration || 0) > (slowest.duration || 0) ? current : slowest
    );
  }

  private calculateSuccessRate(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const successfulMetrics = metrics.filter(m => m.metadata?.success === true);
    return (successfulMetrics.length / metrics.length) * 100;
  }

  private calculateAverageAccuracy(quizMetrics: PerformanceMetric[]): number {
    if (quizMetrics.length === 0) return 0;
    const totalAccuracy = quizMetrics.reduce((sum, m) => sum + (m.metadata?.accuracy || 0), 0);
    return totalAccuracy / quizMetrics.length;
  }

  private calculateAverageTimePerQuestion(quizMetrics: PerformanceMetric[]): number {
    if (quizMetrics.length === 0) return 0;
    const totalTime = quizMetrics.reduce((sum, m) => sum + (m.metadata?.avgTimePerQuestion || 0), 0);
    return totalTime / quizMetrics.length;
  }

  // Export performance data
  exportPerformanceData() {
    return {
      metrics: this.metrics,
      memorySnapshots: this.memorySnapshots,
      analytics: this.getPerformanceAnalytics(),
      exportTime: new Date().toISOString(),
    };
  }

  // Clear performance data
  clearPerformanceData() {
    this.metrics = [];
    this.memorySnapshots = [];
  }

  // Stop performance monitoring
  stopMonitoring() {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const analytics = this.getPerformanceAnalytics();

    // Screen load suggestions
    if (analytics.screenLoads.avgDuration > 1000) {
      suggestions.push('Consider optimizing screen components - average load time is over 1 second');
    }

    // Database suggestions
    if (analytics.database.avgDuration > 500) {
      suggestions.push('Database operations are slow - consider adding indexes or optimizing queries');
    }

    if (analytics.database.successRate < 95) {
      suggestions.push('Database operations have high failure rate - check error handling');
    }

    // Sync suggestions
    if (analytics.sync.avgDuration > 5000) {
      suggestions.push('Sync operations are taking too long - consider batch optimization');
    }

    if (analytics.sync.successRate < 90) {
      suggestions.push('Sync operations have high failure rate - check network error handling');
    }

    // Quiz suggestions
    if (analytics.quizzes.avgTimePerQuestion > 30000) {
      suggestions.push('Users are taking too long per question - consider UI/UX improvements');
    }

    return suggestions;
  }
}

export const performanceService = new PerformanceService();
export default PerformanceService;