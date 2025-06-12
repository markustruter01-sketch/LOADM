import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Users, Clock, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Eye, RotateCcw } from "lucide-react";
import { format } from "date-fns";

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

export default function LicensingManagement() {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewLicense, setRenewLicense] = useState<License | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/licensing/dashboard-stats']
  });

  // Fetch all licenses with fresh data
  const { data: licenses = [], isLoading } = useQuery<License[]>({
    queryKey: ['/api/licensing/licenses'],
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  // Create license mutation
  const createLicenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/licensing/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create license');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/dashboard-stats'] });
      setShowCreateDialog(false);
      toast({
        title: "License created successfully",
        description: "The new license has been generated and is ready for use."
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
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await fetch(`/api/licensing/licenses/${id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to suspend license');
      return response.json();
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
      const response = await fetch(`/api/licensing/licenses/${id}/reactivate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reactivate license');
      return response.json();
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

  // Renew expired license mutation
  const renewLicenseMutation = useMutation({
    mutationFn: async ({ id, newExpiryDate }: { id: number; newExpiryDate: string }) => {
      const response = await fetch(`/api/licensing/licenses/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryDate: newExpiryDate })
      });
      if (!response.ok) throw new Error('Failed to renew license');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/licensing/dashboard-stats'] });
      setShowRenewDialog(false);
      setRenewLicense(null);
      toast({
        title: "License renewed",
        description: "The expired license has been successfully renewed and reactivated."
      });
    },
    onError: () => {
      toast({
        title: "Error renewing license",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Delete license mutation
  const deleteLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/licensing/licenses/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete license');
      return response.json();
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

  // Filter licenses based on search and status
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "expiring") return matchesSearch && license.daysUntilExpiry <= 7 && license.daysUntilExpiry > 0;
    if (statusFilter === "expired") return matchesSearch && license.isExpired;
    return matchesSearch && license.status === statusFilter;
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <Label htmlFor="durationType">Duration Type</Label>
            <Select
              value={formData.durationType}
              onValueChange={(value) => setFormData({ ...formData, durationType: value })}
            >
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

  const RenewLicenseDialog = () => {
    const [formData, setFormData] = useState({
      durationType: 'months',
      duration: 12
    });

    console.log('🔄 RENEW DIALOG RENDER:', { showRenewDialog, renewLicense });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!renewLicense) return;
      
      // Calculate new expiry date based on current date
      const now = new Date();
      let newExpiryDate = new Date(now);
      
      if (formData.durationType === 'days') {
        newExpiryDate.setDate(now.getDate() + formData.duration);
      } else if (formData.durationType === 'weeks') {
        newExpiryDate.setDate(now.getDate() + (formData.duration * 7));
      } else if (formData.durationType === 'months') {
        newExpiryDate.setMonth(now.getMonth() + formData.duration);
      } else if (formData.durationType === 'years') {
        newExpiryDate.setFullYear(now.getFullYear() + formData.duration);
      }
      
      renewLicenseMutation.mutate({
        id: renewLicense.id,
        newExpiryDate: newExpiryDate.toISOString()
      });
    };

    return (
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Expired License</DialogTitle>
            <DialogDescription>
              Extend the expiry date for {renewLicense?.email} to reactivate their access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renewDuration">Duration</Label>
                <Input
                  id="renewDuration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="renewDurationType">Type</Label>
                <Select value={formData.durationType} onValueChange={(value) => setFormData({ ...formData, durationType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Current Status:</strong> Expired on {renewLicense && format(new Date(renewLicense.expiryDate), "MMM dd, yyyy")}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <strong>New Expiry:</strong> {(() => {
                  const now = new Date();
                  let newDate = new Date(now);
                  if (formData.durationType === 'days') {
                    newDate.setDate(now.getDate() + formData.duration);
                  } else if (formData.durationType === 'weeks') {
                    newDate.setDate(now.getDate() + (formData.duration * 7));
                  } else if (formData.durationType === 'months') {
                    newDate.setMonth(now.getMonth() + formData.duration);
                  } else if (formData.durationType === 'years') {
                    newDate.setFullYear(now.getFullYear() + formData.duration);
                  }
                  return format(newDate, "MMM dd, yyyy");
                })()}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowRenewDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renewLicenseMutation.isPending}>
                {renewLicenseMutation.isPending ? "Renewing..." : "Renew License"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

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

      {/* License Renewal Dialog */}
      <RenewLicenseDialog />

      {/* Dashboard Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Licenses</p>
                  <p className="text-2xl font-bold">{stats.totalLicenses}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Licenses</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeLicenses}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeSessions}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringLicenses}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="search">Search Licenses</Label>
              <Input
                id="search"
                placeholder="Search by email, username, or license key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Licenses ({filteredLicenses.length})</CardTitle>
          <CardDescription>
            Manage and monitor all user licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading licenses...</div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No licenses found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>License Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{license.username}</div>
                        <div className="text-sm text-gray-500">{license.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {license.licenseKey.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(license)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(license.expiryDate), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {license.daysUntilExpiry > 0 
                            ? `${license.daysUntilExpiry} days left`
                            : `Expired ${Math.abs(license.daysUntilExpiry)} days ago`
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{license.activeSessionCount}/{license.maxConcurrentSessions} active</div>
                        <div className="text-gray-500">{license.totalSessionCount} total</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {license.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reactivateLicenseMutation.mutate(license.id)}
                            disabled={reactivateLicenseMutation.isPending}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        ) : license.isExpired ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              console.log('🔄 RENEW BUTTON CLICKED:', license);
                              setRenewLicense(license);
                              setShowRenewDialog(true);
                              console.log('🔄 DIALOG STATE SET:', { renewLicense: license, showRenewDialog: true });
                            }}
                            disabled={renewLicenseMutation.isPending}
                            title="Renew expired license"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        ) : license.status === 'active' && !license.isExpired && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <AlertTriangle className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspend License</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately suspend the license and end all active sessions. 
                                  Are you sure you want to continue?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => suspendLicenseMutation.mutate({ 
                                    id: license.id, 
                                    reason: 'Manually suspended by admin' 
                                  })}
                                >
                                  Suspend
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete License</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the license and associated user account. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLicenseMutation.mutate(license.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}