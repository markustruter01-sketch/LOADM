import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Users, Clock, AlertTriangle, CheckCircle2, Shield, Award,
  Plane, TrendingUp, TrendingDown, Calendar, Activity, RefreshCw,
  UserX, Stethoscope, GraduationCap, FileWarning, AlertCircle, Loader2,
  LineChart, BarChart3, Bell, Target, Info, HelpCircle, X
} from "lucide-react";

const SQUADRONS = ['33', '35', '36', '37', 'AMG'];

interface HelpContent {
  title: string;
  icon: any;
  sections: {
    heading: string;
    points: string[];
  }[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  workforceReadiness: {
    title: "Workforce Readiness",
    icon: Users,
    sections: [
      {
        heading: "What This Feature Is",
        points: [
          "Shows the current operational readiness status of your workforce",
          "Provides a snapshot of how many personnel are flight-ready vs not ready",
          "The core health indicator for your squadron's capability"
        ]
      },
      {
        heading: "What It Tracks",
        points: [
          "Total Personnel - All members assigned to the selected squadron(s)",
          "Flight Ready - Personnel with all qualifications current and no restrictions",
          "Not Ready - Personnel missing qualifications or with restrictions",
          "At Risk - Unique individuals with qualifications expiring within 90 days"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "Ready % = (Flight Ready ÷ Total Personnel) × 100",
          "Pulls real-time data from qualification records and user profiles",
          "Cross-references expiry dates, medical status, and training completion"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green (≥85%) - Healthy workforce readiness",
          "Yellow (70-84%) - Attention needed, plan renewals",
          "Red (<70%) - Critical, immediate action required",
          "Orange badge - Highlights personnel requiring urgent attention"
        ]
      }
    ]
  },
  flightOperations: {
    title: "Flight Operations",
    icon: Plane,
    sections: [
      {
        heading: "What This Feature Is",
        points: [
          "Displays flight activity metrics for the selected time period",
          "Breaks down hours by day/night and aircraft type",
          "Helps track operational tempo and resource utilization"
        ]
      },
      {
        heading: "What It Tracks",
        points: [
          "Total Flight Hours - Combined day and night flying hours",
          "Day Hours - Flying conducted during daylight hours",
          "Night Hours - Flying conducted during night hours",
          "Total Flights - Number of individual flight sorties",
          "Aircraft Distribution - Hours logged per aircraft type"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "Aggregates data from all flight records in the system",
          "Filters by selected squadron and date range (default: last 30 days)",
          "Aircraft hours are summed from individual flight log entries"
        ]
      },
      {
        heading: "Display Format",
        points: [
          "Large numbers show totals for quick reference",
          "Aircraft cards show hours per platform type",
          "Bar chart width represents relative hours per aircraft",
          "Sortie count helps assess mission frequency"
        ]
      }
    ]
  },
  qualifications: {
    title: "Qualifications Overview",
    icon: Award,
    sections: [
      {
        heading: "What This Feature Is",
        points: [
          "Comprehensive view of qualification currency status",
          "Tracks expiring and expired qualifications",
          "Identifies personnel requiring immediate renewal action"
        ]
      },
      {
        heading: "What It Tracks",
        points: [
          "Total Qualifications - All tracked qualifications across personnel",
          "Current - Qualifications that are valid and not expiring soon",
          "Expiring - Qualifications expiring within next 30/60/90 days",
          "Expired - Qualifications past their expiry date"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "Compares qualification expiry dates against current date",
          "30-day window = expiring within next month",
          "60-day window = expiring within 2 months",
          "90-day window = expiring within 3 months",
          "Expired = expiry date is in the past"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green - Current qualifications (no action needed)",
          "Yellow/Orange - Expiring soon (schedule renewal)",
          "Red - Expired (personnel cannot perform duties)",
          "Blue bar - Visual representation of 90-day expiry breakdown"
        ]
      }
    ]
  },
  safetyCompliance: {
    title: "Safety Compliance",
    icon: Shield,
    sections: [
      {
        heading: "What This Feature Is",
        points: [
          "Tracks safety-related events and compliance metrics",
          "Provides visibility into incident patterns and commendations",
          "Supports safety culture and continuous improvement"
        ]
      },
      {
        heading: "What It Tracks",
        points: [
          "Overall Safety Score - Percentage based on positive safety indicators",
          "Incidents - Safety events requiring investigation or corrective action",
          "Observations - Noted safety concerns or near-misses",
          "Commendations - Positive safety behaviors recognized"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "Safety Score = Weighted formula considering incident severity and frequency",
          "Higher commendation ratio improves overall score",
          "Incidents have negative weighting based on severity",
          "Observations are neutral - they indicate active safety awareness"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green (100%) - Excellent safety record, no recent incidents",
          "Yellow (80-99%) - Minor concerns, continue monitoring",
          "Orange (60-79%) - Increased vigilance needed",
          "Red (<60%) - Critical safety concerns requiring action"
        ]
      }
    ]
  },
  historicalTrends: {
    title: "Historical Trends",
    icon: LineChart,
    sections: [
      {
        heading: "What This Feature Is",
        points: [
          "Shows workforce readiness changes over time",
          "Captures daily snapshots to build trend data",
          "Helps identify patterns and measure improvement initiatives"
        ]
      },
      {
        heading: "What It Tracks",
        points: [
          "Daily readiness percentage snapshots",
          "Total personnel count changes over time",
          "Ready vs not-ready counts each day",
          "Long-term trend direction (improving/declining)"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "System captures a snapshot at midnight each day",
          "Stores readiness data in a time-series database table",
          "Trend % = Difference between recent average and older average",
          "Average Readiness = Mean of all captured daily percentages"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green bars (≥85%) - Healthy readiness that day",
          "Yellow bars (70-84%) - Moderate readiness",
          "Red bars (<70%) - Poor readiness that day",
          "Orange bar - Today's current value",
          "Green trend arrow - Readiness is improving",
          "Red trend arrow - Readiness is declining"
        ]
      }
    ]
  },
  qualificationForecast: {
    title: "Qualification Renewal Forecast",
    icon: BarChart3,
    sections: [
      {
        heading: "What This Feature Is",
        points: [
          "6-month projection of upcoming qualification expirations",
          "Helps plan training and renewal activities in advance",
          "Identifies peak months requiring additional resources"
        ]
      },
      {
        heading: "What It Tracks",
        points: [
          "Monthly expiration counts for next 6 months",
          "Personnel affected each month (unique individuals)",
          "Qualification types expiring",
          "Peak months with highest renewal load"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "Scans all qualification expiry dates in the system",
          "Groups by month based on expiry date",
          "Counts unique personnel (one person may have multiple expiring)",
          "Labels show 'If No Action Taken' scenario"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green bars - Low expiration count (manageable)",
          "Yellow bars - Moderate load (plan ahead)",
          "Red bars - High expiration count (resource intensive)",
          "Orange highlights - Peak month requiring attention",
          "Critical Alerts - Months needing immediate planning"
        ]
      },
      {
        heading: "Recommendations",
        points: [
          "System generates actionable suggestions based on forecast",
          "Prioritizes months with highest impact",
          "Suggests spreading renewals to avoid bottlenecks"
        ]
      }
    ]
  }
};

function HelpButton({ helpKey, onClick }: { helpKey: string; onClick: (key: string) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(helpKey); }}
      className="p-2 rounded-full bg-[#1a1a1a]/50 hover:bg-orange-500/20 border border-orange-500/50 hover:border-orange-500 transition-all duration-200 group"
      title="Click for help"
      data-testid={`help-button-${helpKey}`}
    >
      <HelpCircle className="h-6 w-6 text-orange-500 group-hover:text-orange-400 transition-colors" />
    </button>
  );
}

function HelpModal({ helpKey, onClose }: { helpKey: string | null; onClose: () => void }) {
  if (!helpKey || !HELP_CONTENT[helpKey]) return null;
  
  const content = HELP_CONTENT[helpKey];
  const IconComponent = content.icon;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glassmorphic container */}
        <div className="bg-gradient-to-br from-[#2a2a2a]/90 to-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                <IconComponent className="h-6 w-6 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">{content.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              data-testid="help-modal-close"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
            {content.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {section.heading}
                </h3>
                <ul className="space-y-2 pl-4">
                  {section.points.map((point, pointIdx) => (
                    <li key={pointIdx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-1.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <p className="text-xs text-gray-500 text-center">
              Click anywhere outside or press the X to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkforceAnalytics() {
  const [selectedSquadron, setSelectedSquadron] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<30 | 60 | 90>(30);
  
  const [flightData, setFlightData] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);
  const [readinessData, setReadinessData] = useState<any>(null);
  const [safetyData, setSafetyData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Trigger snapshot capture first (silently, doesn't block the rest)
      fetch('/api/analytics/capture-snapshot', { 
        method: 'POST', 
        credentials: 'include' 
      }).catch(() => {}); // Silent failure is OK

      const squadronParam = selectedSquadron !== "all" ? `squadron=${selectedSquadron}` : "";
      const historySquadronParam = selectedSquadron !== "all" ? `squadron=${selectedSquadron}` : "squadron=ALL";
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - historyRange);
      const startDateParam = `startDate=${daysAgo.toISOString()}`;
      
      const [flightRes, currencyRes, readinessRes, safetyRes, historyRes, forecastRes] = await Promise.all([
        fetch(`/api/analytics/flight-hours?${startDateParam}&${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/currency-status?${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/squadron-readiness?${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/safety-summary?${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/readiness-history?${historySquadronParam}&limit=${historyRange}`, { credentials: 'include' }),
        fetch(`/api/analytics/qualification-forecast?${squadronParam}&months=6`, { credentials: 'include' }),
      ]);

      if (flightRes.ok) setFlightData(await flightRes.json());
      if (currencyRes.ok) setCurrencyData(await currencyRes.json());
      if (readinessRes.ok) setReadinessData(await readinessRes.json());
      if (safetyRes.ok) setSafetyData(await safetyRes.json());
      if (historyRes.ok) setHistoryData(await historyRes.json());
      if (forecastRes.ok) setForecastData(await forecastRes.json());
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSquadron, historyRange]);

  const getReasonIcon = (reason: string) => {
    const normalizedReason = reason?.toLowerCase().trim();
    if (normalizedReason?.includes('medical')) return <Stethoscope className="h-4 w-4" />;
    if (normalizedReason?.includes('leave') || normalizedReason?.includes('personal')) return <Calendar className="h-4 w-4" />;
    if (normalizedReason?.includes('training')) return <GraduationCap className="h-4 w-4" />;
    if (normalizedReason?.includes('currency') || normalizedReason?.includes('lapsed')) return <FileWarning className="h-4 w-4" />;
    if (normalizedReason?.includes('administrative') || normalizedReason?.includes('admin')) return <AlertCircle className="h-4 w-4" />;
    return <UserX className="h-4 w-4" />;
  };

  const consolidateReasons = (reasons: Array<{reason: string, count: number}>) => {
    if (!reasons || reasons.length === 0) return [];
    
    const consolidated: Record<string, {displayName: string, count: number}> = {};
    
    reasons.forEach(({ reason, count }) => {
      const normalized = reason?.toLowerCase().trim();
      let category = '';
      let displayName = '';
      
      if (normalized?.includes('currency') || normalized?.includes('lapsed')) {
        category = 'currency';
        displayName = 'Currency Lapsed';
      } else if (normalized?.includes('medical')) {
        category = 'medical';
        displayName = 'Medical';
      } else if (normalized?.includes('training')) {
        category = 'training';
        displayName = 'Training Required';
      } else if (normalized?.includes('administrative') || normalized?.includes('admin')) {
        category = 'administrative';
        displayName = 'Administrative';
      } else if (normalized?.includes('leave') || normalized?.includes('personal')) {
        category = 'leave';
        displayName = 'Leave/Personal';
      } else {
        category = normalized || 'other';
        displayName = reason || 'Other';
      }
      
      if (consolidated[category]) {
        consolidated[category].count += count;
      } else {
        consolidated[category] = { displayName, count };
      }
    });
    
    return Object.values(consolidated).sort((a, b) => b.count - a.count);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading workforce analytics...</p>
        </div>
      </div>
    );
  }

  const totalPersonnel = readinessData?.summary?.total || 0;
  const readyCount = readinessData?.summary?.ready || 0;
  const notReadyCount = readinessData?.summary?.notReady || 0;
  const readyPercent = readinessData?.summary?.readyPercent || 0;
  
  const dayHours = flightData?.summary?.totalDayHours || 0;
  const nightHours = flightData?.summary?.totalNightHours || 0;
  const totalHours = dayHours + nightHours;
  const totalFlights = flightData?.summary?.totalFlights || 0;
  
  const currentQuals = currencyData?.summary?.current || 0;
  // Use unique personnel count instead of total expiring qualifications
  const personnelAtRisk = currencyData?.summary?.personnelAtRisk || 0;
  const totalExpiringQuals = (currencyData?.summary?.expiring30Days || 0) + 
                             (currencyData?.summary?.expiring60Days || 0) + 
                             (currencyData?.summary?.expiring90Days || 0);
  const expiredQuals = currencyData?.summary?.expired || 0;
  const totalQuals = currencyData?.summary?.total || 0;
  
  const incidents = safetyData?.byType?.incident || 0;
  const observations = safetyData?.byType?.observation || 0;
  const commendations = safetyData?.byType?.commendation || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white">
      <Helmet>
        <title>Workforce Health Analytics | LOADMworkflow</title>
      </Helmet>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/instructors-portal">
              <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white" data-testid="page-title">Workforce Health Analytics</h1>
              <p className="text-gray-400">Comprehensive loadmaster readiness and performance overview</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
              <SelectTrigger className="w-[180px] bg-[#2a2a2a] border-[#333333] text-white" data-testid="select-squadron-filter">
                <SelectValue placeholder="All Squadrons" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-[#333333]">
                <SelectItem value="all" className="text-white hover:bg-[#333333]">All Squadrons</SelectItem>
                {SQUADRONS.map(sq => (
                  <SelectItem key={sq} value={sq} className="text-white hover:bg-[#333333]">Squadron {sq}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchAllData} variant="outline" size="sm" className="border-[#333333] text-gray-300 hover:bg-[#2a2a2a]">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>


        {/* ==================== SECTION 1: WORKFORCE READINESS ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Workforce Readiness</h2>
            <div className="ml-auto">
              <HelpButton helpKey="workforceReadiness" onClick={setActiveHelp} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Readiness Funnel */}
            <Card className="bg-[#2a2a2a] border-[#333333] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-lg">Readiness Status Overview</CardTitle>
                <CardDescription className="text-gray-400">Current personnel availability for flight operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-green-500">{readyCount}</div>
                    <div className="text-sm text-gray-400">Flight Ready</div>
                    <div className="text-xs text-green-400 mt-1">{readyPercent}% of workforce</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-yellow-500">{personnelAtRisk}</div>
                    <div className="text-sm text-gray-400">Personnel At Risk</div>
                    <div className="text-xs text-yellow-400 mt-1">With quals expiring in 90 days</div>
                  </div>
                  <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <UserX className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-red-500">{notReadyCount}</div>
                    <div className="text-sm text-gray-400">Not Ready</div>
                    <div className="text-xs text-red-400 mt-1">{100 - readyPercent}% of workforce</div>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Workforce Readiness</span>
                    <span>{readyPercent}%</span>
                  </div>
                  <div className="h-4 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                    <div 
                      className="bg-green-500 h-full transition-all duration-500" 
                      style={{ width: `${readyPercent}%` }}
                    />
                    <div 
                      className="bg-red-500 h-full transition-all duration-500" 
                      style={{ width: `${100 - readyPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Ready: {readyCount}</span>
                    <span className="text-red-400">Not Ready: {notReadyCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Not Ready Reasons Breakdown */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Non-Readiness Reasons</CardTitle>
                <CardDescription className="text-gray-400">Why personnel are not flight ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const consolidated = consolidateReasons(readinessData?.reasonBreakdown || []);
                    return consolidated.length > 0 ? (
                      consolidated.map((reason, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="text-orange-500">{getReasonIcon(reason.displayName)}</div>
                            <span className="text-gray-300 text-sm">{reason.displayName}</span>
                          </div>
                          <Badge variant="outline" className="border-red-500/50 text-red-400">
                            {reason.count}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>All personnel flight ready!</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Squadron Comparison */}
          <Card className="bg-[#2a2a2a] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Squadron Readiness Comparison</CardTitle>
              <CardDescription className="text-gray-400">Readiness rates across all squadrons • Target: 85%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {readinessData?.bySquadron && readinessData.bySquadron.length > 0 ? (
                  readinessData.bySquadron.map((sq: any) => {
                    const percent = sq.total > 0 ? Math.round((sq.ready / sq.total) * 100) : 0;
                    const meetsTarget = percent >= 85;
                    return (
                      <div key={sq.squadron} className="p-4 bg-[#1a1a1a] rounded-lg text-center">
                        <div className="text-sm text-gray-400 mb-2">Squadron {sq.squadron}</div>
                        <div className={`text-2xl font-bold mb-2 ${meetsTarget ? 'text-green-500' : 'text-yellow-500'}`}>
                          {percent}%
                        </div>
                        <Progress value={percent} className="h-2 bg-[#333]" />
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{sq.ready} ready</span>
                          <span>{sq.total} total</span>
                        </div>
                        {meetsTarget ? (
                          <Badge className="mt-2 bg-green-900/50 text-green-400 text-xs">On Target</Badge>
                        ) : (
                          <Badge className="mt-2 bg-yellow-900/50 text-yellow-400 text-xs">Below Target</Badge>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-5 text-center py-6 text-gray-500">No squadron data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ==================== SECTION 2: FLIGHT OPERATIONS ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Plane className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Flight Operations</h2>
            <span className="text-xs text-gray-500 ml-auto mr-2">Last 30 days</span>
            <HelpButton helpKey="flightOperations" onClick={setActiveHelp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Summary Cards */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-white">{totalHours.toFixed(1)}</div>
                <div className="text-sm text-gray-400">Total Flight Hours</div>
                <div className="text-xs text-gray-500 mt-1">Combined hours logged in last 30 days</div>
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Day Hours</span>
                    <span className="text-white">{dayHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">Night Hours</span>
                    <span className="text-white">{nightHours.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-8 w-8 text-orange-500" />
                  <span className="text-xs text-gray-500">Last 30 Days</span>
                </div>
                <div className="text-3xl font-bold text-white">{totalFlights}</div>
                <div className="text-sm text-gray-400">Total Flights Logged</div>
                <div className="text-xs text-gray-500 mt-1">Number of missions flown</div>
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg flights per person</span>
                    <span className="text-white">{totalPersonnel > 0 ? (totalFlights / totalPersonnel).toFixed(1) : 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-green-500" />
                  <span className="text-xs text-gray-500">Last 30 Days</span>
                </div>
                <div className="text-3xl font-bold text-white">{flightData?.summary?.uniqueUsers || 0}</div>
                <div className="text-sm text-gray-400">Personnel with Flights</div>
                <div className="text-xs text-gray-500 mt-1">Unique members who flew</div>
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Participation rate</span>
                    <span className="text-white">{totalPersonnel > 0 ? Math.round((flightData?.summary?.uniqueUsers || 0) / totalPersonnel * 100) : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-purple-500" />
                  <span className="text-xs text-gray-500">Last 30 Days</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {flightData?.summary?.avgHoursPerPerson || 0}
                </div>
                <div className="text-sm text-gray-400">Avg Hours per Person</div>
                <div className="text-xs text-gray-500 mt-1">Total hours ÷ personnel who flew</div>
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Night flying ratio</span>
                    <span className="text-white">{totalHours > 0 ? Math.round(nightHours / totalHours * 100) : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aircraft Type Breakdown */}
          <Card className="bg-[#2a2a2a] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Hours by Aircraft Type</CardTitle>
              <CardDescription className="text-gray-400">Flight time distribution across airframes (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  // Define all aircraft types that should always be shown
                  const allAircraftTypes = [
                    { code: 'C130J', name: 'C-130J Hercules' },
                    { code: 'C17A', name: 'C-17A Globemaster' },
                    { code: 'KC30A', name: 'KC-30A Airbus' },
                    { code: 'C27J', name: 'C-27J Spartan' }
                  ];
                  
                  // Create a map of existing data
                  const dataMap = new Map();
                  if (flightData?.byAircraftType) {
                    flightData.byAircraftType.forEach((aircraft: any) => {
                      dataMap.set(aircraft.aircraftType, aircraft);
                    });
                  }
                  
                  return allAircraftTypes.map((aircraftDef, idx) => {
                    const aircraft = dataMap.get(aircraftDef.code) || { 
                      aircraftType: aircraftDef.code, 
                      totalHours: 0, 
                      flightCount: 0 
                    };
                    const percent = totalHours > 0 ? (aircraft.totalHours / totalHours * 100) : 0;
                    return (
                      <div key={idx} className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Plane className="h-5 w-5 text-orange-500" />
                            <span className="text-white font-medium">{aircraft.aircraftType}</span>
                          </div>
                          <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                            {percent.toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{aircraft.totalHours?.toFixed(1) || 0} hrs</div>
                        <div className="text-xs text-gray-500">{aircraft.flightCount || 0} flights</div>
                        <Progress value={percent} className="h-2 mt-3 bg-[#333]" />
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ==================== SECTION 3: QUALIFICATIONS & CURRENCY ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Award className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Qualifications & Currency</h2>
            <span className="text-xs text-gray-500 ml-auto mr-2">Current status as of today</span>
            <HelpButton helpKey="qualifications" onClick={setActiveHelp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currency Overview */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Currency Status Distribution</CardTitle>
                <CardDescription className="text-gray-400">{totalQuals} total qualifications tracked across all personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const currentPercent = totalQuals > 0 ? Math.round((currentQuals / totalQuals) * 100) : 0;
                    const expiringPercent = totalQuals > 0 ? Math.round((totalExpiringQuals / totalQuals) * 100) : 0;
                    const expiredPercent = totalQuals > 0 ? Math.round((expiredQuals / totalQuals) * 100) : 0;
                    return (
                      <>
                        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span className="text-gray-300">Current Qualifications</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-500">{currentQuals}</div>
                              <div className="text-xs text-green-400">{currentPercent}% of all quals</div>
                            </div>
                          </div>
                          <Progress value={currentPercent} className="h-2 mt-3 bg-[#1a1a1a]" />
                        </div>
                        
                        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              <span className="text-gray-300">Qualifications Expiring (90 days)</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-yellow-500">{totalExpiringQuals}</div>
                              <div className="text-xs text-yellow-400">{expiringPercent}% • {personnelAtRisk} personnel affected</div>
                            </div>
                          </div>
                          <Progress value={expiringPercent} className="h-2 mt-3 bg-[#1a1a1a]" />
                        </div>
                        
                        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-red-500" />
                              <span className="text-gray-300">Expired Qualifications</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-500">{expiredQuals}</div>
                              <div className="text-xs text-red-400">{expiredPercent}% of all quals</div>
                            </div>
                          </div>
                          <Progress value={expiredPercent} className="h-2 mt-3 bg-[#1a1a1a]" />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Qualification Types Breakdown */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Qualifications by Type</CardTitle>
                <CardDescription className="text-gray-400">Distribution across qualification categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                  {currencyData?.byType && currencyData.byType.length > 0 ? (
                    currencyData.byType.map((qual: any, idx: number) => {
                      const qualTotal = (qual.current || 0) + (qual.expiring || 0) + (qual.expired || 0);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                          <span className="text-gray-300 text-sm">{qual.name}</span>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={totalQuals > 0 ? (qualTotal / totalQuals * 100) : 0} 
                              className="w-20 h-2 bg-[#333]" 
                            />
                            <Badge variant="outline" className="border-orange-500/50 text-orange-400 min-w-[40px] justify-center">
                              {qualTotal}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-500">No qualification types data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expiring by Qualification Type - Moved from Forecast section */}
          {forecastData?.qualificationTypeSummary && forecastData.qualificationTypeSummary.length > 0 && (
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Expiring by Qualification Type</CardTitle>
                <CardDescription className="text-gray-400">Distribution of upcoming renewals across qualification types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {forecastData.qualificationTypeSummary.map((qual: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#1a1a1a] rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-500">{qual.totalExpiring}</div>
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{qual.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ==================== SECTION 4: SAFETY & COMPLIANCE ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Safety & Compliance</h2>
            <span className="text-xs text-gray-500 ml-auto mr-2">All-time records</span>
            <HelpButton helpKey="safetyCompliance" onClick={setActiveHelp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Safety Score */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${
                    (safetyData?.safetyScore || 0) >= 80 ? 'text-green-500' : 
                    (safetyData?.safetyScore || 0) >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {safetyData?.safetyScore || 0}%
                  </div>
                  <div className="text-sm text-gray-400">Overall Safety Score</div>
                  <div className="text-xs text-gray-500 mt-1">Based on all recorded events</div>
                  <Badge className={`mt-2 ${
                    (safetyData?.safetyScore || 0) >= 80 ? 'bg-green-900/50 text-green-400' : 
                    (safetyData?.safetyScore || 0) >= 60 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {safetyData?.safetyScoreLabel || 'N/A'}
                  </Badge>
                  <div className="mt-4 pt-3 border-t border-[#333] text-left">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Score Calculation:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Base: 100 points</li>
                      <li>• Minor incidents: -2 pts each</li>
                      <li>• Moderate incidents: -5 pts each</li>
                      <li>• Major incidents: -10 pts each</li>
                      <li>• Commendations: +0.5 pts (max 20)</li>
                      <li>• Observations: +0.3 pts (max 10)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incidents */}
            <Card className="bg-[#2a2a2a] border-red-500/30 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  {incidents > 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="text-3xl font-bold text-red-500">{incidents}</div>
                <div className="text-sm text-gray-400">Safety Incidents</div>
                <div className="text-xs text-gray-500 mt-1">Total recorded incidents (all time)</div>
                <div className="text-xs text-gray-500 mt-2">
                  {incidents === 0 ? 'No incidents reported' : 'Requires attention'}
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            <Card className="bg-[#2a2a2a] border-blue-500/30 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-8 w-8 text-blue-500" />
                  <span className="text-xs text-gray-500">All Time</span>
                </div>
                <div className="text-3xl font-bold text-blue-500">{observations}</div>
                <div className="text-sm text-gray-400">Safety Observations</div>
                <div className="text-xs text-gray-500 mt-1">Proactive reports submitted</div>
              </CardContent>
            </Card>

            {/* Commendations */}
            <Card className="bg-[#2a2a2a] border-green-500/30 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="h-8 w-8 text-green-500" />
                  <span className="text-xs text-gray-500">All Time</span>
                </div>
                <div className="text-3xl font-bold text-green-500">{commendations}</div>
                <div className="text-sm text-gray-400">Commendations</div>
                <div className="text-xs text-gray-500 mt-1">Excellence awards received</div>
              </CardContent>
            </Card>
          </div>

          {/* Safety Records Summary */}
          <Card className="bg-[#2a2a2a] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Safety Record Analysis</CardTitle>
              <CardDescription className="text-gray-400">{safetyData?.summary?.total || 0} total safety records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safetyData?.byType ? (
                  <>
                    {/* Incidents */}
                    <div className="p-4 bg-[#1a1a1a] rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="text-red-400 font-medium">Incidents</span>
                      </div>
                      <div className="text-3xl font-bold text-red-500">{incidents}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {safetyData.summary?.total > 0 ? ((incidents / safetyData.summary.total) * 100).toFixed(0) : 0}% of records
                      </div>
                    </div>
                    {/* Observations */}
                    <div className="p-4 bg-[#1a1a1a] rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span className="text-blue-400 font-medium">Observations</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-500">{observations}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {safetyData.summary?.total > 0 ? ((observations / safetyData.summary.total) * 100).toFixed(0) : 0}% of records
                      </div>
                    </div>
                    {/* Commendations */}
                    <div className="p-4 bg-[#1a1a1a] rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-green-500" />
                        <span className="text-green-400 font-medium">Commendations</span>
                      </div>
                      <div className="text-3xl font-bold text-green-500">{commendations}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {safetyData.summary?.total > 0 ? ((commendations / safetyData.summary.total) * 100).toFixed(0) : 0}% of records
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-center py-6 text-gray-500">No safety records available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ==================== SECTION 5: HISTORICAL TRENDS ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <LineChart className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Historical Trends</h2>
            <div className="flex items-center gap-1 ml-auto mr-4">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setHistoryRange(days as 30 | 60 | 90)}
                  data-testid={`button-history-${days}d`}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    historyRange === days
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#333333] text-gray-400 hover:bg-[#444444] hover:text-gray-300'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
            <HelpButton helpKey="historicalTrends" onClick={setActiveHelp} />
          </div>

          {historyData?.dataPoints && historyData.dataPoints.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Summary Cards */}
              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Trend Summary</CardTitle>
                  <CardDescription className="text-gray-400">
                    {historyData.summary?.totalSnapshots || 0} days of data collected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-300 text-sm">Current Readiness</span>
                    </div>
                    <span className="text-xl font-bold text-white">{historyData.summary?.latestReadiness || 0}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-300 text-sm">Average Readiness</span>
                    </div>
                    <span className="text-xl font-bold text-blue-400">{historyData.summary?.averageReadiness || 0}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center gap-2">
                      {historyData.summary?.totalSnapshots < 3 ? (
                        <Clock className="h-4 w-4 text-gray-500" />
                      ) : (historyData.summary?.readinessTrend || 0) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-gray-300 text-sm">Trend</span>
                    </div>
                    {historyData.summary?.totalSnapshots < 3 ? (
                      <span className="text-sm text-gray-500">Need more data</span>
                    ) : (
                      <span className={`text-xl font-bold ${(historyData.summary?.readinessTrend || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(historyData.summary?.readinessTrend || 0) >= 0 ? '+' : ''}{historyData.summary?.readinessTrend || 0}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Readiness Chart Visualization */}
              <Card className="bg-[#2a2a2a] border-[#333333] lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Readiness Over Time</CardTitle>
                  <CardDescription className="text-gray-400">
                    Daily readiness percentage • {historyData.dataPoints?.length || 0} day{historyData.dataPoints?.length !== 1 ? 's' : ''} of data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyData.dataPoints?.length < 3 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#333333"
                                strokeWidth="12"
                                fill="none"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke={historyData.dataPoints?.[0]?.readyPercent >= 85 ? '#22c55e' : historyData.dataPoints?.[0]?.readyPercent >= 70 ? '#eab308' : '#ef4444'}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${(historyData.dataPoints?.[0]?.readyPercent || 0) * 3.52} 352`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-3xl font-bold text-white">{historyData.dataPoints?.[0]?.readyPercent || 0}%</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">Today's Readiness</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(historyData.dataPoints?.[0]?.snapshotDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                        <Info className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          Trend data will appear after a few more days of collection.
                          <br />
                          <span className="text-xs text-gray-500">The chart will show daily bars once we have 3+ days of history.</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-48 flex items-end gap-1">
                        {historyData.dataPoints?.slice(-30).map((point: any, idx: number) => {
                          const height = Math.max(point.readyPercent, 5);
                          const date = new Date(point.snapshotDate);
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <div 
                              key={idx} 
                              className="flex-1 flex flex-col items-center group relative"
                              style={{ maxWidth: '40px' }}
                              title={`${date.toLocaleDateString()}: ${point.readyPercent}% ready`}
                            >
                              <div 
                                className={`w-full rounded-t transition-all duration-200 ${
                                  isToday ? 'bg-orange-500' : 
                                  point.readyPercent >= 85 ? 'bg-green-500' : 
                                  point.readyPercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                } group-hover:opacity-80`}
                                style={{ height: `${height * 1.8}px` }}
                              />
                              <div className="absolute -top-8 bg-[#1a1a1a] px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {point.readyPercent}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {historyData.dataPoints?.length > 0 
                            ? new Date(historyData.dataPoints[0]?.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Start'}
                        </span>
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded" /> ≥85%</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded" /> 70-84%</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded" /> &lt;70%</span>
                        </div>
                        <span>Today</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="py-12">
                <div className="text-center">
                  <Info className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Historical Data Collection Started</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Workforce readiness data is now being tracked daily. Check back tomorrow to see trends over time.
                    The system automatically captures a snapshot of workforce readiness each day.
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    Data collection began: {historyData?.collectionStartDate 
                      ? new Date(historyData.collectionStartDate).toLocaleDateString() 
                      : new Date().toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ==================== SECTION 6: QUALIFICATION FORECAST ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Qualification Renewal Forecast</h2>
            <span className="text-xs text-gray-500 ml-auto mr-2">6-month projection • If no action taken</span>
            <HelpButton helpKey="qualificationForecast" onClick={setActiveHelp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast Summary */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Forecast Summary</CardTitle>
                <CardDescription className="text-gray-400">Next 6 months outlook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-900/30 to-[#1a1a1a] border border-orange-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Total Expiring</div>
                      <div className="text-3xl font-bold text-orange-500">{forecastData?.summary?.totalExpiringQuals || 0}</div>
                      <div className="text-xs text-gray-500">qualifications</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Personnel Affected</div>
                      <div className="text-2xl font-bold text-white">{forecastData?.summary?.totalPersonnelAffected || 0}</div>
                      <div className="text-xs text-gray-500">unique individuals</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <span className="text-gray-300 text-sm">Avg per Month</span>
                  <span className="text-lg font-semibold text-white">{forecastData?.summary?.averagePerMonth || 0}</span>
                </div>

                {forecastData?.summary?.peakMonth && (
                  <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <div>
                      <span className="text-gray-300 text-sm block">Peak Month</span>
                      <span className="text-xs text-gray-500">{forecastData.summary.peakMonth.monthLabel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-yellow-500">{forecastData.summary.peakMonth.expiringThisMonth}</span>
                      <span className="text-xs text-gray-500 block">quals expiring</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Forecast Chart */}
            <Card className="bg-[#2a2a2a] border-[#333333] lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Monthly Expiration Forecast</CardTitle>
                <CardDescription className="text-gray-400">Qualifications expiring each month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastData?.forecast?.map((month: any, idx: number) => {
                    const maxExpiring = Math.max(...(forecastData.forecast?.map((m: any) => m.expiringThisMonth) || [1]));
                    const barWidth = maxExpiring > 0 ? (month.expiringThisMonth / maxExpiring) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-gray-400 text-right">{month.monthLabel}</div>
                        <div className="flex-1 h-8 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              month.expiringThisMonth > 5 ? 'bg-red-500' :
                              month.expiringThisMonth > 2 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-white text-sm font-medium">
                              {month.expiringThisMonth} quals • {month.personnelAffected} personnel
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Alerts */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-white text-lg">Critical Alerts</CardTitle>
                </div>
                <CardDescription className="text-gray-400">Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {forecastData?.criticalAlerts && forecastData.criticalAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {forecastData.criticalAlerts.map((alert: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-yellow-400 font-medium">{alert.month}</div>
                          <div className="text-xs text-gray-400">{alert.alert}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No critical alerts at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-white text-lg">Recommendations</CardTitle>
                </div>
                <CardDescription className="text-gray-400">Suggested actions for planning</CardDescription>
              </CardHeader>
              <CardContent>
                {forecastData?.recommendations && forecastData.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {forecastData.recommendations.map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-300">{rec}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No specific recommendations at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-600">
          Workforce Health Analytics Dashboard • Data refreshed at {lastRefresh.toLocaleString()}
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal helpKey={activeHelp} onClose={() => setActiveHelp(null)} />
    </div>
  );
}
