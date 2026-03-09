import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ScenarioSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ClipboardList,
  Users,
  BarChart3,
  BookOpen,
  CheckSquare,
  HelpCircle,
  GraduationCap,
  ClipboardCheck,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  UserCog,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";

interface TrainingModule { id: number; title: string; }
interface ChecklistItem { id: number; title: string; }
interface QuizItem { id: number; title: string; }
interface ScenarioItem { id: number; title: string; }
interface DocumentItem { id: number; title: string; }
interface InstructorUser { userId: number; licenseType: string; }

export default function AdminDashboard() {
  const { user } = useIsolatedAuth();
  const [, setLocation] = useLocation();
  const isSuperAdmin = user?.role === 'superadmin';

  const { data: scenarios = [] } = useQuery<ScenarioItem[]>({ queryKey: ["/api/scenarios"] });
  const { data: documents = [] } = useQuery<DocumentItem[]>({ queryKey: ["/api/documents"] });
  const { data: scenarioSubmissions = [] } = useQuery<ScenarioSubmission[]>({ queryKey: ["/api/scenario-submissions"] });
  const { data: trainingModules = [] } = useQuery<TrainingModule[]>({ queryKey: ["/api/training-modules"] });
  const { data: checklists = [] } = useQuery<ChecklistItem[]>({ queryKey: ["/api/checklists"] });
  const { data: quizzes = [] } = useQuery<QuizItem[]>({ queryKey: ["/api/quizzes"] });
  const { data: instructorUsers = [] } = useQuery<InstructorUser[]>({
    queryKey: ["/api/instructor/users"],
    enabled: true,
  });

  const pendingReviews = scenarioSubmissions.filter(
    (s) => (s as any).status === 'pending' && (s as any).submissionType === 'assessment'
  ).length;

  const instructorCount = instructorUsers.filter((u) => u.licenseType === 'instructor').length;
  const loadmasterCount = instructorUsers.filter((u) => u.licenseType === 'loadmaster').length;
  const totalActiveUsers = instructorUsers.length;

  const stats = [
    {
      label: "Active Personnel",
      value: totalActiveUsers,
      sub: `${instructorCount} instructors · ${loadmasterCount} loadmasters`,
      icon: <Users className="h-5 w-5 text-blue-400" />,
      color: "text-blue-400",
    },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      sub: "Assessments awaiting instructor review",
      icon: <ClipboardCheck className="h-5 w-5 text-orange-400" />,
      color: pendingReviews > 0 ? "text-orange-400" : "text-green-400",
      urgent: pendingReviews > 0,
    },
    {
      label: "Scenarios",
      value: scenarios.length,
      sub: `${scenarioSubmissions.length} total submissions`,
      icon: <GraduationCap className="h-5 w-5 text-purple-400" />,
      color: "text-purple-400",
    },
    {
      label: "Pop Quizzes",
      value: quizzes.length,
      sub: "Available quiz assessments",
      icon: <HelpCircle className="h-5 w-5 text-cyan-400" />,
      color: "text-cyan-400",
    },
    {
      label: "Training Modules",
      value: trainingModules.length,
      sub: "Aircraft training content",
      icon: <BookOpen className="h-5 w-5 text-emerald-400" />,
      color: "text-emerald-400",
    },
    {
      label: "Checklists",
      value: checklists.length,
      sub: "Operational checklists",
      icon: <CheckSquare className="h-5 w-5 text-rose-400" />,
      color: "text-rose-400",
    },
  ];

  const managementLinks = [
    {
      title: "User Management",
      desc: "Manage accounts, roles, and permissions",
      icon: <UserCog className="h-6 w-6 text-blue-400" />,
      href: "/admin/users",
      badge: isSuperAdmin ? "Super Admin" : null,
      badgeColor: "bg-purple-600",
    },
    {
      title: "Document Templates",
      desc: "Create and manage form templates",
      icon: <FileText className="h-6 w-6 text-slate-400" />,
      href: "/admin/documents",
      badge: `${documents.length} templates`,
      badgeColor: "bg-slate-600",
    },
    {
      title: "Scenario Management",
      desc: "Build and manage training scenarios",
      icon: <ClipboardList className="h-6 w-6 text-purple-400" />,
      href: "/instructors-portal/scenarios",
      badge: `${scenarios.length} scenarios`,
      badgeColor: "bg-purple-600",
    },
    {
      title: "Quiz Management",
      desc: "Create and manage pop quizzes",
      icon: <HelpCircle className="h-6 w-6 text-cyan-400" />,
      href: "/instructors-portal/quizzes",
      badge: `${quizzes.length} quizzes`,
      badgeColor: "bg-cyan-700",
    },
    {
      title: "Training Modules",
      desc: "Manage aircraft training content",
      icon: <BookOpen className="h-6 w-6 text-emerald-400" />,
      href: "/instructors-portal/training-modules",
      badge: `${trainingModules.length} modules`,
      badgeColor: "bg-emerald-700",
    },
    {
      title: "Checklist Management",
      desc: "Build and manage operational checklists",
      icon: <CheckSquare className="h-6 w-6 text-rose-400" />,
      href: "/instructors-portal/checklist-management",
      badge: `${checklists.length} checklists`,
      badgeColor: "bg-rose-700",
    },
    {
      title: "Student Progress",
      desc: "Review assessment submissions",
      icon: <ClipboardCheck className="h-6 w-6 text-orange-400" />,
      href: "/instructors-portal/student-progress",
      badge: pendingReviews > 0 ? `${pendingReviews} pending` : null,
      badgeColor: "bg-orange-600",
      urgent: pendingReviews > 0,
    },
    {
      title: "Advanced Analytics",
      desc: "Platform-wide performance insights",
      icon: <BarChart3 className="h-6 w-6 text-indigo-400" />,
      href: "/instructors-portal/analytics",
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - LOADMworkflow</title>
        <meta name="description" content="Admin dashboard — manage all platform content, users, and settings" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Platform management &amp; oversight</p>
            </div>
          </div>
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/superadmin-dashboard")}
              className="hidden md:flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Super Admin Panel
            </Button>
          )}
        </div>

        {/* Super Admin redirect banner */}
        {isSuperAdmin && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <p className="font-semibold text-purple-300">You have Super Admin access</p>
                <p className="text-sm text-purple-400/70">The Super Admin Dashboard gives you full platform control — licensing, analytics, deletion log, and settings.</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
              onClick={() => setLocation("/superadmin-dashboard")}
            >
              Super Admin Panel <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Pending Review Alert */}
        {pendingReviews > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400 shrink-0" />
              <div>
                <p className="font-semibold text-orange-400">
                  {pendingReviews} assessment{pendingReviews > 1 ? "s" : ""} awaiting instructor review
                </p>
                <p className="text-sm text-orange-400/70">
                  Students are waiting for feedback on their submitted assessments.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              onClick={() => setLocation("/instructors-portal/student-progress")}
            >
              Review Now <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map(({ label, value, sub, icon, color, urgent }) => (
            <Card
              key={label}
              className={`bg-card border-border ${urgent ? "border-orange-500/40 bg-orange-500/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {icon}
                  {urgent && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Management Areas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {managementLinks.map(({ title, desc, icon, href, badge, badgeColor, urgent }) => (
              <button
                key={title}
                onClick={() => setLocation(href)}
                className={`group text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                  urgent
                    ? "border-orange-500/40 bg-orange-500/5 hover:border-orange-500/60"
                    : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-muted/80 transition-colors">
                    {icon}
                  </div>
                  {badge && (
                    <Badge className={`${badgeColor} text-white text-xs`}>{badge}</Badge>
                  )}
                </div>
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Open <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
