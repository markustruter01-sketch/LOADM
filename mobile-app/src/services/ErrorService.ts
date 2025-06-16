interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context?: any;
  userId?: number;
}

class ErrorService {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(level: ErrorLog['level'], message: string, error?: Error, context?: any, userId?: number) {
    const errorLog: ErrorLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      stack: error?.stack,
      context,
      userId,
    };

    this.logs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging for development
    if (__DEV__) {
      const consoleMethod = level === 'error' || level === 'critical' ? 'error' : 
                           level === 'warning' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, error || '', context || '');
    }
  }

  info(message: string, context?: any, userId?: number) {
    this.log('info', message, undefined, context, userId);
  }

  warning(message: string, context?: any, userId?: number) {
    this.log('warning', message, undefined, context, userId);
  }

  error(message: string, error?: Error, context?: any, userId?: number) {
    this.log('error', message, error, context, userId);
  }

  critical(message: string, error?: Error, context?: any, userId?: number) {
    this.log('critical', message, error, context, userId);
  }

  getLogs(level?: ErrorLog['level']): ErrorLog[] {
    if (!level) return this.logs;
    return this.logs.filter(log => log.level === level);
  }

  clearLogs() {
    this.logs = [];
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }

  // Network error handler
  handleNetworkError(error: any, context: string) {
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      this.warning(`Network connectivity issue in ${context}`, { error: error.message });
      return 'Please check your internet connection and try again.';
    }
    return null;
  }

  // Database error handler
  handleDatabaseError(error: any, operation: string) {
    this.error(`Database operation failed: ${operation}`, error, { operation });
    return 'A data storage error occurred. Please try again.';
  }

  // Authentication error handler
  handleAuthError(error: any, context: string) {
    this.warning(`Authentication issue in ${context}`, { error: error.message });
    return 'Authentication required. Please log in again.';
  }

  // General error handler with user-friendly messages
  handleError(error: any, context: string): string {
    // Network errors
    const networkMessage = this.handleNetworkError(error, context);
    if (networkMessage) return networkMessage;

    // Authentication errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return this.handleAuthError(error, context);
    }

    // Database errors
    if (error.message?.includes('database') || error.message?.includes('SQLite')) {
      return this.handleDatabaseError(error, context);
    }

    // Generic error
    this.error(`Unexpected error in ${context}`, error, { context });
    return 'An unexpected error occurred. Please try again.';
  }
}

export const errorService = new ErrorService();

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorService.critical('Unhandled promise rejection', event.reason, {
      promise: event.promise,
    });
  });
}

export default ErrorService;