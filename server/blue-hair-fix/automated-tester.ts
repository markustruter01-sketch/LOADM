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
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'markustruter01@gmail.com',
          password: 'Skating69!'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        return {
          testName: 'Login Authentication',
          passed: true,
          details: { userRole: data.user.role },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          testName: 'Login Authentication', 
          passed: false,
          error: data.error || 'Login failed',
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

  // Test quiz creation functionality
  private async testQuizCreation(): Promise<TestResult> {
    try {
      const quizData = {
        title: 'Blue Hair Fix Test Quiz',
        description: 'Automated test quiz created by Blue Hair Fix system',
        questionCount: 5,
        categories: ['Weight and Balance', 'Aircraft Systems'],
        isActive: true
      };

      const response = await this.makeRequest('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizData)
      });

      if (response.ok) {
        const createdQuiz = await response.json();
        
        // Clean up: Delete the test quiz
        await this.makeRequest(`/api/quizzes/${createdQuiz.id}`, {
          method: 'DELETE'
        });

        return {
          testName: 'Quiz Creation',
          passed: true,
          details: { quizId: createdQuiz.id, title: createdQuiz.title },
          timestamp: new Date().toISOString()
        };
      } else {
        const error = await response.text();
        return {
          testName: 'Quiz Creation',
          passed: false,
          error: `HTTP ${response.status}: ${error}`,
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
    
    // Run all functionality tests
    const tests = [
      () => this.testDatabaseConnectivity(),
      () => this.testQuizCreation(),
      () => this.testQuizListing(),
      () => this.testScenarioListing(),
      () => this.testSubmissionRetrieval()
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