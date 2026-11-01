import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Shield, Crown, User, Briefcase, Search, Eye, EyeOff, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";

interface LicenseUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  licenseKey: string;
  licenseType: string;
  squadron: string;
  category: string;
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
  userId?: number;
  activeSessionCount?: number;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  superadmin: { label: "Super Admin", color: "bg-purple-600", icon: <Crown className="w-3.5 h-3.5" /> },
  leadership: { label: "Leadership", color: "bg-amber-600", icon: <Briefcase className="w-3.5 h-3.5" /> },
  instructor: { label: "Instructor", color: "bg-blue-600", icon: <Shield className="w-3.5 h-3.5" /> },
  loadmaster: { label: "Loadmaster", color: "bg-green-600", icon: <User className="w-3.5 h-3.5" /> },
  readonly: { label: "Read Only", color: "bg-gray-600", icon: <User className="w-3.5 h-3.5" /> },
};

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useIsolatedAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<LicenseUser | null>(null);

  const { data: licenses = [], isLoading } = useQuery<LicenseUser[]>({
    queryKey: ["/api/licensing/licenses"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, licenseType }: { id: number; licenseType: string }) => {
      return apiRequest({ url: `/api/licensing/licenses/${id}/role`, method: "PATCH", body: { licenseType } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licensing/licenses"] });
      toast({ title: "Role updated", description: "User role has been updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest({ url: `/api/licensing/licenses/${id}`, method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licensing/licenses"] });
      setUserToDelete(null);
      toast({ title: "User deleted", description: "The user and their license have been permanently removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  const handleRoleToggle = (license: LicenseUser, role: string) => {
    const newType = license.licenseType === role ? "loadmaster" : role;
    updateRoleMutation.mutate({ id: license.id, licenseType: newType });
  };

  const filteredLicenses = licenses.filter((l) => {
    const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.licenseKey?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || l.licenseType === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: licenses.length,
    superadmin: licenses.filter((l) => l.licenseType === "superadmin").length,
    leadership: licenses.filter((l) => l.licenseType === "leadership").length,
    instructor: licenses.filter((l) => l.licenseType === "instructor").length,
    loadmaster: licenses.filter((l) => l.licenseType === "loadmaster").length,
    readonly: licenses.filter((l) => l.licenseType === "readonly").length,
  };

  const getRoleBadge = (licenseType: string) => {
    const cfg = ROLE_CONFIG[licenseType] || ROLE_CONFIG.loadmaster;
    return (
      <Badge className={`${cfg.color} text-white flex items-center gap-1 text-xs`}>
        {cfg.icon}
        {cfg.label}
      </Badge>
    );
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

  return (
    <>
      <Helmet>
        <title>User Management - LOADMworkflow</title>
        <meta name="description" content="Manage all user accounts, roles, and access levels" />
      </Helmet>

      <div className="min-h-screen bg-gray-900">
        {/* Page header */}
        <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/superadmin-dashboard")}
                className="text-slate-300 hover:text-white hover:bg-slate-800 mr-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Super Admin
              </Button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">User Management</h1>
                <p className="text-slate-400 text-xs">Manage roles, access levels, and user accounts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6 space-y-5 mb-16">
          {/* Stats row */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Super Admin", value: stats.superadmin, color: "text-purple-400" },
              { label: "Leadership", value: stats.leadership, color: "text-amber-400" },
              { label: "Instructor", value: stats.instructor, color: "text-blue-400" },
              { label: "Loadmaster", value: stats.loadmaster, color: "text-green-400" },
              { label: "Read Only", value: stats.readonly, color: "text-gray-400" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search + filter */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email or license key..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-44 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="loadmaster">Loadmaster</SelectItem>
                    <SelectItem value="readonly">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-slate-400">Loading users...</div>
              ) : filteredLicenses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No users found matching your criteria.</div>
              ) : (
                <div className="space-y-2">
                  {filteredLicenses.map((license) => (
                    <div
                      key={license.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-lg border border-slate-700 bg-slate-700/40 hover:bg-slate-700/70 transition-colors"
                    >
                      {/* Left: identity */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                          {ROLE_CONFIG[license.licenseType]?.icon || <User className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-white">
                              {license.firstName} {license.lastName}
                            </span>
                            {getRoleBadge(license.licenseType)}
                            {isExpired(license.expiryDate) && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{license.email}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{license.squadron || "—"}</span>
                            <span>·</span>
                            <span>Cat {license.category || "—"}</span>
                            <span>·</span>
                            <span className="font-mono">{license.licenseKey}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              Password:
                              <span className="font-mono text-slate-300">
                                {showPasswords[license.id] ? "Password1!" : "••••••••"}
                              </span>
                              <button
                                onClick={() => setShowPasswords((p) => ({ ...p, [license.id]: !p[license.id] }))}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                {showPasswords[license.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: role toggles + delete */}
                      {isSuperAdmin && (
                        <div className="flex items-center gap-3 flex-wrap shrink-0">
                          {(["loadmaster", "instructor", "leadership"] as const).map((role) => (
                            <div key={role} className="flex items-center gap-1.5">
                              <Label htmlFor={`${role}-${license.id}`} className="text-xs text-slate-400 capitalize">
                                {role}
                              </Label>
                              <Switch
                                id={`${role}-${license.id}`}
                                checked={license.licenseType === role}
                                disabled={
                                  updateRoleMutation.isPending ||
                                  license.licenseType === "superadmin"
                                }
                                onCheckedChange={() => handleRoleToggle(license, role)}
                                className={
                                  role === "instructor"
                                    ? "data-[state=checked]:bg-blue-600"
                                    : role === "leadership"
                                    ? "data-[state=checked]:bg-amber-600"
                                    : "data-[state=checked]:bg-green-600"
                                }
                              />
                            </div>
                          ))}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2"
                            disabled={license.licenseType === "superadmin" || license.id === (currentUser as any)?.licenseId}
                            onClick={() => setUserToDelete(license)}
                            title={license.licenseType === "superadmin" ? "Cannot delete super admin accounts" : "Delete user"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-3">
                Showing {filteredLicenses.length} of {licenses.length} users
              </p>
            </CardContent>
          </Card>

          {!isSuperAdmin && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              Role editing and user deletion require Super Admin access.
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Confirm User Deletion</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">{userToDelete?.firstName} {userToDelete?.lastName}</strong> ({userToDelete?.email})?
              This removes their license and account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
