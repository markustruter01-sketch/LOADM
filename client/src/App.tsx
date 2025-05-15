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
import ScenarioPage from "@/pages/scenario-page";
import DirectDocumentsPage from "@/pages/direct-documents-page";
import ScenariosPage from "@/pages/scenarios-page";
import LoadPlanningPage from "@/pages/load-planning-page";
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";
import CargoManifestPage from "@/pages/cargo-manifest-page";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import DocumentManagement from "@/pages/admin/document-management";
import ScenarioManagement from "@/pages/admin/scenario-management";
import { ProtectedRoute } from "./lib/protected-route";
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
          <Route path="/documents" component={DirectDocumentsPage} />
          <Route path="/documents/:id" component={DocumentFormPage} />
          <Route path="/scenarios" component={ScenariosPage} />
          <Route path="/scenarios/:id" component={ScenarioPage} />
          <Route path="/load-planning" component={LoadPlanningSelectionPage} />
          <Route path="/load-planning/c27j" component={LoadPlanningPage} />
          <Route path="/load-planning/c17" component={LoadPlanningPage} />
          <Route path="/load-planning/c130" component={LoadPlanningPage} />
          <Route path="/load-planning/kc30a" component={LoadPlanningPage} />
          <Route path="/cargo-manifest" component={CargoManifestPage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <ProtectedRoute path="/admin/documents" component={DocumentManagement} />
          <ProtectedRoute path="/admin/scenarios" component={ScenarioManagement} />
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
