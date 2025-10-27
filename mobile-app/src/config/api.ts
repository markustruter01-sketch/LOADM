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
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_USER: `${API_BASE_URL}/api/auth/user`,
  
  // Quiz
  QUIZ_QUESTIONS: `${API_BASE_URL}/api/quiz-questions`,
  QUIZ_SUBMISSIONS: `${API_BASE_URL}/api/quiz-submissions`,
  
  // Scenarios
  SCENARIO_SUBMISSIONS: `${API_BASE_URL}/api/scenario-submissions`,
  SCENARIOS: `${API_BASE_URL}/api/scenarios`,
  
  // Documents
  DOCUMENTS: `${API_BASE_URL}/api/documents`,
  
  // Chat
  CHAT: `${API_BASE_URL}/api/chat`,
  
  // Load Planning
  LOAD_PLANS: `${API_BASE_URL}/api/load-plans`,
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
