import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";

import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DocumentFormPage from "@/pages/document-form-page";
import ScenarioPage from "@/pages/scenario-page-new";
import DocsListPage from "@/pages/docs-list-page";
import ScenariosPage from "@/pages/scenarios-page";
import LoadPlanningPage from "@/pages/new-load-planning-page";
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";
import DocumentsPage from "@/pages/cargo-manifest-page"; // Changed name but kept file
import ProfilePage from "@/pages/profile-page";
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
import { ProtectedRoute, AuthenticatedRoute } from "./lib/protected-route";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/documents-old" component={DocsListPage} /> {/* Keep as backup */}
          <Route path="/documents/:id" component={DocumentFormPage} />
          <Route path="/scenarios" component={ScenariosPage} />
          <Route path="/scenarios/:id" component={ScenarioPage} />
          <Route path="/load-planning" component={LoadPlanningSelectionPage} />
          <Route path="/load-planning/c27j" component={LoadPlanningPage} />
          <Route path="/load-planning/c17" component={LoadPlanningPage} />
          <Route path="/load-planning/c130" component={LoadPlanningPage} />
          <Route path="/load-planning/kc30a" component={LoadPlanningPage} />
          <Route path="/documents" component={DocumentsPage} /> {/* Renamed from cargo-manifest */}
          <Route path="/cargo-manifest" component={DocumentsPage} /> {/* Keep old path working */}
          <Route path="/profile" component={ProfilePage} />
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
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
