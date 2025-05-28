import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Users, Clock, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Eye, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface License {
  id: number;
  email: string;
  username: string;
  licenseKey: string;
  issuedDate: string;
  expiryDate: string;
  status: 'active' | 'suspended' | 'expired';
  maxConcurrentSessions: number;
  maxDevices: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  activeSessionCount: number;
  totalSessionCount: number;
  isExpired: boolean;
  daysUntilExpiry: number;
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

export default function LicensingManagementFixed() {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch licenses
  const { data: licenses = [], isLoading: licensesLoading } = useQuery<License[]>({
    queryKey: ['/api/licensing/licenses']
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/licensing/dashboard-stats']
  });

  // Create license mutation
  const createLicenseMutation = useMutation({
    mutationFn: async (licenseData: any) => {
      console.log('Submitting license data:', licenseData);
      try {
        const response = await fetch('/api/licensing/licenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(licenseData),
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('License creation result:', result);
        return result;
      } catch (error) {
        console.error('Error creating license:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/dashboard-stats'] });
      setShowCreateDialog(false);
      toast({
        title: "License created",
        description: "The new license has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error creating license",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Suspend license mutation
  const suspendLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/licensing/licenses/${id}/suspend`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/dashboard-stats'] });
      toast({
        title: "License suspended",
        description: "The license has been suspended successfully."
      });
    }
  });

  // Reactivate license mutation
  const reactivateLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/licensing/licenses/${id}/reactivate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/dashboard-stats'] });
      toast({
        title: "License reactivated",
        description: "The license has been reactivated successfully."
      });
    }
  });

  // Delete license mutation
  const deleteLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/licensing/licenses/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/dashboard-stats'] });
      toast({
        title: "License deleted",
        description: "The license has been permanently deleted."
      });
    }
  });

  const getStatusBadge = (license: License) => {
    if (license.isExpired) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Expired</Badge>;
    }
    if (license.status === 'suspended') {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" />Suspended</Badge>;
    }
    if (license.daysUntilExpiry <= 7 && license.daysUntilExpiry > 0) {
      return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Clock className="w-3 h-3" />Expiring Soon</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Active</Badge>;
  };

  const CreateLicenseForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      username: '',
      durationType: 'days',
      duration: 30,
      maxConcurrentSessions: 1,
      maxDevices: 2,
      notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Calculate expiry date based on duration type and value
      const now = new Date();
      let expiryDate = new Date(now);
      
      if (formData.durationType === 'days') {
        expiryDate.setDate(now.getDate() + formData.duration);
      } else if (formData.durationType === 'weeks') {
        expiryDate.setDate(now.getDate() + (formData.duration * 7));
      } else if (formData.durationType === 'months') {
        expiryDate.setMonth(now.getMonth() + formData.duration);
      }
      
      // Send data to backend
      const submitData = {
        email: formData.email,
        username: formData.username,
        expiryDate: expiryDate.toISOString(),
        maxConcurrentSessions: formData.maxConcurrentSessions,
        maxDevices: formData.maxDevices,
        notes: formData.notes
      };

      createLicenseMutation.mutate(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Enter username"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="durationType">Duration Type</Label>
            <Select value={formData.durationType} onValueChange={(value) => setFormData({ ...formData, durationType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              Expires: {(() => {
                const now = new Date();
                const expiry = new Date(now);
                if (formData.durationType === 'days') {
                  expiry.setDate(now.getDate() + formData.duration);
                } else if (formData.durationType === 'weeks') {
                  expiry.setDate(now.getDate() + (formData.duration * 7));
                } else if (formData.durationType === 'months') {
                  expiry.setMonth(now.getMonth() + formData.duration);
                }
                return format(expiry, 'MMM dd, yyyy');
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sessions">Max Concurrent Sessions</Label>
            <Input
              id="sessions"
              type="number"
              min="1"
              max="10"
              value={formData.maxConcurrentSessions}
              onChange={(e) => setFormData({ ...formData, maxConcurrentSessions: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="devices">Max Devices</Label>
            <Input
              id="devices"
              type="number"
              min="1"
              max="20"
              value={formData.maxDevices}
              onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this license..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createLicenseMutation.isPending}>
            {createLicenseMutation.isPending ? "Creating..." : "Create License"}
          </Button>
        </div>
      </form>
    );
  };

  const filteredLicenses = licenses.filter(license => 
    license.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            License Management
          </h1>
          <p className="text-gray-600 mt-1">Manage user licenses and access control</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create License
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New License</DialogTitle>
              <DialogDescription>
                Generate a new license for a user with specific permissions and duration.
              </DialogDescription>
            </DialogHeader>
            <CreateLicenseForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Licenses</p>
                <p className="text-3xl font-bold">{statsLoading ? "..." : stats?.totalLicenses || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-3xl font-bold text-green-600">{statsLoading ? "..." : stats?.activeLicenses || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-3xl font-bold text-red-600">{statsLoading ? "..." : stats?.expiredLicenses || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-600">{statsLoading ? "..." : stats?.expiringLicenses || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* License List */}
      <Card>
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <CardDescription>
            View and manage all licenses in the system
          </CardDescription>
          <Input
            placeholder="Search licenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>License Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licensesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredLicenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No licenses found</TableCell>
                </TableRow>
              ) : (
                filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{license.username}</div>
                        <div className="text-sm text-gray-500">{license.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{license.licenseKey}</TableCell>
                    <TableCell>{getStatusBadge(license)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(license.expiryDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {license.daysUntilExpiry > 0 ? `${license.daysUntilExpiry} days left` : 'Expired'}
                      </div>
                    </TableCell>
                    <TableCell>{license.maxConcurrentSessions}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {license.status === 'active' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => suspendLicenseMutation.mutate(license.id)}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => reactivateLicenseMutation.mutate(license.id)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteLicenseMutation.mutate(license.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}