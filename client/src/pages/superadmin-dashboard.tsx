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
  RefreshCw
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

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/licensing/dashboard-stats']
  });

  // Fetch activity log
  const { data: activityLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<ActivityLogEntry[]>({
    queryKey: ['/api/activity-log'],
  });

  // Chat reset mutation
  const resetChatMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting chat reset request...");
      
      const response = await fetch('/api/chat-messages/reset', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Reset response status:", response.status);
      console.log("Reset response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Reset request failed:", errorText);
        throw new Error(`Failed to reset chat logs: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Reset successful:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Reset mutation success:", data);
      toast({
        title: "Chat Reset Complete",
        description: "All chat messages have been permanently deleted.",
      });
      // Invalidate chat messages cache
      queryClient.invalidateQueries({ queryKey: ["/api/chat-messages"] });
    },
    onError: (error) => {
      console.error("Reset mutation error:", error);
      toast({
        title: "Reset Failed",
        description: `Failed to reset chat logs: ${error.message}`,
        variant: "destructive",
      });
    },
  });

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
                <p className="text-slate-400">System Management & Control</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                // Proper logout that clears session and redirects
                fetch('/api/logout', { method: 'POST' })
                  .then(() => {
                    window.location.href = '/auth';
                  });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Licenses</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? "..." : stats?.totalLicenses || 0}
                  </p>
                </div>
                <Key className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Active Sessions</p>
                  <p className="text-3xl font-bold text-green-400">
                    {isLoading ? "..." : stats?.activeSessions || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Expiring Soon</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {isLoading ? "..." : stats?.expiringLicenses || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Utilization</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {isLoading ? "..." : `${stats?.utilizationRate || 0}%`}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Interface */}
        <Tabs defaultValue="licensing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
            <TabsTrigger value="licensing" className="data-[state=active]:bg-purple-600">
              License Management
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
              System Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="deletion-log" className="data-[state=active]:bg-orange-600">
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Deletion Log
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="licensing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    License Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Create, manage, and monitor user licenses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setLocation('/licensing-management')}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Open License Manager
                  </Button>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <div className="text-green-400 font-semibold">
                        {stats?.activeLicenses || 0}
                      </div>
                      <div className="text-slate-400">Active</div>
                    </div>
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <div className="text-red-400 font-semibold">
                        {stats?.expiredLicenses || 0}
                      </div>
                      <div className="text-slate-400">Expired</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Permission Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage user roles and access permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setLocation('/permissions-dashboard')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Open Permissions Dashboard
                  </Button>
                  <div className="text-sm text-slate-400">
                    View and modify user roles, permissions, and access levels across the platform
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    User Registration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage the license registration process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setLocation('/license-registration')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    View Registration Portal
                  </Button>
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-slate-300 text-sm">
                      Users can register with valid license keys
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">System operational - All services running</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-300">
                      {stats?.expiringLicenses || 0} licenses expiring within 7 days
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">
                      {stats?.activeSessions || 0} active user sessions
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">Database</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Healthy</Badge>
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
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">Licensing</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  System Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-300">
                  <p>Detailed analytics and reporting features will be available here.</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Track license usage, user engagement, and system performance over time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                              {new Date(entry.performedAt).toLocaleString("en-AU", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
                    <p className="text-xs text-slate-500 mt-3 px-4">
                      Showing {activityLogs.length} most recent entries
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                  <div className="text-slate-300">
                    <p>System configuration and administrative settings.</p>
                    <p className="text-sm text-slate-400 mt-2">
                      Configure system defaults, security settings, and maintenance options.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    Chat Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage chat system and message history
                  </CardDescription>
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
                      onClick={() => {
                        console.log("Reset button clicked!");
                        console.log("Mutation state:", {
                          isPending: resetChatMutation.isPending,
                          isError: resetChatMutation.isError,
                          error: resetChatMutation.error
                        });
                        resetChatMutation.mutate();
                      }}
                      disabled={resetChatMutation.isPending}
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {resetChatMutation.isPending ? "Resetting..." : "Reset Chat Logs"}
                    </Button>
                  </div>
                  <div className="text-xs text-slate-400">
                    Warning: This action cannot be undone. All chat history will be permanently lost.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}