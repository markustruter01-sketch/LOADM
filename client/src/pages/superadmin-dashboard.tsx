import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  Key,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  UserCheck,
  Activity,
  TrendingUp,
  MessageCircle,
  Trash2,
  ClipboardList,
  RefreshCw,
  AlertOctagon,
  BookOpen,
  FileText,
  CheckSquare,
  HelpCircle,
  GraduationCap,
  ClipboardCheck,
  ArrowRight,
  ChevronRight,
  UserCog,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";

interface ActivityLogEntry {
  id: number;
  userId: number | null;
  userEmail: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceName: string;
  details: string | null;
  performedAt: string;
}

interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  suspendedLicenses: number;
  activeSessions: number;
  expiringLicenses: number;
  utilizationRate: number;
}

interface InstructorUser { userId: number; licenseType: string; }

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/licensing/dashboard-stats'],
  });

  const { data: activityLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<ActivityLogEntry[]>({
    queryKey: ['/api/activity-log'],
  });

  const { data: squadronReadinessData } = useQuery<any>({
    queryKey: ['/api/analytics/squadron-readiness'],
  });
  const { data: scenarioSubmissions = [] } = useQuery<any[]>({
    queryKey: ['/api/scenario-submissions'],
  });
  const { data: scenarios = [] } = useQuery<any[]>({
    queryKey: ['/api/scenarios'],
  });
  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ['/api/documents'],
  });
  const { data: trainingModules = [] } = useQuery<any[]>({
    queryKey: ['/api/training-modules'],
  });
  const { data: checklists = [] } = useQuery<any[]>({
    queryKey: ['/api/checklists'],
  });
  const { data: quizzes = [] } = useQuery<any[]>({
    queryKey: ['/api/quizzes'],
  });
  const { data: instructorUsers = [] } = useQuery<InstructorUser[]>({
    queryKey: ['/api/instructor/users'],
  });

  const squadronList: any[] = squadronReadinessData?.bySquadron ?? [];
  const readinessSummary = squadronReadinessData?.summary ?? { total: 0, ready: 0, notReady: 0, readyPercent: 0 };
  const overallReadinessRate: number = readinessSummary.readyPercent;
  const totalReadyMembers: number = readinessSummary.ready;
  const totalMembers: number = readinessSummary.total;
  const pendingReviews = (scenarioSubmissions as any[]).filter(
    (s: any) => s.status === 'pending' && s.submissionType === 'assessment'
  ).length;
  const instructorCount = instructorUsers.filter((u) => u.licenseType === 'instructor').length;
  const loadmasterCount = instructorUsers.filter((u) => u.licenseType === 'loadmaster').length;
  const totalActiveUsers = instructorUsers.length;

  const resetChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/chat-messages/reset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset chat logs: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Chat Reset Complete", description: "All chat messages have been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-messages"] });
    },
    onError: (error) => {
      toast({ title: "Reset Failed", description: `Failed to reset chat logs: ${error.message}`, variant: "destructive" });
    },
  });

  const managementTiles = [
    {
      title: "User Management",
      desc: "Manage accounts, roles, and permissions",
      icon: <UserCog className="h-6 w-6 text-blue-400" />,
      href: "/admin/users",
      badge: "Super Admin",
      badgeColor: "bg-purple-600",
      urgent: false,
    },
    {
      title: "Document Templates",
      desc: "Create and manage form templates",
      icon: <FileText className="h-6 w-6 text-slate-400" />,
      href: "/admin/documents",
      badge: `${documents.length} templates`,
      badgeColor: "bg-slate-600",
      urgent: false,
    },
    {
      title: "Scenario Management",
      desc: "Build and manage training scenarios",
      icon: <ClipboardList className="h-6 w-6 text-purple-400" />,
      href: "/instructors-portal/scenarios",
      badge: `${scenarios.length} scenarios`,
      badgeColor: "bg-purple-700",
      urgent: false,
    },
    {
      title: "Quiz Management",
      desc: "Create and manage pop quizzes",
      icon: <HelpCircle className="h-6 w-6 text-cyan-400" />,
      href: "/instructors-portal/quizzes",
      badge: `${quizzes.length} quizzes`,
      badgeColor: "bg-cyan-700",
      urgent: false,
    },
    {
      title: "Training Modules",
      desc: "Manage aircraft training content",
      icon: <BookOpen className="h-6 w-6 text-emerald-400" />,
      href: "/instructors-portal/training-modules",
      badge: `${trainingModules.length} modules`,
      badgeColor: "bg-emerald-700",
      urgent: false,
    },
    {
      title: "Checklist Management",
      desc: "Build and manage operational checklists",
      icon: <CheckSquare className="h-6 w-6 text-rose-400" />,
      href: "/instructors-portal/checklist-management",
      badge: `${checklists.length} checklists`,
      badgeColor: "bg-rose-700",
      urgent: false,
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
      urgent: false,
    },
  ];

  const topStats = [
    { label: "Total Licenses", value: isLoading ? "…" : (stats?.totalLicenses ?? 0), sub: `${stats?.activeLicenses ?? 0} active`, icon: <Key className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
    { label: "Active Sessions", value: isLoading ? "…" : (stats?.activeSessions ?? 0), sub: "Currently logged in", icon: <Activity className="w-5 h-5 text-green-400" />, color: "text-green-400" },
    { label: "Expiring Soon", value: isLoading ? "…" : (stats?.expiringLicenses ?? 0), sub: "Within 7 days", icon: <AlertTriangle className="w-5 h-5 text-orange-400" />, color: (stats?.expiringLicenses ?? 0) > 0 ? "text-orange-400" : "text-slate-400", urgent: (stats?.expiringLicenses ?? 0) > 0 },
    { label: "Utilisation", value: isLoading ? "…" : `${stats?.utilizationRate ?? 0}%`, sub: "License usage rate", icon: <TrendingUp className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
    { label: "Active Personnel", value: totalActiveUsers, sub: `${instructorCount} instructors · ${loadmasterCount} loadmasters`, icon: <Users className="w-5 h-5 text-cyan-400" />, color: "text-cyan-400" },
    { label: "Pending Reviews", value: pendingReviews, sub: "Assessments awaiting review", icon: <ClipboardCheck className="w-5 h-5 text-orange-400" />, color: pendingReviews > 0 ? "text-orange-400" : "text-slate-400", urgent: pendingReviews > 0 },
    { label: "Scenarios", value: scenarios.length, sub: `${scenarioSubmissions.length} total submissions`, icon: <GraduationCap className="w-5 h-5 text-pink-400" />, color: "text-pink-400" },
    { label: "Training Content", value: quizzes.length + trainingModules.length + checklists.length, sub: `${quizzes.length} quizzes · ${trainingModules.length} modules · ${checklists.length} checklists`, icon: <BookOpen className="w-5 h-5 text-emerald-400" />, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
                <p className="text-slate-400">System Management &amp; Control</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetch('/api/logout', { method: 'POST' }).then(() => { window.location.href = '/'; });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">

        {/* 8-card stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {topStats.map(({ label, value, sub, icon, color, urgent }) => (
            <Card
              key={label}
              className={`border ${urgent ? "border-orange-500/40 bg-orange-500/5" : "bg-slate-800 border-slate-700"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {icon}
                  {urgent && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs font-medium text-slate-300 mt-0.5 leading-tight">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Reviews Alert — persistent, above tabs */}
        {pendingReviews > 0 && (
          <div className="p-4 bg-orange-950/40 border border-orange-500/40 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="font-semibold text-orange-300">
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

        {/* Main Tabs */}
        <Tabs defaultValue="licensing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800 border border-slate-700">
            <TabsTrigger value="licensing" className="data-[state=active]:bg-purple-600 text-xs">
              License Management
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-600 text-xs flex items-center gap-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-purple-600 text-xs">
              System Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 text-xs">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="deletion-log" className="data-[state=active]:bg-orange-600 text-xs flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              Deletion Log
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 text-xs">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ── LICENSE MANAGEMENT TAB ── */}
          <TabsContent value="licensing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    License Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">Create, manage, and monitor user licenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => setLocation('/licensing-management')} className="w-full bg-purple-600 hover:bg-purple-700">
                    Open License Manager
                  </Button>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <div className="text-green-400 font-semibold text-lg">{stats?.activeLicenses ?? 0}</div>
                      <div className="text-slate-400">Active</div>
                    </div>
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <div className="text-red-400 font-semibold text-lg">{stats?.expiredLicenses ?? 0}</div>
                      <div className="text-slate-400">Expired</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage user roles and access permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => setLocation('/admin/users')} className="w-full bg-blue-600 hover:bg-blue-700">
                    Open User Management
                  </Button>
                  <div className="text-sm text-slate-400">
                    Assign roles (Loadmaster, Instructor, Leadership, Super Admin), delete accounts, view passwords
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    User Registration
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage the license registration process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => setLocation('/license-registration')} className="w-full bg-green-600 hover:bg-green-700">
                    View Registration Portal
                  </Button>
                  <div className="bg-slate-700 p-3 rounded-lg text-sm text-slate-300">
                    Users can register with valid license keys
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Recent Activity */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.length === 0 ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">System operational — All services running</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-300">{stats?.expiringLicenses ?? 0} licenses expiring within 7 days</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300">{stats?.activeSessions ?? 0} active user sessions</span>
                      </div>
                    </>
                  ) : (
                    activityLogs.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-slate-300 text-sm">
                            <span className="font-medium text-white">{entry.userName}</span>
                            {" deleted "}
                            <span className="text-red-400 font-medium">{entry.resourceName}</span>
                            <span className="text-slate-500"> ({entry.resourceType})</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(entry.performedAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CONTENT MANAGEMENT TAB ── */}
          <TabsContent value="content" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Platform Content Management</h2>
              <p className="text-slate-400 text-sm mb-5">Manage all training content, assessments, and user oversight from one place.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {managementTiles.map(({ title, desc, icon, href, badge, badgeColor, urgent }) => (
                  <button
                    key={title}
                    onClick={() => setLocation(href)}
                    className={`group text-left p-4 rounded-lg border transition-all hover:shadow-lg ${
                      urgent
                        ? "border-orange-500/40 bg-orange-500/5 hover:border-orange-500/70"
                        : "border-slate-700 bg-slate-800 hover:border-purple-500/50 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-md bg-slate-700 group-hover:bg-slate-600 transition-colors">
                        {icon}
                      </div>
                      {badge && (
                        <Badge className={`${badgeColor} text-white text-xs`}>{badge}</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-white">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-purple-400 transition-colors">
                      Open <ChevronRight className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── SYSTEM OVERVIEW TAB ── */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {stats ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                      <span className="text-white font-medium">Database</span>
                    </div>
                    <Badge variant="default" className={stats ? "bg-green-500" : "bg-yellow-600"}>
                      {stats ? "Healthy" : "Checking..."}
                    </Badge>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">Authentication</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Operational</Badge>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {(stats?.activeLicenses ?? 0) > 0 ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                      <span className="text-white font-medium">Licensing</span>
                    </div>
                    <Badge variant="default" className={(stats?.activeLicenses ?? 0) > 0 ? "bg-green-500" : "bg-yellow-600"}>
                      {(stats?.activeLicenses ?? 0) > 0 ? `Active (${stats?.activeLicenses})` : "No Active Licenses"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ANALYTICS TAB ── */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Licenses", value: stats?.totalLicenses ?? 0, sub: `${stats?.activeLicenses ?? 0} active`, icon: <Key className="w-4 h-4 text-blue-400" />, color: "text-blue-400" },
                { label: "Overall Readiness", value: `${overallReadinessRate}%`, sub: `${totalReadyMembers} / ${totalMembers} members`, icon: <Activity className="w-4 h-4 text-green-400" />, color: overallReadinessRate >= 80 ? "text-green-400" : overallReadinessRate >= 60 ? "text-yellow-400" : "text-red-400" },
                { label: "Scenario Submissions", value: (scenarioSubmissions as any[]).length, sub: `${pendingReviews} pending review`, icon: <ClipboardList className="w-4 h-4 text-purple-400" />, color: "text-purple-400" },
                { label: "Training Content", value: quizzes.length + trainingModules.length + checklists.length, sub: `${quizzes.length} quizzes · ${trainingModules.length} modules · ${checklists.length} checklists`, icon: <BookOpen className="w-4 h-4 text-cyan-400" />, color: "text-cyan-400" },
              ].map(({ label, value, sub, icon, color }) => (
                <Card key={label} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="mb-2">{icon}</div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs font-medium text-slate-300 mt-0.5">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Squadron Readiness
                </CardTitle>
                <CardDescription className="text-slate-400">Personnel readiness by squadron</CardDescription>
              </CardHeader>
              <CardContent>
                {squadronList.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">No squadron data available.</p>
                ) : (
                  <div className="space-y-3">
                    {squadronList.map((sq: any) => {
                      const rate = sq.readyPercent ?? (sq.total > 0 ? Math.round((sq.ready / sq.total) * 100) : 0);
                      return (
                        <div key={sq.squadron} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 font-medium">{sq.squadron}</span>
                            <span className={`font-bold ${rate >= 80 ? 'text-green-400' : rate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {rate}% ({sq.ready}/{sq.total})
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  License Utilisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Active", value: stats?.activeLicenses ?? 0, color: "text-green-400" },
                    { label: "Expired", value: stats?.expiredLicenses ?? 0, color: "text-red-400" },
                    { label: "Expiring Soon", value: stats?.expiringLicenses ?? 0, color: "text-yellow-400" },
                    { label: "Utilisation Rate", value: `${stats?.utilizationRate ?? 0}%`, color: "text-blue-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-700/50 p-3 rounded-lg text-center">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DELETION LOG TAB ── */}
          <TabsContent value="deletion-log" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-orange-400" />
                      Deletion Activity Log
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      All destructive deletion actions performed by users across the platform
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => refetchLogs()}
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-12 text-slate-400">Loading log entries...</div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No deletions recorded yet</p>
                    <p className="text-sm mt-1">Log entries will appear here whenever a user deletes something.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">When</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Item Deleted</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.map((entry) => (
                          <tr key={entry.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                              {new Date(entry.performedAt).toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-white font-medium">{entry.userName}</div>
                              <div className="text-slate-400 text-xs">{entry.userEmail}</div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                                <Trash2 className="w-3 h-3 mr-1" />
                                {entry.action}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                {entry.resourceType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-white font-medium">{entry.resourceName}</td>
                            <td className="py-3 px-4 text-slate-400 text-xs">{entry.details ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-500 mt-3 px-4">Showing {activityLogs.length} most recent entries</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SETTINGS TAB ── */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">System configuration and administrative settings.</p>
                  <p className="text-sm text-slate-400 mt-2">Configure system defaults, security settings, and maintenance options.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    Chat Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage chat system and message history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-300 mb-3">
                      <p className="font-medium">Reset All Chat Messages</p>
                      <p className="text-slate-400 mt-1">
                        This will permanently delete all chat messages and implement the 7-day cleanup cycle.
                      </p>
                    </div>
                    <Button
                      onClick={() => resetChatMutation.mutate()}
                      disabled={resetChatMutation.isPending}
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {resetChatMutation.isPending ? "Resetting..." : "Reset Chat Logs"}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Warning: This action cannot be undone. All chat history will be permanently lost.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
