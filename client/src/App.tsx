import { lazy, Suspense, type ComponentType } from "react";
import { Route, Switch, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import type { Capability } from "@shared/constants";
import { queryClient } from "@/lib/queryClient";
import { PersonaProvider, usePersona } from "@/lib/persona";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { LoadingState, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import RolePicker from "@/pages/role-picker";
import NotFound from "@/pages/not-found";

// Pages are lazy so each role only downloads what it uses.
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const TrainingList = lazy(() => import("@/pages/training/index"));
const TrainingModule = lazy(() => import("@/pages/training/module"));
const QuizList = lazy(() => import("@/pages/quizzes/index"));
const QuizTake = lazy(() => import("@/pages/quizzes/take"));
const QuizResult = lazy(() => import("@/pages/quizzes/result"));
const ScenarioList = lazy(() => import("@/pages/scenarios/index"));
const ScenarioTake = lazy(() => import("@/pages/scenarios/take"));
const ScenarioResult = lazy(() => import("@/pages/scenarios/result"));
const ChecklistList = lazy(() => import("@/pages/checklists/index"));
const ChecklistRun = lazy(() => import("@/pages/checklists/run"));
const LoadPlanningSelect = lazy(() => import("@/pages/load-planning/index"));
const LoadPlanning = lazy(() => import("@/pages/load-planning/plan"));
const Missions = lazy(() => import("@/pages/missions/index"));
const MissionDetail = lazy(() => import("@/pages/missions/detail"));
const Documents = lazy(() => import("@/pages/documents/index"));
const DocumentForm = lazy(() => import("@/pages/documents/form"));
const Tools = lazy(() => import("@/pages/tools/index"));
const ToolPage = lazy(() => import("@/pages/tools/tool"));
const Directory = lazy(() => import("@/pages/directory"));
const Chat = lazy(() => import("@/pages/chat"));

const InstructorDashboard = lazy(() => import("@/pages/instructor/index"));
const ReviewQueue = lazy(() => import("@/pages/instructor/reviews/index"));
const ReviewSubmission = lazy(() => import("@/pages/instructor/reviews/review"));
const Students = lazy(() => import("@/pages/instructor/students/index"));
const StudentDetail = lazy(() => import("@/pages/instructor/students/detail"));
const QuestionBank = lazy(() => import("@/pages/instructor/question-bank"));
const ManageQuizzes = lazy(() => import("@/pages/instructor/quizzes/index"));
const QuizEditor = lazy(() => import("@/pages/instructor/quizzes/editor"));
const QuizInsights = lazy(() => import("@/pages/instructor/quizzes/insights"));
const ManageScenarios = lazy(() => import("@/pages/instructor/scenarios/index"));
const ScenarioEditor = lazy(() => import("@/pages/instructor/scenarios/editor"));
const ManageModules = lazy(() => import("@/pages/instructor/modules/index"));
const ModuleEditor = lazy(() => import("@/pages/instructor/modules/editor"));
const ManageChecklists = lazy(() => import("@/pages/instructor/checklists/index"));
const ChecklistEditor = lazy(() => import("@/pages/instructor/checklists/editor"));
const SafetyRecords = lazy(() => import("@/pages/instructor/safety/index"));

const CommandReadiness = lazy(() => import("@/pages/command/index"));
const CommandPerformance = lazy(() => import("@/pages/command/performance"));
const CommandCurrency = lazy(() => import("@/pages/command/currency"));
const CommandSafety = lazy(() => import("@/pages/command/safety"));
const CommandFlightOps = lazy(() => import("@/pages/command/flight-ops"));
const CommandPersonnel = lazy(() => import("@/pages/command/personnel"));
const CommandActivity = lazy(() => import("@/pages/command/activity"));

/** Route guarded by capability. Renders a friendly block instead of a dead end. */
function Guarded({ requires, component: C }: { requires?: Capability; component: ComponentType<Record<string, never>> }) {
  const { can } = usePersona();
  const [, navigate] = useLocation();
  if (requires && !can(requires)) {
    return (
      <EmptyState
        title="Not available for this role"
        description="Switch to a role with the right permissions using the menu in the top-right corner."
        action={<Button onClick={() => navigate("/")}>Go to dashboard</Button>}
      />
    );
  }
  return <C />;
}

const ROUTES: Array<{ path: string; component: ComponentType<Record<string, never>>; requires?: Capability }> = [
  { path: "/", component: Dashboard },
  { path: "/profile", component: Profile },
  { path: "/training", component: TrainingList },
  { path: "/training/:id", component: TrainingModule },
  { path: "/quizzes", component: QuizList },
  { path: "/quizzes/:id", component: QuizTake },
  { path: "/quizzes/results/:submissionId", component: QuizResult },
  { path: "/scenarios", component: ScenarioList },
  { path: "/scenarios/:id", component: ScenarioTake },
  { path: "/scenarios/results/:submissionId", component: ScenarioResult },
  { path: "/checklists", component: ChecklistList },
  { path: "/checklists/:id", component: ChecklistRun },
  { path: "/tools", component: Tools },
  { path: "/tools/:tool", component: ToolPage },
  { path: "/directory", component: Directory },
  { path: "/chat", component: Chat },
  { path: "/load-planning", component: LoadPlanningSelect, requires: "operate" },
  { path: "/load-planning/:aircraft", component: LoadPlanning, requires: "operate" },
  { path: "/missions", component: Missions, requires: "operate" },
  { path: "/missions/:id", component: MissionDetail, requires: "operate" },
  { path: "/documents", component: Documents, requires: "operate" },
  { path: "/documents/:id", component: DocumentForm, requires: "operate" },
  { path: "/instructor", component: InstructorDashboard, requires: "instruct" },
  { path: "/instructor/reviews", component: ReviewQueue, requires: "instruct" },
  { path: "/instructor/reviews/:submissionId", component: ReviewSubmission, requires: "instruct" },
  { path: "/instructor/students", component: Students, requires: "instruct" },
  { path: "/instructor/students/:id", component: StudentDetail, requires: "instruct" },
  { path: "/instructor/question-bank", component: QuestionBank, requires: "instruct" },
  { path: "/instructor/quizzes", component: ManageQuizzes, requires: "instruct" },
  { path: "/instructor/quizzes/new", component: QuizEditor, requires: "instruct" },
  { path: "/instructor/quizzes/:id", component: QuizInsights, requires: "instruct" },
  { path: "/instructor/quizzes/:id/edit", component: QuizEditor, requires: "instruct" },
  { path: "/instructor/scenarios", component: ManageScenarios, requires: "instruct" },
  { path: "/instructor/scenarios/new", component: ScenarioEditor, requires: "instruct" },
  { path: "/instructor/scenarios/:id/edit", component: ScenarioEditor, requires: "instruct" },
  { path: "/instructor/modules", component: ManageModules, requires: "instruct" },
  { path: "/instructor/modules/new", component: ModuleEditor, requires: "instruct" },
  { path: "/instructor/modules/:id", component: ModuleEditor, requires: "instruct" },
  { path: "/instructor/checklists", component: ManageChecklists, requires: "instruct" },
  { path: "/instructor/checklists/new", component: ChecklistEditor, requires: "instruct" },
  { path: "/instructor/checklists/:id", component: ChecklistEditor, requires: "instruct" },
  { path: "/instructor/safety", component: SafetyRecords, requires: "instruct" },
  { path: "/command", component: CommandReadiness, requires: "command" },
  { path: "/command/performance", component: CommandPerformance, requires: "command" },
  { path: "/command/currency", component: CommandCurrency, requires: "command" },
  { path: "/command/safety", component: CommandSafety, requires: "command" },
  { path: "/command/flight-ops", component: CommandFlightOps, requires: "command" },
  { path: "/command/personnel", component: CommandPersonnel, requires: "command" },
  { path: "/command/activity", component: CommandActivity, requires: "command" },
];

function Routed() {
  const { role, isReady, isLoading } = usePersona();
  if (!role) return <RolePicker />;
  if (isLoading || !isReady) {
    return (
      <div className="mx-auto max-w-3xl p-10">
        <LoadingState rows={4} />
      </div>
    );
  }
  return (
    <AppShell>
      <Suspense fallback={<LoadingState rows={4} />}>
        <Switch>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path}>
              <Guarded requires={r.requires} component={r.component} />
            </Route>
          ))}
          <Route path="/home">
            <Redirect to="/" />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <PersonaProvider>
          <Routed />
          <Toaster />
        </PersonaProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
