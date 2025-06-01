// Browser Console Error Monitor and Auto-Fix System 🔷
import fs from 'fs';
import path from 'path';

interface ConsoleError {
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  line?: number;
  timestamp: Date;
  stack?: string;
}

interface AutoFixPattern {
  pattern: RegExp;
  description: string;
  fixFunction: (error: ConsoleError) => Promise<boolean>;
  priority: 'high' | 'medium' | 'low';
}

class BrowserConsoleMonitor {
  private errorLog: ConsoleError[] = [];
  private autoFixPatterns: AutoFixPattern[] = [];

  constructor() {
    this.initializeAutoFixPatterns();
  }

  private initializeAutoFixPatterns() {
    this.autoFixPatterns = [
      {
        pattern: /Cannot read properties of undefined \(reading 'method'\)/,
        description: 'API request method undefined - fixing fetch call structure',
        fixFunction: this.fixApiMethodError.bind(this),
        priority: 'high'
      },
      {
        pattern: /TypeError.*Cannot read properties of undefined/,
        description: 'Undefined property access - adding null checks',
        fixFunction: this.fixUndefinedPropertyError.bind(this),
        priority: 'high'
      },
      {
        pattern: /401.*Authentication required/,
        description: 'Authentication failure - fixing session management',
        fixFunction: this.fixAuthenticationError.bind(this),
        priority: 'high'
      },
      {
        pattern: /Network request failed|fetch.*failed/,
        description: 'Network request failure - improving error handling',
        fixFunction: this.fixNetworkError.bind(this),
        priority: 'medium'
      },
      {
        pattern: /React.*Warning.*Each child in a list should have a unique "key"/,
        description: 'React key warning - adding proper key props',
        fixFunction: this.fixReactKeyWarning.bind(this),
        priority: 'low'
      }
    ];
  }

  // Monitor and analyze console errors
  public analyzeConsoleErrors(errors: string[]): ConsoleError[] {
    const parsedErrors: ConsoleError[] = [];
    
    for (const errorString of errors) {
      try {
        const error = this.parseConsoleError(errorString);
        if (error) {
          parsedErrors.push(error);
          this.errorLog.push(error);
        }
      } catch (e) {
        console.warn('Failed to parse console error:', errorString);
      }
    }
    
    return parsedErrors;
  }

  private parseConsoleError(errorString: string): ConsoleError | null {
    // Parse different console error formats
    if (errorString.includes('TypeError:') || errorString.includes('Error:')) {
      const lines = errorString.split('\n');
      const mainLine = lines[0];
      
      return {
        type: 'error',
        message: mainLine,
        source: this.extractSource(errorString),
        line: this.extractLineNumber(errorString),
        timestamp: new Date(),
        stack: lines.slice(1).join('\n')
      };
    }
    
    return null;
  }

  private extractSource(errorString: string): string {
    const sourceMatch = errorString.match(/at\s+(.+?):\d+:\d+/);
    return sourceMatch ? sourceMatch[1] : 'unknown';
  }

  private extractLineNumber(errorString: string): number | undefined {
    const lineMatch = errorString.match(/:(\d+):\d+/);
    return lineMatch ? parseInt(lineMatch[1]) : undefined;
  }

  // Auto-fix implementations
  private async fixApiMethodError(error: ConsoleError): Promise<boolean> {
    console.log('🔧 Fixing API method error...');
    
    // Fix the quiz deletion method issue
    const quizIndexPath = 'client/src/pages/instructors-portal/quizzes/index.tsx';
    
    try {
      if (fs.existsSync(quizIndexPath)) {
        let content = fs.readFileSync(quizIndexPath, 'utf8');
        
        // Replace apiRequest with direct fetch
        if (content.includes('apiRequest({')) {
          content = content.replace(
            /const response = await apiRequest\(\{[\s\S]*?\}\);/g,
            `const response = await fetch(\`/api/quizzes/\${id}\`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });`
          );
          
          fs.writeFileSync(quizIndexPath, content);
          console.log('✅ Fixed API method error in quiz deletion');
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to fix API method error:', e);
    }
    
    return false;
  }

  private async fixUndefinedPropertyError(error: ConsoleError): Promise<boolean> {
    console.log('🔧 Adding null checks for undefined properties...');
    
    // Add null checks to common problematic areas
    const filesToCheck = [
      'client/src/pages/instructors-portal/quizzes/index.tsx',
      'client/src/pages/instructors-portal/scenarios/index.tsx'
    ];
    
    for (const filePath of filesToCheck) {
      try {
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf8');
          let modified = false;
          
          // Add null checks for response handling
          if (content.includes('response.') && !content.includes('response?.')) {
            content = content.replace(/response\.(\w+)/g, 'response?.$1');
            modified = true;
          }
          
          // Add null checks for user object
          if (content.includes('user.') && !content.includes('user?.')) {
            content = content.replace(/user\.(\w+)/g, 'user?.$1');
            modified = true;
          }
          
          if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Added null checks to ${filePath}`);
          }
        }
      } catch (e) {
        console.error(`Failed to fix undefined property in ${filePath}:`, e);
      }
    }
    
    return true;
  }

  private async fixAuthenticationError(error: ConsoleError): Promise<boolean> {
    console.log('🔧 Fixing authentication and session management...');
    
    // Check and fix authentication middleware
    const authPath = 'server/middleware/auth.ts';
    
    try {
      if (fs.existsSync(authPath)) {
        let content = fs.readFileSync(authPath, 'utf8');
        
        // Ensure proper session validation
        if (!content.includes('req.session?.user')) {
          content = content.replace(
            /req\.session\.user/g,
            'req.session?.user'
          );
          
          fs.writeFileSync(authPath, content);
          console.log('✅ Fixed session validation in authentication middleware');
        }
      }
      
      // Fix session cookie handling in API calls
      const apiClientPath = 'client/src/lib/queryClient.ts';
      if (fs.existsSync(apiClientPath)) {
        let content = fs.readFileSync(apiClientPath, 'utf8');
        
        // Ensure credentials are included
        if (!content.includes("credentials: 'include'")) {
          content = content.replace(
            /headers:\s*\{/g,
            `credentials: 'include',
      headers: {`
          );
          
          fs.writeFileSync(apiClientPath, content);
          console.log('✅ Fixed credentials handling in API client');
        }
      }
      
      return true;
    } catch (e) {
      console.error('Failed to fix authentication error:', e);
      return false;
    }
  }

  private async fixNetworkError(error: ConsoleError): Promise<boolean> {
    console.log('🔧 Improving network error handling...');
    
    // Add better error handling to API calls
    const queryClientPath = 'client/src/lib/queryClient.ts';
    
    try {
      if (fs.existsSync(queryClientPath)) {
        let content = fs.readFileSync(queryClientPath, 'utf8');
        
        // Add retry logic for failed requests
        if (!content.includes('retry:')) {
          content = content.replace(
            /defaultOptions:\s*\{/,
            `defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },`
          );
          
          fs.writeFileSync(queryClientPath, content);
          console.log('✅ Added retry logic for network requests');
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to fix network error:', e);
    }
    
    return false;
  }

  private async fixReactKeyWarning(error: ConsoleError): Promise<boolean> {
    console.log('🔧 Adding React keys...');
    
    const componentFiles = [
      'client/src/pages/instructors-portal/quizzes/index.tsx',
      'client/src/pages/instructors-portal/scenarios/index.tsx'
    ];
    
    for (const filePath of componentFiles) {
      try {
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf8');
          
          // Add keys to mapped elements
          content = content.replace(
            /\.map\(\((\w+)(?:,\s*(\w+))?\)\s*=>\s*<(\w+)/g,
            '.map(($1$2) => <$3 key={$1.id || $2}'
          );
          
          fs.writeFileSync(filePath, content);
          console.log(`✅ Added React keys to ${filePath}`);
        }
      } catch (e) {
        console.error(`Failed to fix React keys in ${filePath}:`, e);
      }
    }
    
    return true;
  }

  // Main auto-fix execution
  public async autoFix(errors: ConsoleError[]): Promise<number> {
    let fixedCount = 0;
    
    // Sort errors by priority
    const sortedErrors = errors.sort((a, b) => {
      const aPriority = this.getErrorPriority(a);
      const bPriority = this.getErrorPriority(b);
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });
    
    for (const error of sortedErrors) {
      const pattern = this.autoFixPatterns.find(p => p.pattern.test(error.message));
      
      if (pattern) {
        console.log(`🔧 Applying fix: ${pattern.description}`);
        
        try {
          const success = await pattern.fixFunction(error);
          if (success) {
            fixedCount++;
            console.log(`✅ Successfully fixed: ${error.message.substring(0, 100)}...`);
          }
        } catch (e) {
          console.error(`❌ Failed to apply fix for: ${error.message}`, e);
        }
      }
    }
    
    return fixedCount;
  }

  private getErrorPriority(error: ConsoleError): 'high' | 'medium' | 'low' {
    const pattern = this.autoFixPatterns.find(p => p.pattern.test(error.message));
    return pattern?.priority || 'low';
  }

  // Generate detailed error report
  public generateErrorReport(): object {
    const errorsByType = this.errorLog.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsBySource = this.errorLog.reduce((acc, error) => {
      acc[error.source] = (acc[error.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySource,
      recentErrors: this.errorLog.slice(-10),
      fixableErrors: this.errorLog.filter(error => 
        this.autoFixPatterns.some(pattern => pattern.pattern.test(error.message))
      ).length
    };
  }
}

export { BrowserConsoleMonitor, ConsoleError };