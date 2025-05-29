import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Shield, Mail, Key, Settings } from "lucide-react";
import { useIsolatedAuth } from "../auth-isolated/auth-context";

export default function UserProfile() {
  const { user, logout } = useIsolatedAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-600 text-white';
      case 'instructor':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrator';
      case 'instructor':
        return 'Instructor';
      case 'loadmaster':
        return 'Loadmaster';
      default:
        return 'User';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information and settings</p>
        </div>
      </div>

      <Separator />

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Account Information</span>
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
              </div>
              <span className="text-sm">{user.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Role:</span>
              </div>
              <Badge className={getRoleBadgeColor(user.role)}>
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">User ID:</span>
              </div>
              <span className="text-sm font-mono">{user.id}</span>
            </div>

            {user.createdAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Member Since:</span>
                </div>
                <span className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Account Actions</span>
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                // Future: Add change password functionality
                alert('Password change functionality coming soon!');
              }}
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (confirm('Are you sure you want to log out?')) {
                  logout();
                }
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      {user.role === 'superadmin' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">Super Administrator Access</CardTitle>
            <CardDescription>You have full administrative privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                As a Super Administrator, you have access to all system features including:
              </p>
              <ul className="list-disc list-inside text-sm text-purple-700 mt-2 space-y-1">
                <li>License Management</li>
                <li>User Permission Management</li>
                <li>System Administration</li>
                <li>Full Application Access</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === 'instructor' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Instructor Access</CardTitle>
            <CardDescription>You have instructor-level privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                As an Instructor, you have access to:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>Student Progress Monitoring</li>
                <li>Scenario Management</li>
                <li>Quiz Creation and Management</li>
                <li>Teaching Resources</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}