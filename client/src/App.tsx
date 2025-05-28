import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { OfflineProvider } from "@/hooks/use-offline";
import { createOfflineQueryClient } from "@/lib/offlineClient";

// Create query client with offline support
const queryClient = createOfflineQueryClient();
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
import AuthPage from "@/pages/auth-page";
import DocumentFormPage from "@/pages/document-form-page";
import ScenarioPage from "@/pages/scenario-page-new";
import DocsListPage from "@/pages/docs-list-page";
import ScenariosPage from "@/pages/scenarios-page";
import LoadPlanningPage from "@/pages/load-planning-page";
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";
import DocumentsPage from "@/pages/cargo-manifest-page"; // Changed name but kept file
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
import QuizList from "@/pages/instructors-portal/quizzes";
import CreateQuiz from "@/pages/instructors-portal/quizzes/create";
import QuizDetail from "@/pages/instructors-portal/quizzes/[id]";
import EditQuizPage from "@/pages/instructors-portal/quizzes/edit/[id]";
import ScenarioSubmissions from "@/pages/instructors-portal/submissions";
import DocumentSubmissions from "@/pages/instructors-portal/document-submissions";
import TeachingMaterials from "@/pages/instructors-portal/resources";
import BestPractices from "@/pages/instructors-portal/best-practices";
import ScenarioResources from "@/pages/instructors-portal/scenarios/resources";
import QuizPage from "@/pages/quizzes/[id]";
import QuizSubmissions from "@/pages/instructors-portal/quiz-submissions";
import QuizSubmissionDetail from "@/pages/instructors-portal/quiz-submissions/[id]";
import { ProtectedRoute, AuthenticatedRoute } from "./lib/auth-routes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import OfflineStatus from "@/components/OfflineStatus";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <OfflineStatus />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/army" component={ArmyHomePage} />
          <Route path="/navy" component={NavyHomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/documents-old" component={DocsListPage} /> {/* Keep as backup */}
          <Route path="/documents/:id" component={DocumentFormPage} />
          <Route path="/scenarios" component={ScenariosPage} />
          <Route path="/scenarios/:id" component={ScenarioPage} />
          <Route path="/airframe">
            {(params) => <AirframeIntegratedPage {...params} />}
          </Route>
          <Route path="/load-planning">
            {(params) => <LoadPlanningSelectionPage {...params} />}
          </Route> {/* Keep for backward compatibility */}
          <Route path="/load-planning/c27j" component={LoadPlanningPage} />
          <Route path="/load-planning/c17" component={LoadPlanningPage} />
          <Route path="/load-planning/c130" component={LoadPlanningPage} />
          <Route path="/load-planning/kc30a" component={LoadPlanningPage} />
          <Route path="/documents" component={DocumentsPage} /> {/* Renamed from cargo-manifest */}
          <Route path="/cargo-manifest" component={DocumentsPage} /> {/* Keep old path working */}
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
          <AuthenticatedRoute path="/instructors-portal" component={InstructorsPortal} />
          <AuthenticatedRoute path="/instructors-portal/scenarios" component={InstructorsScenarios} />
          <AuthenticatedRoute path="/instructors-portal/scenarios/create" component={CreateScenario} />
          <AuthenticatedRoute path="/instructors-portal/scenarios/edit/:id" component={EditScenario} />
          <AuthenticatedRoute path="/instructors-portal/student-progress" component={StudentProgress} />
          <AuthenticatedRoute path="/instructors-portal/student-progress/:id" component={SubmissionReview} />
          <AuthenticatedRoute path="/instructors-portal/analytics" component={AdvancedAnalytics} />
          <AuthenticatedRoute path="/instructors-portal/submissions" component={ScenarioSubmissions} />
          <AuthenticatedRoute path="/instructors-portal/document-submissions" component={DocumentSubmissions} />
          <AuthenticatedRoute path="/instructors-portal/quiz-submissions" component={QuizSubmissions} />
          <AuthenticatedRoute path="/instructors-portal/quiz-submissions/:id" component={QuizSubmissionDetail} />
          <AuthenticatedRoute path="/instructors-portal/resources" component={TeachingMaterials} />
          <AuthenticatedRoute path="/instructors-portal/best-practices" component={BestPractices} />
          <AuthenticatedRoute path="/instructors-portal/scenarios/resources" component={ScenarioResources} />
          <AuthenticatedRoute path="/instructors-portal/quizzes" component={QuizList} />
          <AuthenticatedRoute path="/instructors-portal/quizzes/create" component={CreateQuiz} />
          <AuthenticatedRoute path="/instructors-portal/quizzes/edit/:id" component={EditQuizPage} />
          <AuthenticatedRoute path="/instructors-portal/quizzes/:id" component={QuizDetail} />
          <Route path="/quizzes/:id" component={QuizPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfflineProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </OfflineProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
