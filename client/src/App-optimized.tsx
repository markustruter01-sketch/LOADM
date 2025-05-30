import { Switch, Route } from "wouter";
import { QueryClientProvider } from '@tanstack/react-query';
import { createOfflineQueryClient } from "@/lib/queryClient";
import { IsolatedAuthProvider, useIsolatedAuth } from './auth-isolated/auth-context';
import { IsolatedLoginForm } from './auth-isolated/login-component';
import { FirstTimePasswordChange } from './auth-isolated/first-time-password';
import { Suspense, lazy } from 'react';
import { PageWrapper } from "@/components/page-loader";

// Immediate load for core pages only
import HomePage from "@/pages/home-page";
import ArmyHomePage from "@/pages/army-home-page";
import NavyHomePage from "@/pages/navy-home-page";
import NotFound from "@/pages/not-found";

// Lazy load all other pages for better initial performance
const DocumentFormPage = lazy(() => import("@/pages/document-form-page"));
const ScenarioPage = lazy(() => import("@/pages/scenario-page-new"));
const DocsListPage = lazy(() => import("@/pages/docs-list-page"));
const ScenariosPage = lazy(() => import("@/pages/scenarios-page"));
const LoadPlanningPage = lazy(() => import("@/pages/load-planning-page"));
const LoadPlanningSelectionPage = lazy(() => import("@/pages/load-planning-selection-page"));
const DocumentsPage = lazy(() => import("@/pages/documents-page"));
const UserProfile = lazy(() => import("@/pages/user-profile"));
const ToolsPage = lazy(() => import("@/pages/tools-page"));
const TrainingModulesPage = lazy(() => import("@/pages/training-modules"));
const TrainingModuleDetailPage = lazy(() => import("@/pages/training-modules/[id]"));
const AirframeIntegratedPage = lazy(() => import("@/pages/airframe-integrated-page"));

// Admin and instructor pages - lazy loaded
const AdminDashboard = lazy(() => import("@/pages/admin/admin-dashboard"));
const DocumentManagement = lazy(() => import("@/pages/admin/document-management"));
const ScenarioManagement = lazy(() => import("@/pages/admin/scenario-management"));
const UserManagement = lazy(() => import("@/pages/admin/user-management"));
const InstructorsPortal = lazy(() => import("@/pages/instructors-portal"));
const InstructorsScenarios = lazy(() => import("@/pages/instructors-portal/scenarios"));
const CreateScenario = lazy(() => import("@/pages/instructors-portal/scenarios/new-create"));
const EditScenario = lazy(() => import("@/pages/instructors-portal/scenarios/edit/[id]"));
const StudentProgress = lazy(() => import("@/pages/instructors-portal/student-progress"));
const SubmissionReview = lazy(() => import("@/pages/instructors-portal/student-progress/[id]"));
const AdvancedAnalytics = lazy(() => import("@/pages/instructors-portal/analytics"));

// Tool pages - lazy loaded
const WAMCalculatorPage = lazy(() => import("@/pages/tools/wam-calculator"));
const VehicleCgfaPage = lazy(() => import("@/pages/tools/vehicle-cgfa"));
const BoxPsiCalculatorPage = lazy(() => import("@/pages/tools/box-psi"));
const DrumPsiCalculatorPage = lazy(() => import("@/pages/tools/drum-psi"));
const SkiddedBoxPsiCalculatorPage = lazy(() => import("@/pages/tools/skidded-box-psi"));
const TirePsiCalculatorPage = lazy(() => import("@/pages/tools/tire-psi"));

// Quiz and other specialized pages - lazy loaded
const QuizList = lazy(() => import("@/pages/instructors-portal/quizzes"));
const CreateQuiz = lazy(() => import("@/pages/instructors-portal/quizzes/create"));
const QuizDetail = lazy(() => import("@/pages/instructors-portal/quizzes/[id]"));
const EditQuizPage = lazy(() => import("@/pages/instructors-portal/quizzes/edit/[id]"));
const SuperAdminDashboard = lazy(() => import("@/pages/superadmin-dashboard"));
const LicensingManagement = lazy(() => import("@/pages/licensing-management-fixed"));
const LicenseRegistration = lazy(() => import("@/pages/license-registration"));
const ScenarioSubmissions = lazy(() => import("@/pages/instructors-portal/submissions"));
const DocumentSubmissions = lazy(() => import("@/pages/instructors-portal/document-submissions"));
const TeachingMaterials = lazy(() => import("@/pages/instructors-portal/resources"));
const BestPractices = lazy(() => import("@/pages/instructors-portal/best-practices"));
const ScenarioResources = lazy(() => import("@/pages/instructors-portal/scenarios/resources"));
const QuizPage = lazy(() => import("@/pages/quizzes/[id]"));
const QuizSubmissions = lazy(() => import("@/pages/instructors-portal/quiz-submissions"));
const QuizSubmissionDetail = lazy(() => import("@/pages/instructors-portal/quiz-submissions/[id]"));
const PermissionsDashboard = lazy(() => import("@/pages/permissions-dashboard"));

// Import route protection components
import { ProtectedRoute, AuthenticatedRoute, SuperAdminRoute, InstructorRoute } from "./lib/auth-routes";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ChatSystem } from "@/components/chat-system";

const queryClient = createOfflineQueryClient();

function AuthenticatedApp() {
  const { user } = useIsolatedAuth();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Header />
        <main className="main-content">
          <Switch>
            {/* Core pages - no lazy loading */}
            <Route path="/" component={HomePage} />
            <Route path="/army" component={ArmyHomePage} />
            <Route path="/navy" component={NavyHomePage} />
            
            {/* All other pages wrapped with lazy loading */}
            <Route path="/documents-old">
              <PageWrapper><DocsListPage /></PageWrapper>
            </Route>
            <Route path="/documents/:id">
              <PageWrapper><DocumentFormPage /></PageWrapper>
            </Route>
            <Route path="/scenarios">
              <PageWrapper><ScenariosPage /></PageWrapper>
            </Route>
            <Route path="/scenarios/:id">
              <PageWrapper><ScenarioPage /></PageWrapper>
            </Route>
            <Route path="/documents">
              <PageWrapper><DocumentsPage /></PageWrapper>
            </Route>
            <AuthenticatedRoute path="/load-planning">
              <PageWrapper><LoadPlanningSelectionPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/load-planning/:aircraftType">
              <PageWrapper><LoadPlanningPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/profile">
              <PageWrapper><UserProfile /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/tools">
              <PageWrapper><ToolsPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/training-modules">
              <PageWrapper><TrainingModulesPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/training-modules/:id">
              <PageWrapper><TrainingModuleDetailPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/airframe-integrated">
              <PageWrapper><AirframeIntegratedPage /></PageWrapper>
            </AuthenticatedRoute>
            
            {/* Tool routes */}
            <AuthenticatedRoute path="/tools/wam-calculator">
              <PageWrapper><WAMCalculatorPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/tools/vehicle-cgfa">
              <PageWrapper><VehicleCgfaPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/tools/box-psi">
              <PageWrapper><BoxPsiCalculatorPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/tools/drum-psi">
              <PageWrapper><DrumPsiCalculatorPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/tools/skidded-box-psi">
              <PageWrapper><SkiddedBoxPsiCalculatorPage /></PageWrapper>
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/tools/tire-psi">
              <PageWrapper><TirePsiCalculatorPage /></PageWrapper>
            </AuthenticatedRoute>
            
            {/* Admin routes */}
            <ProtectedRoute path="/admin">
              <PageWrapper><AdminDashboard /></PageWrapper>
            </ProtectedRoute>
            <ProtectedRoute path="/admin/documents">
              <PageWrapper><DocumentManagement /></PageWrapper>
            </ProtectedRoute>
            <ProtectedRoute path="/admin/scenarios">
              <PageWrapper><ScenarioManagement /></PageWrapper>
            </ProtectedRoute>
            <ProtectedRoute path="/admin/users">
              <PageWrapper><UserManagement /></PageWrapper>
            </ProtectedRoute>
            
            {/* Instructor routes */}
            <InstructorRoute path="/instructors-portal">
              <PageWrapper><InstructorsPortal /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/scenarios">
              <PageWrapper><InstructorsScenarios /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/scenarios/create">
              <PageWrapper><CreateScenario /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/scenarios/edit/:id">
              <PageWrapper><EditScenario /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/student-progress">
              <PageWrapper><StudentProgress /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/student-progress/:id">
              <PageWrapper><SubmissionReview /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/analytics">
              <PageWrapper><AdvancedAnalytics /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/quizzes">
              <PageWrapper><QuizList /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/quizzes/create">
              <PageWrapper><CreateQuiz /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/quizzes/:id">
              <PageWrapper><QuizDetail /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/quizzes/edit/:id">
              <PageWrapper><EditQuizPage /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/submissions">
              <PageWrapper><ScenarioSubmissions /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/document-submissions">
              <PageWrapper><DocumentSubmissions /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/resources">
              <PageWrapper><TeachingMaterials /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/best-practices">
              <PageWrapper><BestPractices /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/scenarios/resources">
              <PageWrapper><ScenarioResources /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/quiz-submissions">
              <PageWrapper><QuizSubmissions /></PageWrapper>
            </InstructorRoute>
            <InstructorRoute path="/instructors-portal/quiz-submissions/:id">
              <PageWrapper><QuizSubmissionDetail /></PageWrapper>
            </InstructorRoute>
            
            {/* Superadmin routes */}
            <SuperAdminRoute path="/superadmin">
              <PageWrapper><SuperAdminDashboard /></PageWrapper>
            </SuperAdminRoute>
            <SuperAdminRoute path="/licensing-management">
              <PageWrapper><LicensingManagement /></PageWrapper>
            </SuperAdminRoute>
            <SuperAdminRoute path="/permissions-dashboard">
              <PageWrapper><PermissionsDashboard /></PageWrapper>
            </SuperAdminRoute>
            
            {/* Other routes */}
            <Route path="/license-registration">
              <PageWrapper><LicenseRegistration /></PageWrapper>
            </Route>
            <AuthenticatedRoute path="/quizzes/:id">
              <PageWrapper><QuizPage /></PageWrapper>
            </AuthenticatedRoute>
            
            <Route component={NotFound} />
          </Switch>
        </main>
        <BottomNav />
        <ChatSystem />
      </div>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useIsolatedAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user?.requiresPasswordChange) {
    return <FirstTimePasswordChange />;
  }

  if (!user) {
    return <IsolatedLoginForm />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <IsolatedAuthProvider>
      <AppContent />
    </IsolatedAuthProvider>
  );
}

export default App;