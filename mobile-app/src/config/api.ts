/**
 * API Configuration for LOADMworkflow Mobile App
 * 
 * This configuration determines which backend server the mobile app connects to.
 * 
 * PRODUCTION SETUP:
 * - Replace API_BASE_URL with your actual Replit deployment URL
 * - Format: https://your-replit-deployment-url.replit.app
 * - Never use localhost in production builds
 * 
 * SECURITY:
 * - Always use HTTPS in production (not HTTP)
 * - Do not hardcode credentials or API keys
 * - Environment-specific configuration prevents accidental localhost usage in production
 */

// Determine if we're in development or production
// __DEV__ is automatically set by React Native/Expo
const isDevelopment = __DEV__;

// Production API URL - MUST BE UPDATED before App Store submission
const PRODUCTION_API_URL = 'https://46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev';

// Development API URL
const DEVELOPMENT_API_URL = 'http://localhost:5000';

/**
 * Base API URL - automatically selects production or development URL
 * based on build mode
 */
export const API_BASE_URL = isDevelopment ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

/**
 * API Endpoints - Updated January 2026
 */
export const API_ENDPOINTS = {
  // Authentication (Isolated Auth System)
  AUTH_LOGIN: `${API_BASE_URL}/auth-isolated/login`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth-isolated/logout`,
  AUTH_USER: `${API_BASE_URL}/auth-isolated/user`,
  AUTH_REGISTER: `${API_BASE_URL}/auth-isolated/register`,
  COMPLETE_ONBOARDING: `${API_BASE_URL}/auth-isolated/complete-onboarding`,
  
  // Quizzes (Unified endpoints)
  QUIZZES: `${API_BASE_URL}/api/quizzes`,
  QUIZ_BY_ID: (id: number) => `${API_BASE_URL}/api/quiz/${id}`,
  QUIZ_QUESTIONS: `${API_BASE_URL}/api/quiz-questions`,
  QUIZ_SUBMISSIONS: `${API_BASE_URL}/api/quiz/submissions`,
  
  // Scenarios
  SCENARIOS: `${API_BASE_URL}/api/scenarios`,
  SCENARIO_BY_ID: (id: number) => `${API_BASE_URL}/api/scenarios/${id}`,
  SCENARIO_SUBMISSIONS: `${API_BASE_URL}/api/scenario-submissions`,
  
  // Documents
  DOCUMENTS: `${API_BASE_URL}/api/documents`,
  DOCUMENT_BY_ID: (id: number) => `${API_BASE_URL}/api/documents/${id}`,
  
  // User Profile
  USER_PROFILE: `${API_BASE_URL}/api/user-profile`,
  
  // User Qualifications
  USER_QUALIFICATIONS: `${API_BASE_URL}/api/user-qualifications`,
  USER_QUALIFICATION_BY_ID: (id: number) => `${API_BASE_URL}/api/user-qualifications/${id}`,
  
  // Flight Records
  FLIGHT_RECORDS: `${API_BASE_URL}/api/flight-records`,
  FLIGHT_RECORD_BY_ID: (id: number) => `${API_BASE_URL}/api/flight-records/${id}`,
  FLIGHT_STATISTICS: `${API_BASE_URL}/api/flight-statistics`,
  
  // Safety Records
  SAFETY_RECORDS: `${API_BASE_URL}/api/safety-records`,
  
  // Chat
  CHAT: `${API_BASE_URL}/api/chat`,
  CHAT_MESSAGES: `${API_BASE_URL}/api/chat/messages`,
  
  // Load Planning
  LOAD_PLANS: `${API_BASE_URL}/api/load-plans`,
  LOAD_PLAN_BY_ID: (id: number) => `${API_BASE_URL}/api/load-plans/${id}`,
  
  // Checklists
  CHECKLISTS: `${API_BASE_URL}/api/checklists`,
  CHECKLIST_BY_ID: (id: number) => `${API_BASE_URL}/api/checklists/${id}`,
  
  // Training Modules
  TRAINING_MODULES: `${API_BASE_URL}/api/training-modules`,
  TRAINING_MODULE_BY_ID: (id: number) => `${API_BASE_URL}/api/training-modules/${id}`,
  
  // Users (for instructor view)
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_ID: (id: number) => `${API_BASE_URL}/api/users/${id}`,
  
  // Analytics (read-only for leadership)
  ANALYTICS_OVERVIEW: `${API_BASE_URL}/api/analytics/overview`,
  ANALYTICS_WORKFORCE: `${API_BASE_URL}/api/analytics/workforce`,
};

/**
 * Helper function to build API URL
 * @param endpoint - The API endpoint path (e.g., '/api/users')
 * @returns Full API URL
 */
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

/**
 * Get current environment
 */
export function getEnvironment(): 'development' | 'production' {
  return isDevelopment ? 'development' : 'production';
}

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
  return isDevelopment;
}

/**
 * Get authorization headers with session token
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const SecureStore = await import('expo-secure-store');
    const sessionToken = await SecureStore.getItemAsync('sessionToken');
    return {
      'Content-Type': 'application/json',
      ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}
