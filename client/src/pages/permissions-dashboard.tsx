import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  Crown, 
  Search, 
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Settings,
  ArrowLeft
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  licenseId?: number | null;
}

interface PermissionStats {
  totalUsers: number;
  superAdmins: number;
  instructors: number;
  loadmasters: number;
  activeUsers: number;
}

export default function PermissionsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/all'],
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: { isAdmin: boolean; isSuperAdmin: boolean } }) => {
      return apiRequest(`/api/users/${userId}/permissions`, {
        method: 'PATCH',
        body: permissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/all'] });
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Calculate permission statistics
  const stats: PermissionStats = {
    totalUsers: users.length,
    superAdmins: users.filter(user => user.isSuperAdmin).length,
    instructors: users.filter(user => user.isAdmin && !user.isSuperAdmin).length,
    loadmasters: users.filter(user => !user.isAdmin && !user.isSuperAdmin).length,
    activeUsers: users.length, // For now, all users are considered active
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'superadmin') return matchesSearch && user.isSuperAdmin;
    if (roleFilter === 'instructor') return matchesSearch && user.isAdmin && !user.isSuperAdmin;
    if (roleFilter === 'loadmaster') return matchesSearch && !user.isAdmin && !user.isSuperAdmin;
    
    return matchesSearch;
  });

  const getRoleInfo = (user: User) => {
    if (user.isSuperAdmin) {
      return { role: 'Super Admin', icon: Crown, color: 'bg-purple-600 text-purple-100 border-purple-500' };
    }
    if (user.isAdmin) {
      return { role: 'Instructor', icon: ShieldCheck, color: 'bg-blue-600 text-blue-100 border-blue-500' };
    }
    return { role: 'Loadmaster', icon: Shield, color: 'bg-green-600 text-green-100 border-green-500' };
  };

  const handlePermissionChange = (userId: number, newPermissions: { isAdmin: boolean; isSuperAdmin: boolean }) => {
    updatePermissionsMutation.mutate({ userId, permissions: newPermissions });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-white">Loading permissions dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button 
          variant="outline" 
          className="mb-6 border-gray-600 text-gray-200 hover:bg-gray-800" 
          onClick={() => setLocation('/superadmin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Permission Management</h1>
            <p className="text-gray-400 mt-2">Manage user roles and access permissions</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Super Admins</CardTitle>
              <Crown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.superAdmins}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Instructors</CardTitle>
              <ShieldCheck className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.instructors}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Loadmasters</CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.loadmasters}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Active Users</CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
            <CardDescription className="text-gray-400">Search and filter users by role and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="superadmin">Super Admins</SelectItem>
                  <SelectItem value="instructor">Instructors</SelectItem>
                  <SelectItem value="loadmaster">Loadmasters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const { role, icon: RoleIcon, color } = getRoleInfo(user);
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-gray-600 text-white">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                      <Badge className={color}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Select
                        value={
                          user.isSuperAdmin ? 'superadmin' : 
                          user.isAdmin ? 'instructor' : 'loadmaster'
                        }
                        onValueChange={(value) => {
                          const permissions = {
                            isAdmin: value === 'instructor' || value === 'superadmin',
                            isSuperAdmin: value === 'superadmin'
                          };
                          handlePermissionChange(user.id, permissions);
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="loadmaster">Loadmaster</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>Overview of what each role can access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Feature</th>
                    <th className="text-center p-3">Loadmaster</th>
                    <th className="text-center p-3">Instructor</th>
                    <th className="text-center p-3">Super Admin</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="p-3">Load Planning</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Training Modules</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Instructor Portal</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Review Submissions</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Create Quizzes</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Analytics Dashboard</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Admin Dashboard</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">User Management</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">License Management</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">❌</td>
                    <td className="text-center p-3">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}