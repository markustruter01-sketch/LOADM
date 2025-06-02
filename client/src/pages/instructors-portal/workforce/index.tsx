import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, ChevronDown, ChevronRight, Calendar, Trophy, FileText, Brain, User } from "lucide-react";
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
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

  // Fetch squadrons
  const { data: squadrons } = useQuery({
    queryKey: ['/api/workforce/squadrons'],
    enabled: true
  });

  // Fetch users for selected squadron
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: [`/api/workforce/squadron/${selectedSquadron}/users`],
    enabled: !!selectedSquadron
  });

  // Function to fetch user submissions
  const getUserSubmissions = (userId: number) => {
    return useQuery({
      queryKey: ['/api/workforce/user', userId, 'submissions'],
      enabled: expandedUsers.has(userId)
    });
  };

  const toggleUserExpansion = (userId: number) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
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
                {squadrons?.map((squadron: string) => (
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
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user: User) => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    isExpanded={expandedUsers.has(user.id)}
                    onToggle={() => toggleUserExpansion(user.id)}
                    submissions={getUserSubmissions(user.id)}
                    getSubmissionIcon={getSubmissionIcon}
                    getSubmissionBadgeColor={getSubmissionBadgeColor}
                  />
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
    </div>
  );
}

interface UserCardProps {
  user: User;
  isExpanded: boolean;
  onToggle: () => void;
  submissions: any;
  getSubmissionIcon: (type: string) => JSX.Element;
  getSubmissionBadgeColor: (passed: boolean) => string;
}

function UserCard({ user, isExpanded, onToggle, submissions, getSubmissionIcon, getSubmissionBadgeColor }: UserCardProps) {
  const { data: userSubmissions, isLoading: submissionsLoading } = submissions;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="border border-border/50 hover:border-border transition-colors">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{user.license_type}</Badge>
                {user.last_login ? (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="text-xs">{format(new Date(user.last_login), 'MMM dd, yyyy')}</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Never logged in</p>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t border-border/50 pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Submissions (Last 5)
              </h4>
              
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading submissions...</span>
                </div>
              ) : userSubmissions && userSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {userSubmissions.map((submission: Submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSubmissionIcon(submission.type)}
                        <div>
                          <p className="font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{submission.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {submission.score !== null && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge className={getSubmissionBadgeColor(submission.passed)}>
                          {submission.passed ? 'Passed' : 'Failed'}
                        </Badge>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(submission.submission_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No submissions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}