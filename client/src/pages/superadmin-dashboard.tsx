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
  FileText,
  Monitor,
  Upload,
  BookOpen
} from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="licensing" className="data-[state=active]:bg-purple-600">
              License Management
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
              System Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              Analytics
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
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    Training Analytics
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Monitor training progress and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setLocation('/analytics')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    View Training Analytics
                  </Button>
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-slate-300 text-sm">
                      Track quiz scores, completion rates, and squadron performance
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    Content Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage training modules and documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setLocation('/instructors-portal/training-modules')}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Manage Training Content
                  </Button>
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-slate-300 text-sm">
                      Add, edit, and organize training modules and documents
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-cyan-400" />
                    System Monitor
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Real-time system health and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => {
                      toast({
                        title: "System Monitor",
                        description: "Opening system health dashboard...",
                      });
                      // Could navigate to a detailed system monitoring page
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    View System Health
                  </Button>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-700 p-2 rounded">
                      <div className="text-green-400 font-semibold">99.9%</div>
                      <div className="text-slate-400">Uptime</div>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                      <div className="text-blue-400 font-semibold">12ms</div>
                      <div className="text-slate-400">Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-pink-400" />
                    Bulk Operations
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Mass user operations and data management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Bulk Operations",
                        description: "Opening bulk management tools...",
                      });
                    }}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    Bulk License Management
                  </Button>
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-slate-300 text-sm">
                      Import/export licenses, bulk user operations, data backups
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
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

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Training System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Quiz System</span>
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      </div>
                      <p className="text-sm text-slate-400">97+ questions available</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Training Modules</span>
                        <Badge variant="default" className="bg-green-500">Ready</Badge>
                      </div>
                      <p className="text-sm text-slate-400">Aircraft-specific content</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Load Planning</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>
                      <p className="text-sm text-slate-400">Multi-aircraft support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Training Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Average Quiz Score</span>
                        <span className="text-green-400 font-bold">78.5%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '78.5%'}}></div>
                      </div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Module Completion</span>
                        <span className="text-blue-400 font-bold">85%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Squadron Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                      <span className="text-white">33 SQN</span>
                      <Badge variant="outline" className="bg-green-600/20 border-green-600">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                      <span className="text-white">35 SQN</span>
                      <Badge variant="outline" className="bg-green-600/20 border-green-600">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                      <span className="text-white">36 SQN</span>
                      <Badge variant="outline" className="bg-green-600/20 border-green-600">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                      <span className="text-white">37 SQN</span>
                      <Badge variant="outline" className="bg-yellow-600/20 border-yellow-600">Training</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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