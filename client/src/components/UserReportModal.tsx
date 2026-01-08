import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, AlertTriangle, CheckCircle2, XCircle, Clock, Plane, 
  Award, BookOpen, FileText, Shield, TrendingUp, TrendingDown, 
  Minus, Printer, User, Calendar, Mail, ChevronRight, Loader2,
  AlertCircle, ClipboardList, Info, HelpCircle
} from "lucide-react";

interface UserListItem {
  userId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  squadron: string | null;
  category: string | null;
  licenseType: string | null;
  isFlightReady: boolean | null;
  profilePhotoUrl: string | null;
}

interface UserReport {
  profile: {
    userId: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    squadron: string | null;
    category: string | null;
    licenseType: string | null;
    isFlightReady: boolean | null;
    notReadyReason: string | null;
    profilePhotoUrl: string | null;
    lastLogin: string | null;
    tenureMonths: number;
    tenureYears: number;
  };
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    trend: 'improving' | 'declining' | 'stable';
  };
  qualifications: {
    stats: {
      total: number;
      current: number;
      expiringSoon: number;
      expired: number;
      noExpiry: number;
    };
    expiringQuals: Array<{ name: string; expiryDate: string | null; daysRemaining: number }>;
    expiredQuals: Array<{ name: string; expiryDate: string | null; daysOverdue: number }>;
    all: Array<{ id: number; name: string; startDate: string; expiryDate: string | null }>;
  };
  flightRecords: {
    stats: {
      totalFlights: number;
      totalDayHours: number;
      totalNightHours: number;
      totalHours: number;
      totalCargoWeight: number;
      totalPassengers: number;
      aircraftTypes: string[];
      last30Days: { flights: number; hours: number };
    };
    recent: Array<{ id: number; date: string; callsign: string | null; aircraftType: string | null; dayHours: number; nightHours: number }>;
  };
  scenarios: {
    stats: {
      total: number;
      passed: number;
      failed: number;
      pending: number;
      averageScore: number;
      passRate: number;
    };
    recent: Array<{ id: number; scenarioTitle: string | null; score: number | null; passed: boolean | null; submissionDate: string }>;
  };
  quizzes: {
    stats: {
      total: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
    };
    recent: Array<{ id: number; quizTitle: string | null; score: number; submissionDate: string }>;
  };
  checklists: {
    completed: number;
    inProgress: number;
    recent: Array<{ id: number; checklistTitle: string | null; completionStatus: string; completedCount: number; totalItems: number }>;
  };
  safety: {
    incidents: number;
    observations: number;
    commendations: number;
    recent: Array<{ id: number; recordType: string; description: string; date: string; severity: string | null }>;
  };
  generatedAt: string;
}

interface UserReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserReportModal({ open, onOpenChange }: UserReportModalProps) {
  const [step, setStep] = useState<'select' | 'report'>('select');
  const [selectedSquadron, setSelectedSquadron] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedSquadron('all');
      setSearchQuery('');
      setSelectedUserId(null);
    }
  }, [open]);

  const { data: users, isLoading: usersLoading } = useQuery<UserListItem[]>({
    queryKey: ['/api/instructor/users', selectedSquadron],
    queryFn: async () => {
      const res = await fetch(`/api/instructor/users?squadron=${selectedSquadron}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: open && step === 'select',
  });

  const { data: report, isLoading: reportLoading, error: reportError } = useQuery<UserReport>({
    queryKey: ['/api/instructor/user-report', selectedUserId],
    queryFn: async () => {
      const res = await fetch(`/api/instructor/user-report/${selectedUserId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
    enabled: !!selectedUserId && step === 'report',
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!debouncedSearch) return users;
    const query = debouncedSearch.toLowerCase();
    return users.filter(u => 
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.squadron?.toLowerCase().includes(query))
    );
  }, [users, debouncedSearch]);

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setStep('report');
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>User Report - ${report?.profile.fullName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                .header { border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .stat-item { background: #f5f5f5; padding: 10px; border-radius: 4px; }
                .stat-value { font-size: 20px; font-weight: bold; }
                .stat-label { font-size: 12px; color: #666; }
                .alert-box { background: #fef2f2; border: 1px solid #fca5a5; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
                .badge-red { background: #fee2e2; color: #b91c1c; }
                .badge-yellow { background: #fef3c7; color: #92400e; }
                .badge-green { background: #dcfce7; color: #166534; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
                th { background: #f5f5f5; }
              </style>
            </head>
            <body>
              ${reportRef.current.innerHTML}
              <div style="margin-top: 30px; font-size: 11px; color: #666; text-align: center;">
                Generated: ${new Date().toLocaleString()} | LOADMworkflow Instructor Portal
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-background border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {step === 'select' ? 'Generate User Report' : `User Report: ${report?.profile.fullName || 'Loading...'}`}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Squadron</label>
                <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
                  <SelectTrigger data-testid="select-squadron">
                    <SelectValue placeholder="Select Squadron" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Squadrons</SelectItem>
                    <SelectItem value="33">33 Squadron</SelectItem>
                    <SelectItem value="35">35 Squadron</SelectItem>
                    <SelectItem value="36">36 Squadron</SelectItem>
                    <SelectItem value="37">37 Squadron</SelectItem>
                    <SelectItem value="AMG">AMG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-[2]">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Search User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or PMKeys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-user"
                  />
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              {usersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <User className="h-8 w-8 mb-2" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user.userId)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors text-left"
                      data-testid={`user-row-${user.userId}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePhotoUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{user.squadron || 'N/A'}</Badge>
                      {user.isFlightReady ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {step === 'report' && (
          <div className="flex flex-col h-[calc(90vh-80px)]">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('select')}
                data-testid="button-back-to-select"
              >
                ← Back to User Selection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!report}
                data-testid="button-print-report"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {reportLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reportError ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-400">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>Failed to load report</p>
                </div>
              ) : report ? (
                <div ref={reportRef} className="p-6 pb-8 space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start gap-6">
                    <Avatar className="h-20 w-20 shrink-0">
                      <AvatarImage src={report.profile.profilePhotoUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {report.profile.firstName?.[0]}{report.profile.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-2xl font-bold">{report.profile.fullName}</h2>
                        {report.profile.category && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {report.profile.category} Category
                          </Badge>
                        )}
                        <Badge className={getRiskBadgeColor(report.riskAssessment.level)}>
                          Risk: {report.riskAssessment.level.toUpperCase()}
                        </Badge>
                        {report.profile.isFlightReady ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Flight Ready</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Not Ready</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{report.profile.email}</span>
                        <span className="flex items-center gap-1"><Award className="h-4 w-4" />{report.profile.squadron || 'N/A'} SQN</span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{report.profile.tenureYears}y {report.profile.tenureMonths % 12}m tenure</span>
                      </div>
                      {!report.profile.isFlightReady && report.profile.notReadyReason && (
                        <p className="text-sm text-red-400 mt-1">Not ready: {report.profile.notReadyReason}</p>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="text-right p-3 -m-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                          data-testid="button-risk-score"
                        >
                          <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                            Risk Score
                            <HelpCircle className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-3xl font-bold">{report.riskAssessment.score}</span>
                            {getTrendIcon(report.riskAssessment.trend)}
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b border-border">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            Risk Score Breakdown
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Score: <span className="font-bold text-foreground">{report.riskAssessment.score}</span> / 100 
                            ({report.riskAssessment.level.toUpperCase()})
                          </p>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="text-sm font-medium mb-2">Score Factors for {report.profile.firstName || 'this user'}:</div>
                          <div className="space-y-2 text-sm">
                            {report.qualifications.stats.expired > 0 && (
                              <div className="flex items-center justify-between text-red-400">
                                <span>Expired qualifications ({report.qualifications.stats.expired})</span>
                                <span className="font-medium">+{Math.min(report.qualifications.stats.expired * 30, 40)} pts</span>
                              </div>
                            )}
                            {report.qualifications.stats.expiringSoon > 0 && (
                              <div className="flex items-center justify-between text-yellow-400">
                                <span>Expiring soon ({report.qualifications.stats.expiringSoon})</span>
                                <span className="font-medium">+{Math.min(report.qualifications.stats.expiringSoon * 15, 30)} pts</span>
                              </div>
                            )}
                            {!report.profile.isFlightReady && (
                              <div className="flex items-center justify-between text-orange-400">
                                <span>Not flight ready</span>
                                <span className="font-medium">+20 pts</span>
                              </div>
                            )}
                            {report.scenarios.stats.passRate < 70 && report.scenarios.stats.total > 0 && (
                              <div className="flex items-center justify-between text-yellow-400">
                                <span>Low assessment pass rate ({report.scenarios.stats.passRate}%)</span>
                                <span className="font-medium">+10 pts</span>
                              </div>
                            )}
                            {report.flightRecords.stats.last30Days.flights === 0 && (
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>No recent flight activity</span>
                                <span className="font-medium">+10 pts</span>
                              </div>
                            )}
                            {report.riskAssessment.score === 0 && (
                              <div className="flex items-center justify-between text-green-400">
                                <span>No risk factors identified</span>
                                <span className="font-medium">0 pts</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 border-t border-border">
                          <div className="text-xs font-medium mb-2 text-muted-foreground">How Risk Scores Work:</div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Expired quals: +30 pts each (max 40)</li>
                            <li>• Expiring quals (&lt;90 days): +15 pts each (max 30)</li>
                            <li>• Not flight ready: +20 pts</li>
                            <li>• Pass rate &lt;70%: +10 pts</li>
                            <li>• No recent activity: +10 pts</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-border/50 text-xs">
                            <span className="text-green-400">0-25: Low</span> • 
                            <span className="text-yellow-400 ml-1">26-50: Medium</span> • 
                            <span className="text-orange-400 ml-1">51-75: High</span> • 
                            <span className="text-red-400 ml-1">76+: Critical</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Critical Alerts */}
                  {(report.qualifications.expiredQuals.length > 0 || report.qualifications.expiringQuals.length > 0) && (
                    <Card className="border-red-500/30 bg-red-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-red-400">
                          <AlertTriangle className="h-5 w-5" />
                          Critical Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {report.qualifications.expiredQuals.map((q, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-red-500/10 p-2 rounded">
                            <span className="text-red-400 font-medium">{q.name}</span>
                            <Badge variant="destructive">Expired {q.daysOverdue} days ago</Badge>
                          </div>
                        ))}
                        {report.qualifications.expiringQuals.map((q, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-yellow-500/10 p-2 rounded">
                            <span className="text-yellow-400 font-medium">{q.name}</span>
                            <Badge className="bg-yellow-500/20 text-yellow-400">Expires in {q.daysRemaining} days</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Qualifications</span>
                        </div>
                        <div className="text-2xl font-bold">{report.qualifications.stats.current}</div>
                        <div className="text-xs text-muted-foreground">
                          {report.qualifications.stats.expiringSoon > 0 && (
                            <span className="text-yellow-400">{report.qualifications.stats.expiringSoon} expiring</span>
                          )}
                          {report.qualifications.stats.expired > 0 && (
                            <span className="text-red-400 ml-2">{report.qualifications.stats.expired} expired</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Plane className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Flight Hours</span>
                        </div>
                        <div className="text-2xl font-bold">{report.flightRecords.stats.totalHours.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">
                          {report.flightRecords.stats.last30Days.hours.toFixed(1)} hrs last 30d
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Scenario Score</span>
                        </div>
                        <div className="text-2xl font-bold">{report.scenarios.stats.averageScore}%</div>
                        <div className="text-xs text-muted-foreground">
                          {report.scenarios.stats.passRate}% pass rate ({report.scenarios.stats.total} attempts)
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Quiz Score</span>
                        </div>
                        <div className="text-2xl font-bold">{report.quizzes.stats.averageScore}%</div>
                        <div className="text-xs text-muted-foreground">
                          {report.quizzes.stats.total} quizzes completed
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Detailed Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Qualifications */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Qualifications ({report.qualifications.stats.total})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-3">
                          <Badge className="bg-green-500/20 text-green-400">{report.qualifications.stats.current} Current</Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-400">{report.qualifications.stats.expiringSoon} Expiring</Badge>
                          <Badge className="bg-red-500/20 text-red-400">{report.qualifications.stats.expired} Expired</Badge>
                        </div>
                        {report.qualifications.all.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No qualifications recorded</p>
                        ) : (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {report.qualifications.all.slice(0, 5).map((q) => (
                              <div key={q.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{q.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : 'No Expiry'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Flight Records */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Plane className="h-5 w-5 text-primary" />
                          Flight Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Flights:</span>
                            <span className="ml-2 font-medium">{report.flightRecords.stats.totalFlights}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Day Hours:</span>
                            <span className="ml-2 font-medium">{report.flightRecords.stats.totalDayHours.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Night Hours:</span>
                            <span className="ml-2 font-medium">{report.flightRecords.stats.totalNightHours.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cargo (kg):</span>
                            <span className="ml-2 font-medium">{report.flightRecords.stats.totalCargoWeight.toLocaleString()}</span>
                          </div>
                        </div>
                        {report.flightRecords.stats.aircraftTypes.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-muted-foreground">Aircraft: </span>
                            {report.flightRecords.stats.aircraftTypes.map((a, i) => (
                              <Badge key={i} variant="outline" className="mr-1 text-xs">{a}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Scenarios */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Scenario Assessments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Pass Rate</span>
                            <span>{report.scenarios.stats.passRate}%</span>
                          </div>
                          <Progress value={report.scenarios.stats.passRate} className="h-2" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="bg-green-500/10 rounded p-2">
                            <div className="font-bold text-green-400">{report.scenarios.stats.passed}</div>
                            <div className="text-xs text-muted-foreground">Passed</div>
                          </div>
                          <div className="bg-red-500/10 rounded p-2">
                            <div className="font-bold text-red-400">{report.scenarios.stats.failed}</div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                          </div>
                          <div className="bg-yellow-500/10 rounded p-2">
                            <div className="font-bold text-yellow-400">{report.scenarios.stats.pending}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Safety */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Safety Record
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="bg-red-500/10 rounded p-2">
                            <div className="font-bold text-red-400">{report.safety.incidents}</div>
                            <div className="text-xs text-muted-foreground">Incidents</div>
                          </div>
                          <div className="bg-yellow-500/10 rounded p-2">
                            <div className="font-bold text-yellow-400">{report.safety.observations}</div>
                            <div className="text-xs text-muted-foreground">Observations</div>
                          </div>
                          <div className="bg-green-500/10 rounded p-2">
                            <div className="font-bold text-green-400">{report.safety.commendations}</div>
                            <div className="text-xs text-muted-foreground">Commendations</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {[
                          ...report.scenarios.recent.map(s => ({
                            type: 'scenario',
                            title: s.scenarioTitle || 'Scenario',
                            date: s.submissionDate,
                            detail: `Score: ${s.score}% - ${s.passed ? 'Passed' : 'Failed'}`,
                            icon: BookOpen,
                          })),
                          ...report.quizzes.recent.map(q => ({
                            type: 'quiz',
                            title: q.quizTitle || 'Quiz',
                            date: q.submissionDate,
                            detail: `Score: ${q.score}%`,
                            icon: ClipboardList,
                          })),
                          ...report.flightRecords.recent.slice(0, 5).map(f => ({
                            type: 'flight',
                            title: f.callsign || 'Flight',
                            date: f.date,
                            detail: `${f.aircraftType || 'Unknown'} - ${((f.dayHours || 0) + (f.nightHours || 0)).toFixed(1)} hrs`,
                            icon: Plane,
                          })),
                        ]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 10)
                          .map((activity, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded">
                              <activity.icon className="h-4 w-4 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate">{activity.title}</span>
                                <span className="text-muted-foreground ml-2">{activity.detail}</span>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(activity.date).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        {report.scenarios.recent.length === 0 && 
                         report.quizzes.recent.length === 0 && 
                         report.flightRecords.recent.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}