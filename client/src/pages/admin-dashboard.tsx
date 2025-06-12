import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, RefreshCw, Trash2, AlertTriangle, CheckCircle, XCircle, Clock, Users, Activity } from "lucide-react";
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

export default function AdminDashboard() {
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

  // Fetch all licenses
  const { data: licenses = [], isLoading } = useQuery<License[]>({
    queryKey: ['/api/licensing/licenses'],
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // License renewal mutation
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
        title: "License renewed successfully",
        description: "The expired license has been reactivated."
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
        title: "License deleted successfully",
        description: "The license has been permanently removed."
      });
    }
  });

  // Filter licenses
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
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

  // License Action Buttons Component
  const LicenseActionButtons = ({ license }: { license: License }) => {
    const handleRenewClick = () => {
      console.log('🔄 RENEW BUTTON CLICKED:', license.email, license.isExpired);
      setRenewLicense(license);
      setShowRenewDialog(true);
    };

    return (
      <div className="flex gap-1">
        {/* Show refresh button for expired licenses */}
        {license.isExpired && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRenewClick}
            disabled={renewLicenseMutation.isPending}
            className="bg-blue-50 hover:bg-blue-100 border-blue-300"
            title="Renew expired license"
          >
            <RefreshCw className="w-3 h-3 text-blue-600" />
          </Button>
        )}
        
        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" title="Delete license">
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete License</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the license for {license.email}. This action cannot be undone.
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
    );
  };

  // Renewal Dialog Component
  const RenewLicenseDialog = () => {
    const [formData, setFormData] = useState({
      durationType: 'months',
      duration: 12
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!renewLicense) return;
      
      const now = new Date();
      let newExpiryDate = new Date(now);
      
      switch (formData.durationType) {
        case 'days':
          newExpiryDate.setDate(now.getDate() + formData.duration);
          break;
        case 'weeks':
          newExpiryDate.setDate(now.getDate() + (formData.duration * 7));
          break;
        case 'months':
          newExpiryDate.setMonth(now.getMonth() + formData.duration);
          break;
        case 'years':
          newExpiryDate.setFullYear(now.getFullYear() + formData.duration);
          break;
      }
      
      console.log('🔄 SUBMITTING RENEWAL:', {
        licenseId: renewLicense.id,
        email: renewLicense.email,
        newExpiryDate: newExpiryDate.toISOString()
      });
      
      renewLicenseMutation.mutate({
        id: renewLicense.id,
        newExpiryDate: newExpiryDate.toISOString()
      });
    };

    const previewDate = () => {
      const now = new Date();
      let newDate = new Date(now);
      switch (formData.durationType) {
        case 'days':
          newDate.setDate(now.getDate() + formData.duration);
          break;
        case 'weeks':
          newDate.setDate(now.getDate() + (formData.duration * 7));
          break;
        case 'months':
          newDate.setMonth(now.getMonth() + formData.duration);
          break;
        case 'years':
          newDate.setFullYear(now.getFullYear() + formData.duration);
          break;
      }
      return format(newDate, "MMM dd, yyyy");
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
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
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

            {renewLicense && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Current Status:</strong> Expired on {format(new Date(renewLicense.expiryDate), "MMM dd, yyyy")}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>New Expiry:</strong> {previewDate()}
                </p>
              </div>
            )}

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
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage user licenses and system access</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create License
        </Button>
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
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
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
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredLicenses}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.expiringLicenses}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* License Management */}
      <Card>
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <CardDescription>View and manage all licenses in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
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
                  <SelectItem value="all">All Licenses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* License Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading licenses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>License Key</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{license.email}</div>
                        <div className="text-sm text-gray-500">{license.username}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{license.licenseKey}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Standard</Badge>
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
                      <LicenseActionButtons license={license} />
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