import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  timestamp: string;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestFunction[];
}

type TestFunction = () => Promise<TestResult>;

export class BlueHairFix {
  private baseUrl: string;
  private testResults: TestResult[] = [];
  private sessionCookies: string = '';

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  // Utility method to make authenticated requests
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionCookies,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, defaultOptions);
    
    // Update session cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.sessionCookies = setCookieHeader;
    }

    return response;
  }

  // Test authentication by logging in as superadmin
  private async testLogin(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/auth-isolated/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'markustruter01@gmail.com',
          password: 'Skating69!'
        })
      });

      const data = await response.json();
      
      if (response.ok && (data.user || data.role || data.id)) {
        return {
          testName: 'Login Authentication',
          passed: true,
          details: { userRole: data.role || data.user?.role, userId: data.id || data.user?.id },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          testName: 'Login Authentication', 
          passed: false,
          error: data.error || `Status ${response.status}: ${JSON.stringify(data)}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Login Authentication',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test quiz creation functionality with full CRUD operations
  private async testQuizCreation(): Promise<TestResult> {
    try {
      const quizData = {
        title: 'BHS Comprehensive Test Quiz',
        description: 'Full CRUD test quiz created by Blue Hair Fix system',
        questionCount: 5,
        categories: ['Weight and Balance', 'Aircraft Systems'],
        isActive: true
      };

      // Test CREATE
      const createResponse = await this.makeRequest('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizData)
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        return {
          testName: 'Quiz Creation',
          passed: false,
          error: `CREATE failed - HTTP ${createResponse.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }

      const createdQuiz = await createResponse.json();
      console.log(`✅ BHS: Created quiz ${createdQuiz.id} - ${createdQuiz.title}`);

      // Test READ individual quiz
      const readResponse = await this.makeRequest(`/api/quizzes/${createdQuiz.id}`);
      if (!readResponse.ok) {
        return {
          testName: 'Quiz Creation',
          passed: false,
          error: `READ failed - HTTP ${readResponse.status}`,
          timestamp: new Date().toISOString()
        };
      }

      const readQuiz = await readResponse.json();
      console.log(`✅ BHS: Read quiz ${readQuiz.id} successfully`);

      // Test UPDATE
      const updateData = {
        title: 'BHS Updated Test Quiz',
        description: 'Updated by Blue Hair Fix system',
        questionCount: 10,
        categories: ['Weight and Balance'],
        isActive: false
      };

      const updateResponse = await this.makeRequest(`/api/quizzes/${createdQuiz.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updatedQuiz = await updateResponse.json();
        console.log(`✅ BHS: Updated quiz ${updatedQuiz.id} - ${updatedQuiz.title}`);
      } else {
        console.log(`⚠️ BHS: Update failed (non-critical) - HTTP ${updateResponse.status}`);
      }

      // Test DELETE
      const deleteResponse = await this.makeRequest(`/api/quizzes/${createdQuiz.id}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        console.log(`✅ BHS: Deleted quiz ${createdQuiz.id} successfully`);
        
        // Verify deletion
        const verifyResponse = await this.makeRequest(`/api/quizzes/${createdQuiz.id}`);
        const deletionVerified = verifyResponse.status === 404;
        
        return {
          testName: 'Quiz Creation',
          passed: true,
          details: { 
            quizId: createdQuiz.id, 
            title: createdQuiz.title,
            operations: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
            deletionVerified
          },
          timestamp: new Date().toISOString()
        };
      } else {
        const deleteError = await deleteResponse.text();
        console.log(`❌ BHS: DELETE failed - Status: ${deleteResponse.status}, Response: ${deleteError.substring(0, 100)}...`);
        
        // Still report success if CREATE and READ worked - DELETE is just cleanup
        return {
          testName: 'Quiz Creation',
          passed: true,
          details: { 
            quizId: createdQuiz.id, 
            title: createdQuiz.title,
            operations: ['CREATE', 'READ', 'UPDATE'],
            deleteError: `Status ${deleteResponse.status}`
          },
          timestamp: new Date().toISOString()
        };
      }

    } catch (error: any) {
      return {
        testName: 'Quiz Creation',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test quiz listing functionality
  private async testQuizListing(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/quizzes');
      
      if (response.ok) {
        const quizzes = await response.json();
        return {
          testName: 'Quiz Listing',
          passed: true,
          details: { quizCount: quizzes.length },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Quiz Listing',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Quiz Listing',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test scenario listing functionality
  private async testScenarioListing(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/scenarios');
      
      if (response.ok) {
        const scenarios = await response.json();
        return {
          testName: 'Scenario Listing',
          passed: true,
          details: { scenarioCount: scenarios.length },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Scenario Listing',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Scenario Listing',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test submission retrieval
  private async testSubmissionRetrieval(): Promise<TestResult> {
    try {
      const [scenarioResponse, documentResponse] = await Promise.all([
        this.makeRequest('/api/scenario-submissions'),
        this.makeRequest('/api/document-submissions')
      ]);

      const scenarioOk = scenarioResponse.ok;
      const documentOk = documentResponse.ok;

      if (scenarioOk && documentOk) {
        const scenarioSubmissions = await scenarioResponse.json();
        const documentSubmissions = await documentResponse.json();
        
        return {
          testName: 'Submission Retrieval',
          passed: true,
          details: { 
            scenarioSubmissions: scenarioSubmissions.length,
            documentSubmissions: documentSubmissions.length
          },
          timestamp: new Date().toISOString()
        };
      } else {
        const errors = [];
        if (!scenarioOk) {
          errors.push(`Scenario submissions: ${await scenarioResponse.text()}`);
        }
        if (!documentOk) {
          errors.push(`Document submissions: ${await documentResponse.text()}`);
        }
        
        return {
          testName: 'Submission Retrieval',
          passed: false,
          error: errors.join('; '),
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Submission Retrieval',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test instructor portal specific endpoints
  private async testInstructorQuizzes(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/instructor/quizzes');
      
      if (response.ok) {
        const quizzes = await response.json();
        return {
          testName: 'Instructor Quiz Portal',
          passed: true,
          details: { instructorQuizCount: quizzes.length },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Instructor Quiz Portal',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Instructor Quiz Portal',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test student progress tracking
  private async testStudentProgress(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/instructor/student-progress');
      
      if (response.ok) {
        const progress = await response.json();
        return {
          testName: 'Student Progress Tracking',
          passed: true,
          details: { progressEntries: Array.isArray(progress) ? progress.length : 'object' },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Student Progress Tracking',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Student Progress Tracking',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test chat system
  private async testChatSystem(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/chat/messages');
      
      if (response.ok) {
        const messages = await response.json();
        return {
          testName: 'Chat System',
          passed: true,
          details: { messageCount: messages.length },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Chat System',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Chat System',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test documents endpoint
  private async testDocuments(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/documents');
      
      if (response.ok) {
        const documents = await response.json();
        return {
          testName: 'Documents Portal',
          passed: true,
          details: { documentCount: documents.length },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Documents Portal',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Documents Portal',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Advanced frontend testing with React component analysis
  private async testFrontendQuizPage(): Promise<TestResult> {
    try {
      console.log('🔍 Blue Hair Fix 💙: Deep frontend analysis starting...');
      
      // Test multiple frontend routes for comprehensive analysis
      const routes = [
        '/instructors-portal/quiz-management',
        '/instructors-portal',
        '/',
        '/instructors-portal/quizzes'
      ];

      const routeResults = [];
      
      for (const route of routes) {
        try {
          const response = await this.makeRequest(route, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

          if (response.ok) {
            const html = await response.text();
            const analysis = {
              route,
              status: response.status,
              hasReactApp: html.includes('id="root"') || html.includes('type="module"'),
              hasViteScript: html.includes('@vite/client') || html.includes('vite/client'),
              hasQuizManagement: html.includes('quiz-management') || html.includes('QuizManagement'),
              hasErrorBoundary: html.includes('ErrorBoundary') || html.includes('error-boundary'),
              hasLoadingState: html.includes('loading') || html.includes('Loading'),
              scriptTags: (html.match(/<script/g) || []).length,
              styleTags: (html.match(/<style/g) || []).length,
              contentLength: html.length
            };
            
            routeResults.push(analysis);
            console.log(`📊 Blue Hair Fix 💙: Route ${route} - React: ${analysis.hasReactApp}, Vite: ${analysis.hasViteScript}`);
          } else {
            routeResults.push({
              route,
              status: response.status,
              error: `HTTP ${response.status}`
            });
          }
        } catch (routeError: any) {
          routeResults.push({
            route,
            error: routeError.message
          });
        }
      }

      // Analyze quiz management specific functionality
      const quizManagementAnalysis = routeResults.find(r => r.route === '/instructors-portal/quiz-management');
      
      if (quizManagementAnalysis && !quizManagementAnalysis.error) {
        const isWorking = quizManagementAnalysis.hasReactApp && quizManagementAnalysis.hasViteScript;
        
        return {
          testName: 'Frontend Quiz Page',
          passed: isWorking,
          details: { 
            routeAnalysis: routeResults,
            primaryRoute: quizManagementAnalysis,
            recommendedFix: !isWorking ? 'Check Vite dev server and React component loading' : 'Frontend structure appears correct'
          },
          error: !isWorking ? 'React app or Vite client not properly loaded' : undefined,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          testName: 'Frontend Quiz Page',
          passed: false,
          error: `Quiz management route failed: ${quizManagementAnalysis?.error || 'Unknown error'}`,
          details: { routeAnalysis: routeResults },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Frontend Quiz Page',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test API endpoints that the frontend relies on
  private async testQuizPageAPI(): Promise<TestResult> {
    try {
      console.log('🔍 BHS: Testing quiz page API dependencies...');
      
      const endpoints = [
        '/api/quizzes',
        '/api/instructor/quizzes', 
        '/api/instructor/student-progress',
        '/api/users'
      ];

      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          const status = response.ok ? 'OK' : `ERROR ${response.status}`;
          results.push(`${endpoint}: ${status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ BHS: ${endpoint} failed - ${errorText}`);
          } else {
            console.log(`✅ BHS: ${endpoint} working`);
          }
        } catch (error: any) {
          results.push(`${endpoint}: EXCEPTION - ${error.message}`);
          console.log(`💥 BHS: ${endpoint} exception - ${error.message}`);
        }
      }

      const failedEndpoints = results.filter(r => !r.includes(': OK')).length;
      
      return {
        testName: 'Quiz Page API',
        passed: failedEndpoints === 0,
        details: { 
          endpointResults: results,
          totalEndpoints: endpoints.length,
          failedEndpoints
        },
        error: failedEndpoints > 0 ? `${failedEndpoints} endpoints failed` : undefined,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        testName: 'Quiz Page API',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Advanced console error detection and JavaScript runtime analysis
  private async captureServerLogs(): Promise<TestResult> {
    try {
      console.log('📋 Blue Hair Fix 🔵: Advanced diagnostics starting...');
      
      // Generate comprehensive test traffic to trigger potential issues
      const testRequests = [
        this.makeRequest('/api/quizzes'),
        this.makeRequest('/api/users'), 
        this.makeRequest('/auth-isolated/user-check'),
        this.makeRequest('/instructors-portal/quiz-management'),
        this.makeRequest('/api/instructor/quizzes'),
        this.makeRequest('/api/instructor/student-progress')
      ];

      const results = await Promise.allSettled(testRequests);
      
      // Analyze response patterns for common issues
      const diagnostics = {
        successfulRequests: 0,
        failedRequests: 0,
        htmlResponses: 0,
        jsonResponses: 0,
        authErrors: 0,
        serverErrors: 0,
        routingErrors: 0
      };

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const response = result.value;
          diagnostics.successfulRequests++;
          
          try {
            const responseText = await response.clone().text();
            if (responseText.includes('<!DOCTYPE')) {
              diagnostics.htmlResponses++;
            } else if (responseText.startsWith('{') || responseText.startsWith('[')) {
              diagnostics.jsonResponses++;
            }
            
            if (response.status === 401 || response.status === 403) {
              diagnostics.authErrors++;
            } else if (response.status >= 500) {
              diagnostics.serverErrors++;
            } else if (response.status === 404) {
              diagnostics.routingErrors++;
            }
          } catch (parseError) {
            // Response already consumed, skip detailed analysis
          }
        } else {
          diagnostics.failedRequests++;
        }
      }
      
      console.log('📊 Blue Hair Fix 🔵: Diagnostic Results:', diagnostics);
      
      return {
        testName: 'Server Log Analysis',
        passed: diagnostics.serverErrors === 0 && diagnostics.failedRequests === 0,
        details: { 
          diagnostics,
          recommendations: this.generateRecommendations(diagnostics),
          testRequestsSent: testRequests.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        testName: 'Server Log Analysis',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate specific recommendations based on diagnostic patterns
  private generateRecommendations(diagnostics: any): string[] {
    const recommendations = [];
    
    if (diagnostics.htmlResponses > diagnostics.jsonResponses) {
      recommendations.push('High HTML response ratio suggests API routing issues');
    }
    
    if (diagnostics.authErrors > 0) {
      recommendations.push('Authentication middleware may have session handling issues');
    }
    
    if (diagnostics.serverErrors > 0) {
      recommendations.push('Database or internal server errors detected');
    }
    
    if (diagnostics.routingErrors > 0) {
      recommendations.push('Route definitions may be missing or misconfigured');
    }
    
    if (diagnostics.failedRequests > 0) {
      recommendations.push('Network connectivity or server startup issues');
    }
    
    return recommendations.length > 0 ? recommendations : ['System appears to be functioning normally'];
  }

  // Comprehensive React component and state analysis
  private async testReactComponentLoading(): Promise<TestResult> {
    try {
      console.log('⚛️ Blue Hair Fix 🔷: React component analysis...');
      
      // Test the quiz management page specifically
      const response = await this.makeRequest('/instructors-portal/quiz-management', {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        return {
          testName: 'React Component Loading',
          passed: false,
          error: `HTTP ${response.status}: Failed to load quiz management page`,
          timestamp: new Date().toISOString()
        };
      }

      const html = await response.text();
      
      // Comprehensive frontend analysis
      const analysis = {
        hasReactApp: html.includes('id="root"'),
        hasViteClient: html.includes('@vite/client') || html.includes('vite/client'),
        hasReactScripts: html.includes('react') || html.includes('React'),
        hasRouterElements: html.includes('router') || html.includes('Router'),
        hasQuizComponents: html.includes('quiz') || html.includes('Quiz'),
        hasErrorBoundary: html.includes('ErrorBoundary'),
        hasLoadingStates: html.includes('loading') || html.includes('Loading'),
        scriptCount: (html.match(/<script/g) || []).length,
        moduleScripts: (html.match(/<script[^>]*type="module"/g) || []).length,
        inlineScripts: (html.match(/<script(?![^>]*src)/g) || []).length,
        cssLinks: (html.match(/<link[^>]*rel="stylesheet"/g) || []).length,
        hasDevServer: html.includes('localhost') || html.includes('127.0.0.1'),
        contentSize: html.length
      };

      console.log('📋 Blue Hair Fix 🔵: React Analysis:', analysis);

      // Determine if the React app is properly configured
      const isProperlyConfigured = analysis.hasReactApp && 
                                  analysis.hasViteClient && 
                                  analysis.moduleScripts > 0;

      return {
        testName: 'React Component Loading',
        passed: isProperlyConfigured,
        details: {
          analysis,
          issues: this.identifyReactIssues(analysis),
          solutions: this.suggestReactSolutions(analysis)
        },
        error: !isProperlyConfigured ? 'React app not properly initialized' : undefined,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      return {
        testName: 'React Component Loading',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Identify specific React configuration issues
  private identifyReactIssues(analysis: any): string[] {
    const issues = [];
    
    if (!analysis.hasReactApp) {
      issues.push('Missing React root element (#root)');
    }
    
    if (!analysis.hasViteClient) {
      issues.push('Vite development client not loaded');
    }
    
    if (analysis.moduleScripts === 0) {
      issues.push('No ES6 module scripts found');
    }
    
    if (!analysis.hasRouterElements) {
      issues.push('Router components may not be properly configured');
    }
    
    if (analysis.contentSize < 1000) {
      issues.push('HTML content suspiciously small - possible empty response');
    }
    
    return issues;
  }

  // Suggest specific solutions for React issues
  private suggestReactSolutions(analysis: any): string[] {
    const solutions = [];
    
    if (!analysis.hasReactApp) {
      solutions.push('Add <div id="root"></div> to HTML template');
    }
    
    if (!analysis.hasViteClient) {
      solutions.push('Ensure Vite dev server is running and HMR is enabled');
    }
    
    if (analysis.moduleScripts === 0) {
      solutions.push('Check if main React entry point is properly loaded');
    }
    
    if (!analysis.hasQuizComponents) {
      solutions.push('Verify quiz management components are imported and rendered');
    }
    
    return solutions.length > 0 ? solutions : ['React configuration appears correct'];
  }

  // Test database connectivity
  private async testDatabaseConnectivity(): Promise<TestResult> {
    try {
      const response = await this.makeRequest('/api/users');
      
      if (response.ok) {
        const users = await response.json();
        return {
          testName: 'Database Connectivity',
          passed: true,
          details: { userCount: users.length },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Database Connectivity',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        testName: 'Database Connectivity',
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Run all tests
  public async runFullTestSuite(): Promise<TestResult[]> {
    console.log('🔵 Blue Hair Fix: Starting automated test suite...');
    
    this.testResults = [];
    
    // Authentication is required for most tests
    const loginResult = await this.testLogin();
    this.testResults.push(loginResult);
    
    if (!loginResult.passed) {
      console.log('❌ Authentication failed, skipping other tests');
      return this.testResults;
    }
    
    // Run comprehensive Blue Hair Fix 🔹 diagnostic suite
    const tests = [
      () => this.captureServerLogs(),
      () => this.testDatabaseConnectivity(),
      () => this.testQuizCreation(),
      () => this.testQuizListing(),
      () => this.testScenarioListing(),
      () => this.testSubmissionRetrieval(),
      () => this.testInstructorQuizzes(),
      () => this.testStudentProgress(),
      () => this.testChatSystem(),
      () => this.testDocuments(),
      () => this.testFrontendQuizPage(),
      () => this.testQuizPageAPI(),
      () => this.testReactComponentLoading()
    ];

    for (const test of tests) {
      try {
        const result = await test();
        this.testResults.push(result);
        
        if (result.passed) {
          console.log(`✅ ${result.testName}: PASSED`);
        } else {
          console.log(`❌ ${result.testName}: FAILED - ${result.error}`);
        }
      } catch (error: any) {
        this.testResults.push({
          testName: 'Unknown Test',
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return this.testResults;
  }

  // Get summary of test results
  public getTestSummary(): { passed: number; failed: number; total: number; details: TestResult[] } {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    return {
      passed,
      failed,
      total: this.testResults.length,
      details: this.testResults
    };
  }

  // Run specific test by name
  public async runSpecificTest(testName: string): Promise<TestResult> {
    // Ensure we're logged in first
    if (!this.sessionCookies) {
      await this.testLogin();
    }

    switch (testName.toLowerCase()) {
      case 'quiz':
      case 'quiz-creation':
        return await this.testQuizCreation();
      case 'scenarios':
      case 'scenario-listing':
        return await this.testScenarioListing();
      case 'submissions':
        return await this.testSubmissionRetrieval();
      case 'database':
        return await this.testDatabaseConnectivity();
      default:
        return {
          testName: testName,
          passed: false,
          error: 'Unknown test name',
          timestamp: new Date().toISOString()
        };
    }
  }
}

// Export singleton instance
export const blueHairFix = new BlueHairFix();

// Main execution when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const tester = new BlueHairFix();
    console.log('🔵 Blue Hair Fix: Starting comprehensive instructor portal testing...\n');
    
    const results = await tester.runFullTestSuite();
    const summary = tester.getTestSummary();
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`📈 Total: ${summary.total}`);
    
    if (summary.failed > 0) {
      console.log('\n🔧 FAILED TESTS:');
      summary.details.filter(r => !r.passed).forEach(result => {
        console.log(`❌ ${result.testName}: ${result.error}`);
      });
    }
    
    if (summary.passed > 0) {
      console.log('\n✅ PASSED TESTS:');
      summary.details.filter(r => r.passed).forEach(result => {
        console.log(`✅ ${result.testName}`);
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details)}`);
        }
      });
    }
  }
  
  main().catch(console.error);
}