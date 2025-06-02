import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Calendar, Trophy, FileText, Brain, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  squadron: string;
  license_type: string;
  last_login: string | null;
  created_at: string;
}

interface Submission {
  id: number;
  submission_date: string;
  score: number | null;
  passed: boolean;
  title: string;
  type: 'scenario' | 'quiz' | 'document';
}

export default function WorkforcePage() {
  const [selectedSquadron, setSelectedSquadron] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // Fetch squadrons
  const { data: squadrons = [] } = useQuery<string[]>({
    queryKey: ['/api/workforce/squadrons'],
    enabled: true
  });

  // Fetch users for selected squadron
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [`/api/workforce/squadron/${selectedSquadron}/users`],
    enabled: !!selectedSquadron
  });

  // Fetch user submissions when dialog is open
  const { data: userSubmissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: [`/api/workforce/user/${selectedUser?.id}/submissions`],
    enabled: !!selectedUser && showUserDialog
  });

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const closeUserDialog = () => {
    setShowUserDialog(false);
    setSelectedUser(null);
  };

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'scenario': return <Brain className="h-4 w-4" />;
      case 'quiz': return <Trophy className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSubmissionBadgeColor = (passed: boolean) => {
    return passed ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50";
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Workforce Management</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Squadron Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-sm">
            <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
              <SelectTrigger>
                <SelectValue placeholder="Select a squadron to view personnel" />
              </SelectTrigger>
              <SelectContent>
                {squadrons.map((squadron: string) => (
                  <SelectItem key={squadron} value={squadron}>
                    {squadron}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedSquadron && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedSquadron} Personnel
              {users && (
                <Badge variant="outline" className="ml-2">
                  {users.length} {users.length === 1 ? 'Member' : 'Members'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading personnel...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user: User) => (
                  <div 
                    key={user.id} 
                    className="border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.first_name || user.email.split('@')[0]
                            }
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.license_type}</Badge>
                        <Badge variant="secondary">{user.squadron}</Badge>
                      </div>
                    </div>
                    {user.last_login && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Last login: {format(new Date(user.last_login), 'PPp')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No personnel found in {selectedSquadron}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedUser && (
                selectedUser.first_name && selectedUser.last_name 
                  ? `${selectedUser.first_name} ${selectedUser.last_name}`
                  : selectedUser.first_name || selectedUser.email.split('@')[0]
              )} - Submission History
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
                <User className="h-12 w-12 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{selectedUser.email}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedUser.license_type}</Badge>
                    <Badge variant="secondary">{selectedUser.squadron}</Badge>
                  </div>
                  {selectedUser.last_login && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Last login: {format(new Date(selectedUser.last_login), 'PPp')}
                    </p>
                  )}
                </div>
              </div>

              {/* Submissions */}
              <div>
                <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Submissions (Last 5)
                </h4>
                
                {submissionsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-muted-foreground">Loading submissions...</p>
                  </div>
                ) : userSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {userSubmissions.slice(0, 5).map((submission: Submission) => (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSubmissionIcon(submission.type)}
                            <div>
                              <h5 className="font-medium">{submission.title}</h5>
                              <p className="text-sm text-muted-foreground capitalize">
                                {submission.type} • {format(new Date(submission.submission_date), 'PPp')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.score !== null && (
                              <Badge variant="outline">
                                {submission.score}%
                              </Badge>
                            )}
                            <Badge className={`${getSubmissionBadgeColor(submission.passed)}`}>
                              {submission.passed ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Passed</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No submissions found for this user</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

