import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
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
  TrendingUp
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

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/licensing/dashboard-stats']
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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

          <TabsContent value="settings" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}