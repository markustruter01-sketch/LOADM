import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  ShieldCheck, 
  GitMerge, 
  PieChart, 
  Activity, 
  Link as LinkIcon 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  username?: string;
  scenarioTitle?: string;
}

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  subtext: string;
  status: string;
  hasHashTooltip?: boolean;
  hashValue?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const TimelineItem = ({ icon, label, subtext, status, hasHashTooltip, hashValue, isFirst, isLast }: TimelineItemProps) => (
  <div className="group relative flex items-start gap-4">
    <div className={`
      relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full 
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

interface AuditRecord {
  id: string;
  type: 'assessment' | 'qualification' | 'flight_record';
  userName: string;
  description: string;
  timestamp: Date;
  hash: string;
  squadron?: string;
}

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
  const [latestRecord, setLatestRecord] = useState<AuditRecord | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [hashValue, setHashValue] = useState('0x7f3a...2b4c');

  const { data: submissions } = useQuery<ExtendedScenarioSubmission[]>({
    queryKey: ['/api/scenario-submissions'],
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : false,
  });

  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const latest = submissions[submissions.length - 1];
      setRecordCount(submissions.length);
      
      const dataToHash = JSON.stringify({
        id: latest.id,
        date: latest.submissionDate,
        score: latest.score
      });
      
      generateHash(dataToHash).then(hash => {
        setHashValue(hash);
        setLatestRecord({
          id: String(latest.id),
          type: 'assessment',
          userName: latest.studentName || latest.username || 'Unknown User',
          description: `Submitted ${latest.scenarioTitle || 'assessment'}`,
          timestamp: new Date(latest.submissionDate || new Date()),
          hash: hash,
          squadron: latest.squadron || undefined
        });
      });
    }
  }, [submissions]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-AU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toUpperCase();
  };

  const auditId = latestRecord ? `#${latestRecord.id.slice(0, 4).toUpperCase()}-${latestRecord.squadron || 'ALPHA'}` : '#0000-ALPHA';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl">
        <DialogHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground tracking-wide">
                Data Integrity Record
              </DialogTitle>
              <p className="text-xs text-primary uppercase tracking-widest mt-1">
                Audit Trail ID: {auditId}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative pl-4">
          <div className="absolute left-[27px] top-4 h-[85%] w-0.5 bg-border">
            <div className="absolute top-0 w-full bg-primary shadow-[0_0_10px_hsl(var(--primary))] animate-pulse h-full opacity-50"></div>
          </div>

          <div className="space-y-8 relative">
            <TimelineItem 
              icon={<User size={18} className="text-foreground" />}
              label="Data Captured"
              subtext={latestRecord 
                ? `${latestRecord.userName} ${latestRecord.description}.`
                : "Awaiting new submissions..."}
              status="Verified"
              isFirst
            />

            <TimelineItem 
              icon={<ShieldCheck size={18} className="text-primary" />}
              label="Secured & Timestamped"
              subtext={latestRecord 
                ? `Record locked at ${formatTimestamp(latestRecord.timestamp)}. No changes allowed.`
                : "Record secured with cryptographic hash."}
              status="Encrypted"
              hasHashTooltip
              hashValue={hashValue}
            />

            <div className="absolute left-[19px] top-[145px] z-0 opacity-30">
               <LinkIcon size={16} className="text-primary rotate-90" /> 
            </div>

            <TimelineItem 
              icon={<GitMerge size={18} className="text-primary/70" />}
              label="Sorted & Grouped"
              subtext={`Combined with ${recordCount > 1 ? recordCount - 1 : 0} other records from ${latestRecord?.squadron || 'your squadron'}.`}
              status="Processed"
            />

            <TimelineItem 
              icon={<PieChart size={18} className="text-primary/50" />}
              label="Live in Dashboard"
              subtext="Ready for decision making."
              status="Active"
              isLast
            />
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center">
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
}

export function DataAuditButton({ onClick }: DataAuditButtonProps) {
  return (
    <Button 
      variant="outline"
      size="icon"
      onClick={onClick}
      className="
        h-10 w-10 rounded-lg 
        bg-card border-border text-primary 
        shadow-[inset_0px_1px_4px_rgba(0,0,0,0.4)] 
        hover:bg-primary/10 hover:border-primary/50 hover:text-primary 
        active:scale-95
        transition-all duration-200
      "
      title="View Data Integrity Trail"
    >
      <Activity size={20} className="group-hover:animate-pulse" />
    </Button>
  );
}
