import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShieldCheck, ShieldAlert, ShieldX, Activity, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LocalLicense {
  email: string;
  username: string;
  licenseKey: string;
  licenseType: 'loadmaster' | 'instructor' | 'superadmin';
  expiresAt: string;
  maxDevices: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  expiringLicenses: number;
  utilizationRate: number;
}

export default function LicensingManagementClean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch licenses from localStorage
  const { data: licenses = [], isLoading: licensesLoading } = useQuery<LocalLicense[]>({
    queryKey: ['local-licenses'],
    queryFn: () => {
      const stored = localStorage.getItem('licenses');
      return stored ? JSON.parse(stored) : [];
    }
  });

  // Calculate dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['license-stats', licenses],
    queryFn: () => {
      const now = new Date();
      
      const activeLicenses = licenses.filter(license => 
        license.isActive && new Date(license.expiresAt) > now
      ).length;
      
      const expiredLicenses = licenses.filter(license => 
        new Date(license.expiresAt) <= now
      ).length;
      
      const expiringLicenses = licenses.filter(license => {
        const expiryDate = new Date(license.expiresAt);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length;
      
      return {
        totalLicenses: licenses.length,
        activeLicenses,
        expiredLicenses,
        expiringLicenses,
        utilizationRate: licenses.length > 0 ? (activeLicenses / licenses.length) * 100 : 0
      };
    }
  });

  const getStatusBadge = (license: LocalLicense) => {
    const now = new Date();
    const expiryDate = new Date(license.expiresAt);
    const isExpired = expiryDate <= now;
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (!license.isActive) {
      return <Badge variant="secondary">Suspended</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'superadmin': return 'text-red-600 bg-red-50';
      case 'instructor': return 'text-blue-600 bg-blue-50';
      case 'loadmaster': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const deleteLicense = (licenseKey: string) => {
    const updatedLicenses = licenses.filter(license => license.licenseKey !== licenseKey);
    localStorage.setItem('licenses', JSON.stringify(updatedLicenses));
    queryClient.invalidateQueries({ queryKey: ['local-licenses'] });
    toast({
      title: "License deleted",
      description: "License has been successfully removed.",
    });
  };

  const toggleLicenseStatus = (licenseKey: string) => {
    const updatedLicenses = licenses.map(license => 
      license.licenseKey === licenseKey 
        ? { ...license, isActive: !license.isActive }
        : license
    );
    localStorage.setItem('licenses', JSON.stringify(updatedLicenses));
    queryClient.invalidateQueries({ queryKey: ['local-licenses'] });
    toast({
      title: "License updated",
      description: "License status has been changed.",
    });
  };

  if (licensesLoading) {
    return <div className="p-6">Loading licenses...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">License Management</h1>
          <p className="text-gray-600">Manage user licenses and monitor system usage</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLicenses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeLicenses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <ShieldAlert className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.expiringLicenses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.utilizationRate || 0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* License Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Licenses</CardTitle>
          <CardDescription>
            View and manage all system licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>License Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Max Devices</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No licenses found. Create your first license to get started.
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => {
                  const expiryDate = new Date(license.expiresAt);
                  const now = new Date();
                  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <TableRow key={license.licenseKey}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.username}</div>
                          <div className="text-sm text-gray-500">{license.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {license.licenseKey}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLicenseTypeColor(license.licenseType)}>
                          {license.licenseType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(license)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(expiryDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                        </div>
                      </TableCell>
                      <TableCell>{license.maxDevices}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleLicenseStatus(license.licenseKey)}
                          >
                            {license.isActive ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteLicense(license.licenseKey)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}