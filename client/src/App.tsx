import { Switch, Route } from "wouter";
import { QueryClientProvider } from '@tanstack/react-query';
import { createOfflineQueryClient } from "@/lib/queryClient";
import { IsolatedAuthProvider, useIsolatedAuth } from './auth-isolated/auth-context';
import { IsolatedLoginForm } from './auth-isolated/login-component';

// Import all your existing pages
import DocumentFormPage from "@/pages/document-form-page";
import ScenarioPage from "@/pages/scenario-page-new";
import DocsListPage from "@/pages/docs-list-page";
import ScenariosPage from "@/pages/scenarios-page";
import LoadPlanningPage from "@/pages/load-planning-page";
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";
import DocumentsPage from "@/pages/cargo-manifest-page";
import ProfilePage from "@/pages/profile-page";
import ToolsPage from "@/pages/tools-page";
import TrainingModulesPage from "@/pages/training-modules";
import TrainingModuleDetailPage from "@/pages/training-modules/[id]";
import AirframeIntegratedPage from "@/pages/airframe-integrated-page";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import DocumentManagement from "@/pages/admin/document-management";
import ScenarioManagement from "@/pages/admin/scenario-management";
import UserManagement from "@/pages/admin/user-management";
import InstructorsPortal from "@/pages/instructors-portal";
import InstructorsScenarios from "@/pages/instructors-portal/scenarios";
import CreateScenario from "@/pages/instructors-portal/scenarios/new-create";
import EditScenario from "@/pages/instructors-portal/scenarios/edit/[id]";
import StudentProgress from "@/pages/instructors-portal/student-progress";
import SubmissionReview from "@/pages/instructors-portal/student-progress/[id]";
import AdvancedAnalytics from "@/pages/instructors-portal/analytics";
import WAMCalculatorPage from "@/pages/tools/wam-calculator";
import VehicleCgfaPage from "@/pages/tools/vehicle-cgfa";
import BoxPsiCalculatorPage from "@/pages/tools/box-psi";
import DrumPsiCalculatorPage from "@/pages/tools/drum-psi";
import SkiddedBoxPsiCalculatorPage from "@/pages/tools/skidded-box-psi";
import TirePsiCalculatorPage from "@/pages/tools/tire-psi";
import HomePage from "@/pages/home-page";
import ArmyHomePage from "@/pages/army-home-page";
import NavyHomePage from "@/pages/navy-home-page";
import NotFound from "@/pages/not-found";
import QuizList from "@/pages/instructors-portal/quizzes";
import CreateQuiz from "@/pages/instructors-portal/quizzes/create";
import QuizDetail from "@/pages/instructors-portal/quizzes/[id]";
import EditQuizPage from "@/pages/instructors-portal/quizzes/edit/[id]";
import SuperAdminDashboard from "@/pages/superadmin-dashboard";
import LicensingManagement from "@/pages/licensing-management-fixed";
import LicenseRegistration from "@/pages/license-registration";
import ScenarioSubmissions from "@/pages/instructors-portal/submissions";
import DocumentSubmissions from "@/pages/instructors-portal/document-submissions";
import TeachingMaterials from "@/pages/instructors-portal/resources";
import BestPractices from "@/pages/instructors-portal/best-practices";
import ScenarioResources from "@/pages/instructors-portal/scenarios/resources";
import QuizPage from "@/pages/quizzes/[id]";
import QuizSubmissions from "@/pages/instructors-portal/quiz-submissions";
import QuizSubmissionDetail from "@/pages/instructors-portal/quiz-submissions/[id]";
import PermissionsDashboard from "@/pages/permissions-dashboard";

// Import route protection components (we'll adapt these)
import { ProtectedRoute, AuthenticatedRoute, SuperAdminRoute, InstructorRoute } from "./lib/auth-routes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
// import OfflineStatus from "@/components/OfflineStatus";

const queryClient = createOfflineQueryClient();

function AuthenticatedApp() {
  const { user } = useIsolatedAuth();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Header />
        <main className="main-content">
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
            <Route path="/profile" component={ProfilePage} />
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
        </main>
        <BottomNav />
        <Footer />
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