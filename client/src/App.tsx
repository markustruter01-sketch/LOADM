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

// Import route protection components (we'll adapt these)
import { ProtectedRoute, AuthenticatedRoute, SuperAdminRoute, InstructorRoute } from "./lib/auth-routes";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ChatSystem } from "@/components/chat-system";
// import OfflineStatus from "@/components/OfflineStatus";

const queryClient = createOfflineQueryClient();

// Loading component for lazy-loaded pages
const PageLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

function AuthenticatedApp() {
  const { user } = useIsolatedAuth();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Header />
        <main className="main-content">
          <Suspense fallback={<PageLoading />}>
            <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/army" component={ArmyHomePage} />
            <Route path="/navy" component={NavyHomePage} />
            <Route path="/documents-old" component={DocsListPage} />
            <Route path="/documents/:id" component={DocumentFormPage} />
            <Route path="/scenarios" component={ScenariosPage} />
            <Route path="/scenarios/:id" component={ScenarioPage} />
            <Route path="/airframe">
              {(params) => <AirframeIntegratedPage {...params} />}
            </Route>
            <Route path="/load-planning">
              {(params) => <LoadPlanningSelectionPage {...params} />}
            </Route>
            <Route path="/load-planning/c27j" component={LoadPlanningPage} />
            <Route path="/load-planning/c17" component={LoadPlanningPage} />
            <Route path="/load-planning/c130" component={LoadPlanningPage} />
            <Route path="/load-planning/kc30a" component={LoadPlanningPage} />
            <Route path="/documents" component={DocumentsPage} />
            <Route path="/cargo-manifest" component={DocumentsPage} />

            <Route path="/tools" component={ToolsPage} />
            <Route path="/tools/wam-calculator" component={WAMCalculatorPage} />
            <Route path="/tools/vehicle-cgfa" component={VehicleCgfaPage} />
            <Route path="/tools/box-psi" component={BoxPsiCalculatorPage} />
            <Route path="/tools/drum-psi" component={DrumPsiCalculatorPage} />
            <Route path="/tools/skidded-box-psi" component={SkiddedBoxPsiCalculatorPage} />
            <Route path="/tools/tire-psi" component={TirePsiCalculatorPage} />
            <Route path="/training-modules">
              {(params) => <TrainingModulesPage {...params} />}
            </Route>
            <Route path="/training-modules/:id" component={TrainingModuleDetailPage} />
            <ProtectedRoute path="/admin" component={AdminDashboard} />
            <ProtectedRoute path="/admin/admin-dashboard" component={AdminDashboard} />
            <ProtectedRoute path="/admin/documents" component={DocumentManagement} />
            <ProtectedRoute path="/admin/scenarios" component={ScenarioManagement} />
            <ProtectedRoute path="/admin/users" component={UserManagement} />
            <InstructorRoute path="/instructors-portal" component={InstructorsPortal} />
            <InstructorRoute path="/instructors-portal/scenarios" component={InstructorsScenarios} />
            <InstructorRoute path="/instructors-portal/scenarios/create" component={CreateScenario} />
            <InstructorRoute path="/instructors-portal/scenarios/edit/:id" component={EditScenario} />
            <InstructorRoute path="/instructors-portal/student-progress" component={StudentProgress} />
            <InstructorRoute path="/instructors-portal/student-progress/:id" component={SubmissionReview} />
            <InstructorRoute path="/instructors-portal/analytics" component={AdvancedAnalytics} />
            <InstructorRoute path="/instructors-portal/quizzes" component={QuizList} />
            <InstructorRoute path="/instructors-portal/quizzes/create" component={CreateQuiz} />
            <InstructorRoute path="/instructors-portal/quizzes/:id" component={QuizDetail} />
            <InstructorRoute path="/instructors-portal/quizzes/edit/:id" component={EditQuizPage} />
            <SuperAdminRoute path="/superadmin-dashboard" component={SuperAdminDashboard} />
            <SuperAdminRoute path="/licensing-management" component={LicensingManagement} />
            <SuperAdminRoute path="/permissions-dashboard" component={PermissionsDashboard} />
            <Route path="/license-registration" component={LicenseRegistration} />
            <AuthenticatedRoute path="/user-profile" component={UserProfile} />
            <InstructorRoute path="/instructors-portal/submissions" component={ScenarioSubmissions} />
            <InstructorRoute path="/instructors-portal/document-submissions" component={DocumentSubmissions} />
            <InstructorRoute path="/instructors-portal/resources" component={TeachingMaterials} />
            <InstructorRoute path="/instructors-portal/best-practices" component={BestPractices} />
            <InstructorRoute path="/instructors-portal/scenarios/resources" component={ScenarioResources} />
            <AuthenticatedRoute path="/quizzes/:id" component={QuizPage} />
            <InstructorRoute path="/instructors-portal/quiz-submissions" component={QuizSubmissions} />
            <InstructorRoute path="/instructors-portal/quiz-submissions/:id" component={QuizSubmissionDetail} />
            <Route component={NotFound} />
          </Switch>
          </Suspense>
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

  if (!user) {
    return <IsolatedLoginForm />;
  }

  // Check if user needs to change password on first login
  if (user.isFirstLogin) {
    return <FirstTimePasswordChange />;
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