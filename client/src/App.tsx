import { Switch, Route } from "wouter";
import { QueryClientProvider } from '@tanstack/react-query';
import { createOfflineQueryClient } from "@/lib/queryClient";
import { useState, useEffect } from 'react';
import { IsolatedAuthProvider, useIsolatedAuth } from './auth-isolated/auth-context';
import { RedesignedLogin } from './auth-isolated/redesigned-login';
import { FirstTimePasswordChange } from './auth-isolated/first-time-password';
import OnboardingTour from '@/components/OnboardingTour';

// Import all your existing pages
import DocumentFormPage from "@/pages/document-form-page";
import ModernScenarioPage from "@/pages/scenario-page-modern";
import DocsListPage from "@/pages/docs-list-page";
import ScenariosPage from "@/pages/scenarios-page";
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";
import LoadPlanningPage from "@/pages/load-planning-page";
import DocumentsPage from "@/pages/documents-page";
import UserProfile from "@/pages/user-profile";
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
import RestraintCalculatorPage from "@/pages/tools/restraint-calculator";
import FuelCalculatorPage from "@/pages/tools/fuel-calculator";
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
import LicensingManagement from "@/pages/licensing-management";
import LicenseRegistration from "@/pages/license-registration";
import ScenarioSubmissions from "@/pages/instructors-portal/submissions";

import TeachingMaterials from "@/pages/instructors-portal/resources";
import BestPractices from "@/pages/instructors-portal/best-practices";
import ScenarioResources from "@/pages/instructors-portal/scenarios/resources";
import QuizPage from "@/pages/quizzes/[id]";
import QuizSubmissions from "@/pages/instructors-portal/quiz-submissions";
import QuizSubmissionDetail from "@/pages/instructors-portal/quiz-submissions/[id]";
import WorkforcePage from "@/pages/instructors-portal/workforce";
import PermissionsDashboard from "@/pages/permissions-dashboard";
import QuizQuestionsManagement from "@/pages/instructors-portal/quiz-questions";
import TrainingModulesManagement from "@/pages/instructors-portal/training-modules";
import ChecklistDetailPage from "@/pages/tools/checklists/[id]";
import ChecklistManagement from "@/pages/instructors-portal/checklist-management";


// Import route protection components (we'll adapt these)
import { ProtectedRoute, AuthenticatedRoute, SuperAdminRoute, InstructorRoute } from "./lib/auth-routes";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ChatSystem } from "@/components/chat-system";
// import OfflineStatus from "@/components/OfflineStatus";

const queryClient = createOfflineQueryClient();

function AuthenticatedApp() {
  const { user, refreshUser } = useIsolatedAuth();
  
  // ONBOARDING SYSTEM DEACTIVATED - Users go directly to home dashboard
  // const [showOnboarding, setShowOnboarding] = useState(false);
  
  // // Check if user needs onboarding after first login password change
  // useEffect(() => {
  //   if (user && !user.isFirstLogin && user.hasCompletedOnboarding === false) {
  //     setShowOnboarding(true);
  //   }
  // }, [user]);

  // const handleOnboardingComplete = async () => {
  //   setShowOnboarding(false);
  //   await refreshUser();
  // };

  // const handleOnboardingSkip = () => {
  //   setShowOnboarding(false);
  // };
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Header />
        <main className="main-content pb-20">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/army" component={ArmyHomePage} />
            <Route path="/navy" component={NavyHomePage} />
            <Route path="/documents-old" component={DocsListPage} />
            <Route path="/documents/:id" component={DocumentFormPage} />
            <Route path="/scenarios" component={ScenariosPage} />
            <Route path="/scenarios/:id" component={ModernScenarioPage} />
            <Route path="/airframe">
              {(params) => <AirframeIntegratedPage {...params} />}
            </Route>

            <Route path="/load-planning" component={LoadPlanningSelectionPage} />
            <Route path="/load-planning/:aircraftId" component={LoadPlanningPage} />

            <Route path="/documents" component={DocumentsPage} />

            <Route path="/tools" component={ToolsPage} />
            <Route path="/tools/restraint-calculator" component={RestraintCalculatorPage} />
            <Route path="/tools/fuel-calculator" component={FuelCalculatorPage} />
            <Route path="/tools/wam-calculator" component={WAMCalculatorPage} />
            <Route path="/tools/vehicle-cgfa" component={VehicleCgfaPage} />
            <Route path="/tools/box-psi" component={BoxPsiCalculatorPage} />
            <Route path="/tools/drum-psi" component={DrumPsiCalculatorPage} />
            <Route path="/tools/skidded-box-psi" component={SkiddedBoxPsiCalculatorPage} />
            <Route path="/tools/tire-psi" component={TirePsiCalculatorPage} />
            <AuthenticatedRoute path="/tools/checklists/:id" component={ChecklistDetailPage} />
            <Route path="/training-modules" component={TrainingModulesPage} />
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
            <InstructorRoute path="/instructors-portal/quiz-management" component={QuizList} />
            <InstructorRoute path="/instructors-portal/quizzes" component={QuizList} />
            <InstructorRoute path="/instructors-portal/quizzes/create" component={CreateQuiz} />
            <InstructorRoute path="/instructors-portal/quizzes/:id" component={QuizDetail} />
            <InstructorRoute path="/instructors-portal/quizzes/edit/:id" component={EditQuizPage} />
            <InstructorRoute path="/instructors-portal/workforce" component={WorkforcePage} />
            <SuperAdminRoute path="/superadmin-dashboard" component={SuperAdminDashboard} />
            <SuperAdminRoute path="/licensing" component={LicensingManagement} />
            <SuperAdminRoute path="/licensing-management" component={LicensingManagement} />
            <SuperAdminRoute path="/permissions-dashboard" component={PermissionsDashboard} />
            <Route path="/license-registration" component={LicenseRegistration} />
            <AuthenticatedRoute path="/user-profile" component={UserProfile} />
            <InstructorRoute path="/instructors-portal/submissions" component={ScenarioSubmissions} />

            <InstructorRoute path="/instructors-portal/resources" component={TeachingMaterials} />
            <InstructorRoute path="/instructors-portal/best-practices" component={BestPractices} />
            <InstructorRoute path="/instructors-portal/scenarios/resources" component={ScenarioResources} />
            <AuthenticatedRoute path="/quizzes/:id" component={QuizPage} />
            <InstructorRoute path="/instructors-portal/quiz-submissions" component={QuizSubmissions} />
            <InstructorRoute path="/instructors-portal/quiz-submissions/:id" component={QuizSubmissionDetail} />
            <InstructorRoute path="/instructors-portal/quiz-questions" component={QuizQuestionsManagement} />
            <InstructorRoute path="/instructors-portal/training-modules" component={TrainingModulesManagement} />
            <InstructorRoute path="/instructors-portal/checklist-management" component={ChecklistManagement} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <BottomNav />
        <ChatSystem />
        
        {/* ONBOARDING TOUR DEACTIVATED - Users go directly to home dashboard */}
        {/* <OnboardingTour 
          isVisible={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        /> */}
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
    return <RedesignedLogin />;
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