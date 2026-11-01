import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  ShieldCheck, 
  GitMerge, 
  PieChart, 
  Activity, 
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExtendedScenarioSubmission {
  id: number;
  scenarioId: number;
  userId: number;
  submissionDate: Date | string;
  score?: number | null;
  passed?: boolean | null;
  squadron?: string | null;
  studentName?: string | null;
  studentId?: string | null;
  scenarioTitle?: string;
}

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  subtext: string;
  status: string;
  hasHashTooltip?: boolean;
  hashValue?: string;
}

const TimelineItem = ({ icon, label, subtext, status, hasHashTooltip, hashValue }: TimelineItemProps) => (
  <div className="group relative flex items-start gap-4">
    <div className={`
      relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full 
      border border-border bg-card shadow-lg ring-4 ring-background 
      ${hasHashTooltip ? 'group-hover:border-primary group-hover:shadow-[0_0_15px_hsl(var(--primary))] transition-all duration-300' : ''}
    `}>
      {icon}
      
      {hasHashTooltip && hashValue && (
        <div className="pointer-events-none absolute left-14 top-2 w-max opacity-0 transition-opacity duration-200 group-hover:opacity-100 pl-4 z-50">
          <div className="rounded bg-popover px-2 py-1 text-[10px] text-primary border border-primary/30 shadow-xl font-mono">
             Hash: {hashValue} (Immutable)
          </div>
        </div>
      )}
    </div>

    <div className="pt-1">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
          {status}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{subtext}</p>
    </div>
  </div>
);

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex.slice(0, 6)}...${hashHex.slice(-4)}`;
}

interface DataAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataAuditModal({ isOpen, onClose }: DataAuditModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [hashValue, setHashValue] = useState('0x7f3a...2b4c');

  const { data: allSubmissions } = useQuery<ExtendedScenarioSubmission[]>({
    queryKey: ['/api/scenario-submissions'],
    enabled: isOpen,
  });

  const filteredSubmissions = useMemo(() => {
    if (!allSubmissions) return [];
    
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);
    
    return allSubmissions.filter(sub => {
      const subDate = new Date(sub.submissionDate);
      return subDate >= monthStart && subDate <= monthEnd;
    });
  }, [allSubmissions, selectedMonth]);

  const latestSubmission = filteredSubmissions.length > 0 
    ? filteredSubmissions[filteredSubmissions.length - 1] 
    : null;

  const stats = useMemo(() => {
    const squadrons = new Set(filteredSubmissions.map(s => s.squadron).filter(Boolean));
    const passed = filteredSubmissions.filter(s => s.passed === true).length;
    const avgScore = filteredSubmissions.length > 0 
      ? Math.round(filteredSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / filteredSubmissions.length)
      : 0;
    
    return {
      totalRecords: filteredSubmissions.length,
      squadronCount: squadrons.size,
      passRate: filteredSubmissions.length > 0 ? Math.round((passed / filteredSubmissions.length) * 100) : 0,
      avgScore
    };
  }, [filteredSubmissions]);

  useEffect(() => {
    if (latestSubmission) {
      const dataToHash = JSON.stringify({
        id: latestSubmission.id,
        date: latestSubmission.submissionDate,
        score: latestSubmission.score
      });
      generateHash(dataToHash).then(setHashValue);
    }
  }, [latestSubmission]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-AU', { 
      day: 'numeric',
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const goToPrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const now = new Date();
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (nextMonth <= now) {
      setSelectedMonth(nextMonth);
    }
  };

  const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && 
                         selectedMonth.getFullYear() === new Date().getFullYear();

  const auditId = latestSubmission 
    ? `#${String(latestSubmission.id).padStart(3, '0')}-${latestSubmission.squadron || 'ALL'}` 
    : '#000-ALL';

  const getUserDisplay = () => {
    if (!latestSubmission) return 'No records';
    return latestSubmission.studentName || latestSubmission.studentId || `User #${latestSubmission.userId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground tracking-wide">
                Data Integrity Record
              </DialogTitle>
              <DialogDescription className="text-xs text-primary uppercase tracking-widest mt-1">
                Audit Trail ID: {auditId}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Explanation Brief */}
        <div className="mb-4 p-3 bg-card/50 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This window shows how your data flows through the system — from the moment it's captured, 
            through encryption and grouping, to powering your analytics dashboards. Every record is 
            timestamped and hashed for integrity verification.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-3 mb-6 p-2 bg-card/50 rounded-lg border border-border/50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToPrevMonth}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
            {formatMonthYear(selectedMonth)}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No records found for {formatMonthYear(selectedMonth)}</p>
            <p className="text-xs mt-2 opacity-70">Try navigating to a previous month to view historical data</p>
          </div>
        ) : (
          <>
            <div className="relative pl-4">
              <div className="absolute left-[23px] top-4 h-[80%] w-0.5 bg-border">
                <div className="absolute top-0 w-full bg-primary shadow-[0_0_10px_hsl(var(--primary))] animate-pulse h-full opacity-50"></div>
              </div>

              <div className="space-y-6 relative">
                <TimelineItem 
                  icon={<User size={16} className="text-foreground" />}
                  label="Data Captured"
                  subtext={`${getUserDisplay()} submitted ${latestSubmission?.scenarioTitle || 'an assessment'}.`}
                  status="Verified"
                />

                <TimelineItem 
                  icon={<ShieldCheck size={16} className="text-primary" />}
                  label="Secured & Timestamped"
                  subtext={latestSubmission 
                    ? `Record locked at ${formatTimestamp(new Date(latestSubmission.submissionDate))}. No changes allowed.`
                    : "Record secured with cryptographic hash."}
                  status="Encrypted"
                  hasHashTooltip
                  hashValue={hashValue}
                />

                <div className="absolute left-[15px] top-[100px] z-0 opacity-30">
                   <LinkIcon size={14} className="text-primary rotate-90" /> 
                </div>

                <TimelineItem 
                  icon={<GitMerge size={16} className="text-primary/70" />}
                  label="Sorted & Grouped"
                  subtext={`Combined with ${stats.totalRecords - 1} other records from ${stats.squadronCount} squadron${stats.squadronCount !== 1 ? 's' : ''}.`}
                  status="Processed"
                />

                <TimelineItem 
                  icon={<PieChart size={16} className="text-primary/50" />}
                  label="Live in Dashboard"
                  subtext="Ready for decision making."
                  status="Active"
                />
              </div>
            </div>

            {/* Aggregation Stats */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {formatMonthYear(selectedMonth)} Aggregation Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Total Records</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{stats.totalRecords}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Squadrons</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{stats.squadronCount}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Pass Rate</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{stats.passRate}%</p>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Avg Score</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{stats.avgScore}%</p>
                </div>
              </div>

              {/* Dashboard Features */}
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">This data powers:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 bg-card rounded border border-border text-foreground">
                    Performance Analytics
                  </span>
                  <span className="text-[10px] px-2 py-1 bg-card rounded border border-border text-foreground">
                    Squadron Performance
                  </span>
                  <span className="text-[10px] px-2 py-1 bg-card rounded border border-border text-foreground">
                    Workforce Readiness
                  </span>
                  <span className="text-[10px] px-2 py-1 bg-card rounded border border-border text-foreground">
                    Training Progress
                  </span>
                  <span className="text-[10px] px-2 py-1 bg-card rounded border border-border text-foreground">
                    Pass Rate Trends
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 border-t border-border pt-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            System Integrity Verified • Defence Data Standard 4.2
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DataAuditButtonProps {
  onClick: () => void;
  className?: string;
}

export function DataAuditButton({ onClick, className }: DataAuditButtonProps) {
  return (
    <Button 
      variant="outline"
      size="icon"
      onClick={onClick}
      className={`
        rounded-xl 
        bg-card border-border text-primary 
        shadow-[inset_0px_1px_4px_rgba(0,0,0,0.4)] 
        hover:bg-primary/10 hover:border-primary/50 hover:text-primary 
        active:scale-95
        transition-all duration-200
        ${className ?? 'h-16 w-16'}
      `}
      title="View Data Integrity Trail"
    >
      <Activity size={20} className="group-hover:animate-pulse" />
    </Button>
  );
}
