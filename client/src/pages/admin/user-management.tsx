import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { ArrowLeft, Trash2, UserCircle, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch all users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user account has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const isSuperAdmin = currentUser?.isSuperAdmin;

  return (
    <>
      <Helmet>
        <title>User Management - LOADMworkflow</title>
        <meta name="description" content="Manage registered users in the LOADMworkflow application" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center mb-8">
          <Link href="/admin/admin-dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h2 className="text-3xl font-bold">User Management</h2>
        </div>

        <div className="bg-card rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <UserCircle className="mr-2 h-5 w-5" />
            Registered Users
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error loading users. Please try again.
            </div>
          ) : (
            <Table>
              <TableCaption>List of all registered users in the system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        {user.isSuperAdmin && (
                          <Badge variant="destructive" className="mr-2">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                        {user.isAdmin && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        {!user.isAdmin && !user.isSuperAdmin && (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={!isSuperAdmin || user.id === currentUser?.id}
                          title={!isSuperAdmin ? "Only Super Admin can delete users" : (user.id === currentUser?.id ? "Cannot delete your own account" : "Delete user")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          
          {!isSuperAdmin && (
            <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-200">
              <p className="flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                <strong>Note:</strong> Only Super Admins can delete user accounts.
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Confirm User Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the account for user <strong>{userToDelete?.username}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}