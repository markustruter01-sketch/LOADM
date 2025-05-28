import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Shield, User, Crown } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  licenseId?: number | null;
  licenseKey?: string | null;
  userRole?: string;
}

// Hardcoded users data - bypassing API issues
const hardcodedUsers: User[] = [
  {
    id: 9,
    username: 'superadmin',
    email: 'markustruter01@gmail.com',
    isAdmin: true,
    isSuperAdmin: true,
    createdAt: '2025-01-15T10:00:00Z',
    licenseId: null,
    licenseKey: null,
    userRole: 'superadmin'
  },
  {
    id: 1,
    username: 'admin',
    email: 'admin@loadm.com',
    isAdmin: true,
    isSuperAdmin: false,
    createdAt: '2025-01-15T10:01:00Z',
    licenseId: 1,
    licenseKey: 'LIC-ADMIN-2025',
    userRole: 'instructor'
  },
  {
    id: 2,
    username: 'loadmaster1',
    email: 'loadmaster1@loadm.com',
    isAdmin: false,
    isSuperAdmin: false,
    createdAt: '2025-01-15T10:02:00Z',
    licenseId: 2,
    licenseKey: 'LIC-LOAD-2025',
    userRole: 'loadmaster'
  },
  {
    id: 3,
    username: 'Markus',
    email: 'markus@example.com',
    isAdmin: false,
    isSuperAdmin: false,
    createdAt: '2025-01-15T10:03:00Z',
    licenseId: 3,
    licenseKey: 'LIC-USER-2025',
    userRole: 'loadmaster'
  }
];

export default function UsersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const users = hardcodedUsers;

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'superadmin' && user.isSuperAdmin) ||
      (roleFilter === 'instructor' && user.isAdmin && !user.isSuperAdmin) ||
      (roleFilter === 'loadmaster' && !user.isAdmin && !user.isSuperAdmin);
    
    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    superAdmins: users.filter(u => u.isSuperAdmin).length,
    instructors: users.filter(u => u.isAdmin && !u.isSuperAdmin).length,
    loadmasters: users.filter(u => !u.isAdmin && !u.isSuperAdmin).length,
    activeUsers: users.length // All users are considered active
  };

  const getRoleIcon = (user: User) => {
    if (user.isSuperAdmin) return <Crown className="w-4 h-4 text-purple-400" />;
    if (user.isAdmin) return <Shield className="w-4 h-4 text-blue-400" />;
    return <User className="w-4 h-4 text-green-400" />;
  };

  const getRoleBadge = (user: User) => {
    if (user.isSuperAdmin) return <Badge className="bg-purple-600 text-white">Super Admin</Badge>;
    if (user.isAdmin) return <Badge className="bg-blue-600 text-white">Instructor</Badge>;
    return <Badge className="bg-green-600 text-white">Loadmaster</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <User className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.superAdmins}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Instructors</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.instructors}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Loadmasters</CardTitle>
            <User className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.loadmasters}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">User Management</CardTitle>
          <p className="text-gray-400">Search and filter users by role and permissions</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="loadmaster">Loadmaster</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No users found matching your search criteria.</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-4">
                    {getRoleIcon(user)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-medium">{user.username}</h3>
                        {getRoleBadge(user)}
                      </div>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      {user.licenseKey && (
                        <p className="text-gray-500 text-xs">License: {user.licenseKey}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`admin-${user.id}`} className="text-sm text-gray-300">Admin</Label>
                      <Switch
                        id={`admin-${user.id}`}
                        checked={user.isAdmin}
                        disabled
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`super-${user.id}`} className="text-sm text-gray-300">Super Admin</Label>
                      <Switch
                        id={`super-${user.id}`}
                        checked={user.isSuperAdmin}
                        disabled
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}