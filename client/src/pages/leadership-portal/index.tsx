import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import c17aImg from "../../assets/c17a.png";
import kc30aImg from "../../assets/kc30a.png";
import c130jImg from "../../assets/c130j.png";
import c27jImg from "../../assets/c27j.png";
import {
  Users, Shield, Award, AlertTriangle, CheckCircle2, RefreshCw, Printer,
  TrendingUp, TrendingDown, Minus, Activity, Target, Plane, GraduationCap,
  AlertCircle, Loader2, ChevronRight, Lightbulb, BarChart3, Download, X,
  FileWarning, Clock, UserX, Building2, Info, BookOpen, Calendar
} from "lucide-react";

const SQUADRONS = ["ALL", "33SQN", "35SQN", "36SQN", "37SQN"];
const DATE_RANGES = [
  { label: "Last 30 days", value: "30" },
  { label: "Last 60 days", value: "60" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 6 months", value: "180" },
];

function getReadinessColor(pct: number) {
  if (pct >= 85) return "text-green-400";
  if (pct >= 70) return "text-amber-400";
  return "text-red-400";
}

function getReadinessBg(pct: number) {
  if (pct >= 85) return "border-green-500/50 bg-green-500/10";
  if (pct >= 70) return "border-amber-500/50 bg-amber-500/10";
  return "border-red-500/50 bg-red-500/10";
}

function getReadinessRing(pct: number) {
  if (pct >= 85) return "ring-green-500";
  if (pct >= 70) return "ring-amber-500";
  return "ring-red-500";
}

function getSafetyColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function getSafetyLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Satisfactory";
  if (score >= 60) return "Needs Improvement";
  return "Critical";
}

function TrendDelta({ current, prior }: { current: number; prior: number | null }) {
  if (prior === null || prior === undefined) return <span className="text-gray-500 text-xs flex items-center gap-0.5"><Minus className="h-3 w-3" /> —</span>;
  const delta = current - prior;
  if (Math.abs(delta) < 0.5) return <span className="text-gray-500 text-xs flex items-center gap-0.5"><Minus className="h-3 w-3" /> —</span>;
  if (delta > 0) return <span className="text-green-400 text-xs flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +{delta.toFixed(1)}%</span>;
  return <span className="text-red-400 text-xs flex items-center gap-0.5"><TrendingDown className="h-3 w-3" /> {delta.toFixed(1)}%</span>;
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AlertDetailDialog({ alert, onClose }: { alert: any; onClose: () => void }) {
  if (!alert) return null;

  const severityColor = alert.severity === "critical" ? "text-red-400 border-red-500/30" : alert.severity === "high" ? "text-orange-400 border-orange-500/30" : "text-amber-400 border-amber-500/30";

  const handleDownload = () => {
    let content = `ALERT DETAIL REPORT\n${"=".repeat(60)}\n`;
    content += `Alert: ${alert.text}\nSeverity: ${alert.severity.toUpperCase()}\nGenerated: ${new Date().toLocaleString("en-AU")}\n\n`;

    if (alert.type === "expired-quals" || alert.type === "expiring-quals") {
      content += `QUALIFICATION DETAILS\n${"-".repeat(40)}\n`;
      (alert.payload || []).forEach((q: any, i: number) => {
        content += `${i + 1}. ${q.userName || q.userEmail || "Unknown"} — ${q.name || "Qualification"}\n`;
        content += `   Squadron: ${q.squadron || "N/A"} | Expiry: ${q.expiryDate ? new Date(q.expiryDate).toLocaleDateString("en-AU") : "N/A"}`;
        if (q.daysOverdue) content += ` | ${q.daysOverdue} days overdue`;
        if (q.daysRemaining !== undefined) content += ` | ${q.daysRemaining} days remaining`;
        content += "\n";
      });
    } else if (alert.type === "major-incident") {
      content += `INCIDENT DETAILS\n${"-".repeat(40)}\n`;
      (alert.payload || []).forEach((inc: any, i: number) => {
        content += `${i + 1}. ${inc.title || "Incident"} — ${inc.squadron || "N/A"} (${inc.date ? new Date(inc.date).toLocaleDateString("en-AU") : "N/A"})\n`;
        if (inc.description) content += `   ${inc.description}\n`;
        content += `   Location: ${inc.location || "N/A"} | Aircraft: ${inc.aircraftType || "N/A"} | Status: ${inc.status || "N/A"}\n`;
      });
    } else if (alert.type === "high-risk") {
      content += `HIGH-RISK PERSONNEL\n${"-".repeat(40)}\n`;
      (alert.payload || []).forEach((s: any, i: number) => {
        content += `${i + 1}. ${s.name || s.userName || "Unknown"} — ${s.squadron || "N/A"}\n`;
        if (s.reasons?.length) content += `   Risk factors: ${s.reasons.join(", ")}\n`;
      });
    } else if (alert.type === "squadron-readiness") {
      const sq = alert.payload;
      content += `SQUADRON DETAILS\n${"-".repeat(40)}\n`;
      content += `Squadron: ${sq.squadron}SQN\nReadiness: ${sq.readyPercent}%\nTotal Personnel: ${sq.total}\nFlight Ready: ${sq.ready}\nNot Ready: ${sq.notReady}\n`;
    }
    downloadText(content, `alert-report-${new Date().toISOString().slice(0, 10)}.txt`);
  };

  const renderContent = () => {
    if (alert.type === "expired-quals") {
      const items: any[] = [...(alert.payload || [])].sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{items.length} qualification{items.length > 1 ? "s" : ""} have passed their expiry date and require immediate renewal action.</p>
          <div className="rounded border border-[#333] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#222] text-gray-400 text-xs"><th className="text-left px-3 py-2">Personnel</th><th className="text-left px-3 py-2">Squadron</th><th className="text-left px-3 py-2">Qualification</th><th className="text-left px-3 py-2">Expired</th><th className="text-right px-3 py-2">Overdue</th></tr></thead>
              <tbody>
                {items.map((q: any, i: number) => (
                  <tr key={i} className="border-t border-[#2a2a2a] hover:bg-[#1e1e1e]">
                    <td className="px-3 py-2 text-white font-medium">{q.userName || q.userEmail || "—"}</td>
                    <td className="px-3 py-2 text-gray-400">{q.squadron ? `${q.squadron}SQN` : "—"}</td>
                    <td className="px-3 py-2 text-gray-300">{q.name || "—"}</td>
                    <td className="px-3 py-2 text-red-400">{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString("en-AU") : "—"}</td>
                    <td className="px-3 py-2 text-right text-red-400">{q.daysOverdue ? `${q.daysOverdue}d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (alert.type === "expiring-quals") {
      const items: any[] = alert.payload || [];
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{items.length} qualification{items.length > 1 ? "s" : ""} will expire within 30 days. Schedule renewals now to maintain readiness.</p>
          <div className="rounded border border-[#333] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#222] text-gray-400 text-xs"><th className="text-left px-3 py-2">Personnel</th><th className="text-left px-3 py-2">Squadron</th><th className="text-left px-3 py-2">Qualification</th><th className="text-left px-3 py-2">Expires</th><th className="text-right px-3 py-2">Remaining</th></tr></thead>
              <tbody>
                {items.map((q: any, i: number) => (
                  <tr key={i} className="border-t border-[#2a2a2a] hover:bg-[#1e1e1e]">
                    <td className="px-3 py-2 text-white font-medium">{q.userName || q.userEmail || "—"}</td>
                    <td className="px-3 py-2 text-gray-400">{q.squadron ? `${q.squadron}SQN` : "—"}</td>
                    <td className="px-3 py-2 text-gray-300">{q.name || "—"}</td>
                    <td className="px-3 py-2 text-orange-400">{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString("en-AU") : "—"}</td>
                    <td className="px-3 py-2 text-right text-orange-400">{q.daysRemaining !== undefined ? `${q.daysRemaining}d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (alert.type === "major-incident") {
      const items: any[] = alert.payload || [];
      if (items.length === 0) return <p className="text-sm text-gray-400">No detailed data available for this incident alert.</p>;
      return (
        <div className="space-y-4">
          {items.map((inc: any, i: number) => (
            <div key={i} className="border border-red-500/30 bg-red-950/10 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-white font-semibold text-sm">{inc.title || "Safety Incident"}</h4>
                <div className="flex gap-2 flex-shrink-0">
                  <Badge variant="outline" className="border-red-500 text-red-400 text-xs">{inc.severity}</Badge>
                  <Badge variant="outline" className="border-amber-500 text-amber-400 text-xs">{inc.status}</Badge>
                </div>
              </div>
              {inc.description && <p className="text-sm text-gray-300">{inc.description}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Date: </span><span className="text-gray-300">{inc.date ? new Date(inc.date).toLocaleDateString("en-AU") : "—"}</span></div>
                <div><span className="text-gray-500">Squadron: </span><span className="text-gray-300">{inc.squadron || "—"}</span></div>
                <div><span className="text-gray-500">Location: </span><span className="text-gray-300">{inc.location || "—"}</span></div>
                <div><span className="text-gray-500">Aircraft: </span><span className="text-gray-300">{inc.aircraftType || "—"}</span></div>
                {inc.flightPhase && <div><span className="text-gray-500">Flight Phase: </span><span className="text-gray-300">{inc.flightPhase}</span></div>}
                {inc.safetyLevel && <div><span className="text-gray-500">Safety Level: </span><span className="text-gray-300">{inc.safetyLevel}</span></div>}
              </div>
              {inc.contributingFactors && <p className="text-xs"><span className="text-gray-500">Contributing Factors: </span><span className="text-gray-300">{inc.contributingFactors}</span></p>}
            </div>
          ))}
        </div>
      );
    }

    if (alert.type === "high-risk") {
      const students: any[] = alert.payload || [];
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{students.length} personnel have been flagged as high-risk based on performance, attendance, or qualification currency.</p>
          <div className="space-y-2">
            {students.map((s: any, i: number) => (
              <div key={i} className="border border-[#333] bg-[#1e1e1e] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium text-sm">{s.name || s.userName || `Student ${i + 1}`}</span>
                  <span className="text-xs text-gray-400">{s.squadron || "—"}</span>
                </div>
                {s.avgScore !== undefined && <p className="text-xs text-gray-400">Avg Score: <span className="text-amber-400">{s.avgScore}%</span></p>}
                {s.reasons?.length > 0 && <p className="text-xs text-gray-500 mt-1">{s.reasons.join(" • ")}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (alert.type === "squadron-readiness") {
      const sq = alert.payload;
      const notReadyReasons: [string, number][] = sq.reasonBreakdown ? Object.entries(sq.reasonBreakdown) : [];
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Personnel", value: sq.total, color: "text-white" },
              { label: "Flight Ready", value: sq.ready, color: "text-green-400" },
              { label: "Not Ready", value: sq.notReady, color: "text-red-400" },
            ].map(k => (
              <div key={k.label} className="bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          <Progress value={sq.readyPercent} className="h-3" />
          <p className="text-sm text-gray-400 text-center">{sq.readyPercent}% flight ready — target is 85%</p>
          {notReadyReasons.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Non-Readiness Reasons</p>
              <div className="space-y-1.5">
                {notReadyReasons.sort((a, b) => Number(b[1]) - Number(a[1])).map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{reason}</span>
                    <span className="text-red-400 font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <p className="text-sm text-gray-400">No additional details available.</p>;
  };

  return (
    <Dialog open={!!alert} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className={`text-base font-semibold ${severityColor.split(" ")[0]}`}>{alert.text}</DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                <span className={`uppercase font-medium ${severityColor.split(" ")[0]}`}>{alert.severity}</span> alert — click Download to save a copy
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-2">{renderContent()}</div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#333]">
          <Button variant="outline" size="sm" onClick={handleDownload} className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]">
            <Download className="h-4 w-4 mr-1.5" /> Download Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]">
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeadershipPortal() {
  const { user } = useIsolatedAuth();
  const [squadron, setSquadron] = useState("ALL");
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("readiness");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [readinessData, setReadinessData] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);
  const [safetyData, setSafetyData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [atRiskData, setAtRiskData] = useState<any>(null);
  const [submissionsData, setSubmissionsData] = useState<any>(null);
  const [topicData, setTopicData] = useState<any>(null);
  const [squadronPerfData, setSquadronPerfData] = useState<any>(null);
  const [scenarioSubsData, setScenarioSubsData] = useState<any>(null);
  const [moduleCompletionData, setModuleCompletionData] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const sqParam = squadron === "ALL" ? "" : `squadron=${squadron.replace("SQN", "")}`;
      const [readinessRes, currencyRes, safetyRes, historyRes, forecastRes, atRiskRes, subsRes, topicRes, sqPerfRes, scenSubsRes, moduleRes] = await Promise.all([
        fetch(`/api/analytics/squadron-readiness?${sqParam}`, { credentials: "include" }),
        fetch(`/api/analytics/currency-status?${sqParam}`, { credentials: "include" }),
        fetch(`/api/analytics/safety-summary?${sqParam}`, { credentials: "include" }),
        fetch(`/api/analytics/readiness-history?${sqParam}&limit=${dateRange}`, { credentials: "include" }),
        fetch(`/api/analytics/qualification-forecast?${sqParam}&months=6`, { credentials: "include" }),
        fetch(`/api/analytics/at-risk-students?${sqParam}`, { credentials: "include" }),
        fetch(`/api/instructor/quiz-submissions`, { credentials: "include" }),
        fetch(`/api/analytics/topic-mastery`, { credentials: "include" }),
        fetch(`/api/analytics/student-vs-squadron`, { credentials: "include" }),
        fetch(`/api/scenario-submissions`, { credentials: "include" }),
        fetch(`/api/analytics/module-completion`, { credentials: "include" }),
      ]);

      const [readiness, currency, safety, history, forecast, atRisk, subs, topic, sqPerf, scenSubs, modulesData] = await Promise.all([
        readinessRes.ok ? readinessRes.json() : null,
        currencyRes.ok ? currencyRes.json() : null,
        safetyRes.ok ? safetyRes.json() : null,
        historyRes.ok ? historyRes.json() : null,
        forecastRes.ok ? forecastRes.json() : null,
        atRiskRes.ok ? atRiskRes.json() : null,
        subsRes.ok ? subsRes.json() : null,
        topicRes.ok ? topicRes.json() : null,
        sqPerfRes.ok ? sqPerfRes.json() : null,
        scenSubsRes.ok ? scenSubsRes.json() : null,
        moduleRes.ok ? moduleRes.json() : null,
      ]);

      setReadinessData(readiness);
      setCurrencyData(currency);
      setSafetyData(safety);
      setHistoryData(history);
      setForecastData(forecast);
      setAtRiskData(atRisk);
      setSubmissionsData(subs);
      setTopicData(topic);
      setSquadronPerfData(sqPerf);
      setScenarioSubsData(scenSubs);
      setModuleCompletionData(modulesData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching leadership data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [squadron, dateRange]);

  const kpis = useMemo(() => {
    const totalPersonnel = readinessData?.summary?.total ?? 0;
    const readyPercent = readinessData?.summary?.readyPercent ?? 0;
    const safetyScore = safetyData?.safetyScore ?? 0;
    const expiring30 = currencyData?.summary?.expiring30Days ?? 0;
    const highRiskCount = (Array.isArray(atRiskData) ? atRiskData : []).filter((s: any) => s.riskLevel === "high").length;

    const days = parseInt(dateRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const priorCutoff = new Date();
    priorCutoff.setDate(priorCutoff.getDate() - days * 2);

    let quizPassRate = 0;
    let priorQuizPassRate: number | null = null;
    if (submissionsData) {
      const allSubs = Array.isArray(submissionsData) ? submissionsData : (submissionsData.submissions || []);
      const getDate = (s: any) => new Date(s.submissionDate || s.createdAt || s.date || 0);
      const currentSubs = allSubs.filter((s: any) => getDate(s) >= cutoff);
      const priorSubs = allSubs.filter((s: any) => { const d = getDate(s); return d >= priorCutoff && d < cutoff; });
      const quizSubs = currentSubs.filter((s: any) => s.score !== null && s.score !== undefined);
      if (quizSubs.length > 0) {
        quizPassRate = Math.round((quizSubs.filter((s: any) => s.score >= 70).length / quizSubs.length) * 100);
      }
      const priorQuizSubs = priorSubs.filter((s: any) => s.score !== null && s.score !== undefined);
      if (priorQuizSubs.length > 0) {
        priorQuizPassRate = Math.round((priorQuizSubs.filter((s: any) => s.score >= 70).length / priorQuizSubs.length) * 100);
      }
    }

    let scenarioPassRate = 0;
    let priorScenarioPassRate: number | null = null;
    if (scenarioSubsData) {
      const allScenSubs = Array.isArray(scenarioSubsData) ? scenarioSubsData : [];
      const getDate = (s: any) => new Date(s.submissionDate || s.createdAt || s.date || 0);
      const currentScenSubs = allScenSubs.filter((s: any) => getDate(s) >= cutoff);
      const priorScenSubs = allScenSubs.filter((s: any) => { const d = getDate(s); return d >= priorCutoff && d < cutoff; });
      const graded = currentScenSubs.filter((s: any) => s.passed !== undefined && s.passed !== null);
      if (graded.length > 0) {
        scenarioPassRate = Math.round((graded.filter((s: any) => s.passed).length / graded.length) * 100);
      }
      const priorGraded = priorScenSubs.filter((s: any) => s.passed !== undefined && s.passed !== null);
      if (priorGraded.length > 0) {
        priorScenarioPassRate = Math.round((priorGraded.filter((s: any) => s.passed).length / priorGraded.length) * 100);
      }
    }

    const priorReadyPct = historyData?.dataPoints?.length > 1
      ? historyData.dataPoints[historyData.dataPoints.length - 2]?.readyPercent ?? null
      : null;

    let trainingCompletionRate = 0;
    if (Array.isArray(moduleCompletionData) && moduleCompletionData.length > 0) {
      trainingCompletionRate = Math.round(
        moduleCompletionData.reduce((sum: number, m: any) => sum + (m.completionRate || 0), 0) / moduleCompletionData.length
      );
    }

    return {
      totalPersonnel,
      readyPercent,
      quizPassRate,
      scenarioPassRate,
      safetyScore,
      expiring30,
      highRiskCount,
      priorReadyPct,
      priorQuizPassRate,
      priorScenarioPassRate,
      trainingCompletionRate,
    };
  }, [readinessData, currencyData, safetyData, atRiskData, submissionsData, scenarioSubsData, historyData, dateRange, moduleCompletionData]);

  const wingState = useMemo(() => {
    const readyPct = kpis.readyPercent;
    const expiredQuals = currencyData?.summary?.expired ?? 0;
    const openMajor = safetyData?.openItems?.filter((i: any) => i.severity === "major")?.length ?? (safetyData?.bySeverity?.major > 0 && safetyData?.byStatus?.open > 0 ? safetyData.bySeverity.major : 0);
    const safetyScore = kpis.safetyScore;

    let state: "READY" | "CAUTION" | "DEGRADED" = "READY";
    const reasons: string[] = [];

    if (readyPct < 70 || openMajor > 0 || safetyScore < 60) {
      state = "DEGRADED";
    } else if (readyPct < 85 || expiredQuals > 0 || safetyScore < 80) {
      state = "CAUTION";
    }

    if (readyPct < 85) reasons.push(`Readiness ${readyPct}%`);
    if (expiredQuals > 0) reasons.push(`${expiredQuals} expired qual${expiredQuals > 1 ? "s" : ""}`);
    if (openMajor > 0) reasons.push(`${openMajor} open major incident${openMajor > 1 ? "s" : ""}`);
    if (safetyScore < 80) reasons.push(`Safety score ${safetyScore}`);

    const justification = reasons.length > 0
      ? reasons.join(", ")
      : "All metrics within acceptable thresholds";

    return { state, justification, readyPct, expiredQuals, openMajor, safetyScore };
  }, [kpis, currencyData, safetyData]);

  const executiveSummary = useMemo(() => {
    const sentences: string[] = [];
    const readyPct = kpis.readyPercent;
    const total = kpis.totalPersonnel;

    if (readyPct >= 85) {
      sentences.push(`The Wing is currently at ${readyPct}% operational readiness across ${total} personnel, meeting the 85% target.`);
    } else {
      sentences.push(`The Wing is at ${readyPct}% operational readiness across ${total} personnel, below the 85% target.`);
    }

    const topReason = readinessData?.reasonBreakdown?.[0];
    if (topReason && readyPct < 85) {
      sentences.push(`The primary readiness drag is "${topReason.reason}" affecting ${topReason.count} personnel (${topReason.percent}% of non-ready).`);
    }

    const safetyScore = kpis.safetyScore;
    if (safetyScore >= 80) {
      sentences.push(`Safety posture is ${getSafetyLabel(safetyScore).toLowerCase()} with a composite score of ${safetyScore}/100.`);
    } else {
      sentences.push(`Safety score of ${safetyScore}/100 requires attention — rated "${getSafetyLabel(safetyScore)}".`);
    }

    if (kpis.expiring30 > 0) {
      sentences.push(`${kpis.expiring30} qualification${kpis.expiring30 > 1 ? "s" : ""} expiring within 30 days — schedule renewals promptly.`);
    }

    if (kpis.highRiskCount > 0) {
      sentences.push(`${kpis.highRiskCount} high-risk personnel require immediate intervention.`);
    } else if (sentences.length < 4) {
      sentences.push(`No high-risk personnel currently identified.`);
    }

    return sentences.join(" ");
  }, [kpis, readinessData]);

  const alerts = useMemo(() => {
    const items: { text: string; severity: "critical" | "high" | "medium"; type: string; payload: any }[] = [];

    if (readinessData?.bySquadron) {
      readinessData.bySquadron.forEach((sq: any) => {
        if (sq.squadron !== "AMG" && sq.readyPercent < 70) {
          items.push({ text: `${sq.squadron}SQN readiness ${sq.readyPercent}% — below target`, severity: "critical", type: "squadron-readiness", payload: sq });
        } else if (sq.squadron !== "AMG" && sq.readyPercent < 85) {
          items.push({ text: `${sq.squadron}SQN readiness ${sq.readyPercent}% — approaching target`, severity: "medium", type: "squadron-readiness", payload: sq });
        }
      });
    }

    if (currencyData?.summary?.expired > 0) {
      items.push({ text: `${currencyData.summary.expired} expired qualification${currencyData.summary.expired > 1 ? "s" : ""} across force`, severity: "critical", type: "expired-quals", payload: currencyData.expired || [] });
    }
    if (kpis.expiring30 >= 5) {
      items.push({ text: `${kpis.expiring30} quals expiring within 30 days`, severity: "high", type: "expiring-quals", payload: currencyData?.expiring30 || [] });
    }

    if (safetyData?.openItems) {
      const openMajor = safetyData.openItems.filter((i: any) => i.severity === "major");
      if (openMajor.length > 0) {
        items.push({ text: `${openMajor.length} open major incident${openMajor.length > 1 ? "s" : ""}`, severity: "critical", type: "major-incident", payload: openMajor });
      }
    } else if (safetyData?.bySeverity?.major > 0 && safetyData?.byStatus?.open > 0) {
      items.push({ text: `${safetyData.bySeverity.major} major safety incident${safetyData.bySeverity.major > 1 ? "s" : ""} on record`, severity: "critical", type: "major-incident", payload: [] });
    }

    if (kpis.highRiskCount > 0) {
      const highRiskStudents = (Array.isArray(atRiskData) ? atRiskData : []).filter((s: any) => s.riskLevel === "high");
      items.push({ text: `${kpis.highRiskCount} high-risk personnel identified`, severity: "high", type: "high-risk", payload: highRiskStudents });
    }

    items.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 };
      return order[a.severity] - order[b.severity];
    });

    return items;
  }, [readinessData, currencyData, safetyData, atRiskData, kpis]);

  const weakestTopic = useMemo(() => {
    const categories = Array.isArray(topicData) ? topicData : topicData?.categories;
    if (!categories?.length) return null;
    const sorted = [...categories].sort((a: any, b: any) => (a.masteryPercentage ?? a.avgScore ?? 0) - (b.masteryPercentage ?? b.avgScore ?? 0));
    const w = sorted[0];
    return { category: w.category, avgScore: w.masteryPercentage ?? w.avgScore ?? 0 };
  }, [topicData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !readinessData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading Force Readiness data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Command Dashboard | LOADMworkflow</title>
        <meta name="description" content="Executive leadership dashboard for monitoring force readiness, qualifications, training performance, and safety across all squadrons." />
      </Helmet>

      <style>{`
        @media print {
          .no-print, nav, .bottom-nav, header, .chat-system { display: none !important; }
          .print-expand { display: block !important; }
          body, .main-content { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .print-expand * { color: black !important; border-color: #ccc !important; background: white !important; }
          .kpi-card { border: 1px solid #ccc !important; }
          .alert-chip { border: 1px solid #999 !important; }
          [data-state] { display: block !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#121212] text-white pb-24">
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Command Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">
                {user?.name || user?.email} &mdash;{" "}
                {lastUpdated
                  ? `Data as of ${lastUpdated.toLocaleTimeString()} ${lastUpdated.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}`
                  : "Loading..."}
              </p>
              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${
                wingState.state === "READY"
                  ? "bg-green-500/10 border-green-500/40 text-green-400"
                  : wingState.state === "CAUTION"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-red-500/10 border-red-500/40 text-red-400"
              }`}>
                {wingState.state === "READY" ? <CheckCircle2 className="h-4 w-4" /> :
                 wingState.state === "CAUTION" ? <AlertTriangle className="h-4 w-4" /> :
                 <AlertCircle className="h-4 w-4" />}
                <span>{wingState.state}</span>
                <span className="text-xs font-normal opacity-80">— {wingState.justification}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 no-print">
              <Select value={squadron} onValueChange={setSquadron}>
                <SelectTrigger className="w-[130px] bg-[#1a1a1a] border-[#333] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SQUADRONS.map((s) => (
                    <SelectItem key={s} value={s}>{s === "ALL" ? "All Squadrons" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px] bg-[#1a1a1a] border-[#333] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchAllData} variant="outline" size="sm" className="border-[#333] text-gray-300 hover:bg-[#2a2a2a]">
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="border-[#333] text-gray-300 hover:bg-[#2a2a2a]">
                <Printer className="h-4 w-4 mr-1" /> Print Briefing
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            <KpiCard
              label="Total Personnel"
              value={kpis.totalPersonnel}
              icon={<Users className="h-5 w-5 text-blue-400" />}
              color="text-white"
            />
            <KpiCard
              label="% Flight Ready"
              value={`${kpis.readyPercent}%`}
              icon={<CheckCircle2 className={`h-5 w-5 ${getReadinessColor(kpis.readyPercent)}`} />}
              color={getReadinessColor(kpis.readyPercent)}
              trend={<TrendDelta current={kpis.readyPercent} prior={kpis.priorReadyPct} />}
            />
            <KpiCard
              label="Quiz Pass Rate"
              value={`${kpis.quizPassRate}%`}
              icon={<GraduationCap className="h-5 w-5 text-purple-400" />}
              color={kpis.quizPassRate >= 70 ? "text-green-400" : "text-red-400"}
              trend={<TrendDelta current={kpis.quizPassRate} prior={kpis.priorQuizPassRate} />}
            />
            <KpiCard
              label="Scenario Pass Rate"
              value={`${kpis.scenarioPassRate}%`}
              icon={<Target className="h-5 w-5 text-cyan-400" />}
              color={kpis.scenarioPassRate >= 70 ? "text-green-400" : "text-red-400"}
              trend={<TrendDelta current={kpis.scenarioPassRate} prior={kpis.priorScenarioPassRate} />}
            />
            <KpiCard
              label="Training Completion"
              value={`${kpis.trainingCompletionRate}%`}
              icon={<BookOpen className="h-5 w-5 text-indigo-400" />}
              color={kpis.trainingCompletionRate >= 70 ? "text-green-400" : kpis.trainingCompletionRate >= 50 ? "text-amber-400" : "text-red-400"}
            />
            <KpiCard
              label="Safety Score"
              value={kpis.safetyScore}
              icon={<Shield className={`h-5 w-5 ${getSafetyColor(kpis.safetyScore)}`} />}
              color={getSafetyColor(kpis.safetyScore)}
            />
            <KpiCard
              label="Quals Expiring 30d"
              value={kpis.expiring30}
              icon={<Award className="h-5 w-5 text-amber-400" />}
              color={kpis.expiring30 >= 5 ? "text-red-400" : kpis.expiring30 >= 1 ? "text-amber-400" : "text-green-400"}
            />
            <KpiCard
              label="High-Risk Personnel"
              value={kpis.highRiskCount}
              icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
              color={kpis.highRiskCount > 0 ? "text-red-400" : "text-green-400"}
            />
          </div>

          {executiveSummary && (
            <Card className="bg-[#1a1a1a]/60 border-[#333] mb-4">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Executive Summary</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{executiveSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {alerts.length === 0 ? (
                <div className="alert-chip flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm whitespace-nowrap">
                  <CheckCircle2 className="h-4 w-4" /> All systems nominal
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAlert(alert)}
                    className={`alert-chip flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap border cursor-pointer transition-opacity hover:opacity-80 ${
                      alert.severity === "critical"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : alert.severity === "high"
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {alert.text}
                    <ChevronRight className="h-3 w-3 ml-1 flex-shrink-0 opacity-60" />
                  </button>
                ))
              )}
            </div>
          </div>

          <AlertDetailDialog alert={selectedAlert} onClose={() => setSelectedAlert(null)} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="print-expand">
            <TabsList className="bg-[#1a1a1a] border border-[#333] mb-4 no-print">
              <TabsTrigger value="readiness">Operational Readiness</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications & Currency</TabsTrigger>
              <TabsTrigger value="training">Training Performance</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
            </TabsList>

            <TabsContent value="readiness" className="print-expand space-y-4">
              <ReadinessTab readinessData={readinessData} atRiskData={atRiskData} historyData={historyData} />
            </TabsContent>

            <TabsContent value="qualifications" className="print-expand space-y-4">
              <QualificationsTab currencyData={currencyData} forecastData={forecastData} readinessData={readinessData} />
            </TabsContent>

            <TabsContent value="training" className="print-expand space-y-4">
              <TrainingTab
                squadronPerfData={squadronPerfData}
                submissionsData={submissionsData}
                topicData={topicData}
                weakestTopic={weakestTopic}
                kpis={kpis}
                currencyData={currencyData}
                readinessData={readinessData}
              />
            </TabsContent>

            <TabsContent value="safety" className="print-expand space-y-4">
              <SafetyTab safetyData={safetyData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, icon, color, trend }: { label: string; value: any; icon: any; color: string; trend?: any }) {
  return (
    <Card className="kpi-card bg-[#1a1a1a] border-[#333] hover:border-[#555] transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          {icon}
          {trend}
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}

function ReadinessTab({ readinessData, atRiskData, historyData }: { readinessData: any; atRiskData: any; historyData: any }) {
  const squadrons = (readinessData?.bySquadron || []).filter((s: any) => s.squadron !== "AMG");
  const PAGE_SIZE = 15;
  const [atRiskPage, setAtRiskPage] = useState(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [iccMetric, setIccMetric] = useState<string>("assessmentsPassed");
  const [showIccFormulaModal, setShowIccFormulaModal] = useState<boolean>(false);
  const [iccSquadronToggles, setIccSquadronToggles] = useState<Record<string, boolean>>({
    '33SQN': true, '35SQN': true, '36SQN': true, '37SQN': true
  });

  const { data: iccData, isLoading: isLoadingIcc } = useQuery<{
    metric: string;
    metricLabel: string;
    curves: {
      squadron: string;
      color: string;
      dataPoints: {
        year: number;
        yearLabel: string;
        rawValue: number;
        normalizedValue: number;
        usersInBin: number;
        cumulativeUsers: number;
      }[];
    }[];
    insights: { type: string; title: string; description: string }[];
    summary: {
      totalUsers: number;
      squadronsIncluded: number;
      tenureRange: { min: number; max: number };
    };
  }>({
    queryKey: [`/api/analytics/icc-power-law?metric=${iccMetric}`],
  });

  const historyPoints = historyData?.dataPoints || [];
  const historyTrendDelta = historyPoints.length >= 2
    ? historyPoints[historyPoints.length - 1]?.readyPercent - historyPoints[0]?.readyPercent
    : 0;

  const atRiskList = Array.isArray(atRiskData) ? atRiskData : [];
  const totalPages = Math.ceil(atRiskList.length / PAGE_SIZE);
  const pagedAtRisk = atRiskList.slice(atRiskPage * PAGE_SIZE, (atRiskPage + 1) * PAGE_SIZE);

  const notReadyMembers: any[] = readinessData?.notReadyMembers || [];
  const reasonMembers = selectedReason
    ? notReadyMembers.filter((m: any) => m.reason === selectedReason)
    : [];

  return (
    <>
      {selectedReason !== null && (
        <Dialog open={true} onOpenChange={() => setSelectedReason(null)}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Not Ready: {selectedReason}</DialogTitle>
            </DialogHeader>
            {reasonMembers.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No personnel records found for this reason.</p>
            ) : (
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-[#333] text-gray-400 text-left">
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">Squadron</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonMembers.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-[#222] hover:bg-[#222]">
                      <td className="py-2 px-2 text-white">{m.name || m.email}</td>
                      <td className="py-2 px-2 text-gray-300">{m.squadron || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DialogContent>
        </Dialog>
      )}

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Squadron Battle-Board</CardTitle></CardHeader>
        <CardContent>
          {(() => {
            const AIRCRAFT_MAP: Record<string, { img: string; type: string }> = {
              "33SQN": { img: c27jImg, type: "C-27J Spartan" },
              "35SQN": { img: kc30aImg, type: "KC-30A MRTT" },
              "36SQN": { img: c17aImg, type: "C-17A Globemaster" },
              "37SQN": { img: c130jImg, type: "C-130J Hercules" },
            };
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {squadrons.map((sq: any) => {
                  const sqKey = sq.squadron.includes("SQN") ? sq.squadron : `${sq.squadron}SQN`;
                  const aircraft = AIRCRAFT_MAP[sqKey];
                  return (
                    <div key={sq.squadron} className="flex flex-col gap-2">
                      {aircraft && (
                        <div className="w-full h-24 flex items-center justify-center bg-[#111] rounded-xl overflow-hidden border border-[#2a2a2a]">
                          <img
                            src={aircraft.img}
                            alt={aircraft.type}
                            className="h-full w-full object-contain p-1 drop-shadow-lg"
                          />
                        </div>
                      )}
                      <div
                        className={`rounded-xl p-4 border-2 ring-2 ${getReadinessBg(sq.readyPercent)} ${getReadinessRing(sq.readyPercent)}`}
                      >
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-0.5">{aircraft?.type || ""}</div>
                          <div className="text-sm font-medium text-gray-300 mb-1">{sqKey}</div>
                          <div className={`text-3xl font-bold ${getReadinessColor(sq.readyPercent)}`}>{sq.readyPercent}%</div>
                          <div className="text-xs text-gray-400 mt-1">{sq.ready} / {sq.total} ready</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {historyPoints.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Readiness History
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Wing readiness % over time
                  {historyTrendDelta !== 0 && (
                    <span className={`ml-2 font-medium ${historyTrendDelta > 0 ? "text-green-400" : "text-red-400"}`}>
                      ({historyTrendDelta > 0 ? "+" : ""}{historyTrendDelta.toFixed(1)}% overall)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyPoints} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="snapshotDate"
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={(val: string) => {
                      const d = new Date(val);
                      return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#6B7280"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(26,26,26,0.95)", border: "1px solid #333", borderRadius: "8px" }}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" })}
                    formatter={(value: number) => [`${value}%`, "Readiness"]}
                  />
                  <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: "85% Target", fill: "#f59e0b", fontSize: 11, position: "right" }} />
                  <Line type="monotone" dataKey="readyPercent" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} name="Readiness %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6" data-testid="card-icc-power-law">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Item Characteristic Curves (ICC)
              </CardTitle>
              <CardDescription className="mt-1">
                Compare how different performance metrics develop across skill levels over time in role
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowIccFormulaModal(true)}
                className="px-3 py-2 rounded-lg text-sm font-mono border border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-blue-300 hover:text-blue-200 cursor-pointer"
                data-testid="button-icc-formula"
              >
                View Formula
              </button>
              <Select value={iccMetric} onValueChange={setIccMetric}>
                <SelectTrigger className="w-[200px]" data-testid="select-icc-metric">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assessmentsPassed">Assessments Passed</SelectItem>
                  <SelectItem value="totalFlightHours">Total Flight Hours</SelectItem>
                  <SelectItem value="activeQualifications">Active Qualifications</SelectItem>
                  <SelectItem value="averageScore">Average Score</SelectItem>
                  <SelectItem value="cargoWeight">Cargo Weight Handled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingIcc ? (
            <div className="h-[400px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : iccData?.curves && iccData.curves.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground font-medium mr-1">Show:</span>
                {iccData.curves.map((curve) => {
                  const isOn = iccSquadronToggles[curve.squadron] !== false;
                  return (
                    <button
                      key={curve.squadron}
                      onClick={() => {
                        const activeCount = Object.values(iccSquadronToggles).filter(Boolean).length;
                        if (isOn && activeCount <= 1) return;
                        setIccSquadronToggles(prev => ({ ...prev, [curve.squadron]: !isOn }));
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                        isOn
                          ? 'bg-gray-800 border-gray-600 text-gray-200'
                          : 'bg-gray-900/60 border-gray-800 text-gray-600 line-through'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isOn ? curve.color : '#4B5563' }}
                      />
                      {curve.squadron}
                    </button>
                  );
                })}
              </div>

              <div className="h-[400px] w-full" data-testid="icc-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="year" 
                      type="number"
                      domain={[0, 12]}
                      tickCount={13}
                      label={{ value: 'Time in Role (Years)', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
                      stroke="#6B7280"
                    />
                    <YAxis 
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      label={{ value: iccData.metricLabel, angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                      stroke="#6B7280"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        `${(value * 100).toFixed(1)}%`,
                        name
                      ]}
                      labelFormatter={(label) => `Year ${label} in Role`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    {iccData.curves.filter(curve => iccSquadronToggles[curve.squadron] !== false).map((curve, index) => (
                      <Line
                        key={curve.squadron}
                        data={curve.dataPoints}
                        type="monotone"
                        dataKey="normalizedValue"
                        name={curve.squadron}
                        stroke={curve.color}
                        strokeWidth={3}
                        dot={{ r: 4, fill: curve.color, strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-primary">Horizontal Axis: Time in Role</h4>
                    <p className="text-xs text-muted-foreground">
                      Left (0 years) to right (12+ years). Shows how personnel at different experience levels perform. 
                      Career progression stages visible from entry-level to senior loadmasters.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-primary">Vertical Axis: {iccData.metricLabel}</h4>
                    <p className="text-xs text-muted-foreground">
                      0% = entry level, 100% = maximum expected performance. 
                      S-curve shape indicates power law learning distribution - steep growth mid-career, plateau at expertise.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {iccData.insights && iccData.insights.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    What These Curves Tell Us About Your Workforce
                  </h4>
                  <div className="space-y-2">
                    {iccData.insights.map((insight, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          insight.type === 'strength' 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : insight.type === 'challenge'
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : 'bg-blue-500/10 border border-blue-500/30'
                        }`}
                      >
                        <span className={`text-lg ${
                          insight.type === 'strength' ? 'text-green-500' : 
                          insight.type === 'challenge' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {insight.type === 'strength' ? '●' : insight.type === 'challenge' ? '●' : '●'}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{insight.title}</p>
                          <p className="text-xs text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-8 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <span>Total Personnel: {iccData.summary?.totalUsers || 0}</span>
                <span>Squadrons: {iccData.summary?.squadronsIncluded || 0}</span>
                <span>Tenure Range: {Math.floor((iccData.summary?.tenureRange?.min || 0) / 12)} - {Math.floor((iccData.summary?.tenureRange?.max || 0) / 12)} years</span>
              </div>

              {showIccFormulaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowIccFormulaModal(false)}>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                  <div 
                    className="relative bg-slate-900/60 border border-slate-700/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
                    style={{
                      backdropFilter: 'blur(10px)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderColor: 'rgba(71, 85, 105, 0.5)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white mb-2">ICC Power Law Distribution</h2>
                          <p className="text-sm text-blue-300">
                            ✨ <strong>Why This Matters:</strong> This chart reveals hidden patterns in how your workforce develops skills over time, helping you predict performance trajectories and identify optimal training windows for each career stage.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowIccFormulaModal(false)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-400" />
                          What It Does
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          The ICC (Item Characteristic Curve) Power Law Distribution chart models how performance metrics evolve across your workforce as personnel gain experience. It combines actual performance data with a sigmoid (S-curve) function to create smooth, realistic learning trajectories that match real-world skill development patterns.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-400" />
                          What It Shows
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">•</span>
                            <span><strong>Career Stage Performance:</strong> How different experience levels (0-12 years) perform on key metrics</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">•</span>
                            <span><strong>Squadron Comparison:</strong> Color-coded lines for each squadron show comparative performance trajectories</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">•</span>
                            <span><strong>Growth Periods:</strong> Steep curves indicate rapid skill acquisition; plateau regions show expertise stabilization</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">•</span>
                            <span><strong>Selectible Metrics:</strong> Switch between Assessments Passed, Flight Hours, Qualifications, Scores, and Cargo Weight</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Award className="h-5 w-5 text-blue-400" />
                          Why It's Useful
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                          <li className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <span><strong>Workforce Planning:</strong> Predict when personnel will reach peak performance and plan succession</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <span><strong>Training Optimization:</strong> Identify the critical learning window (usually years 2-5) for targeted training investment</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <span><strong>Squadron Benchmarking:</strong> Compare squadron trajectories to identify best practices and improvement areas</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <span><strong>Performance Prediction:</strong> Estimate how new personnel will develop compared to historical patterns</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-green-400 mt-1">✓</span>
                            <span><strong>Data-Driven Decisions:</strong> Base promotion, assignment, and retention decisions on statistically validated learning curves</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-white mb-3">Mathematical Formula</h4>
                        <div className="space-y-2 font-mono text-xs text-slate-300">
                          <div className="text-center text-blue-300">Y = 0.6 × (M/M<sub>max</sub>) + 0.4 × σ(t)</div>
                          <div className="text-center text-blue-300">σ(t) = 1 / (1 + e<sup>-0.8(x-5)</sup>)</div>
                          <div className="text-slate-400 text-[10px] mt-3 text-center leading-relaxed">
                            Y = final curve value • M = actual metric value • M<sub>max</sub> = maximum expected value • σ(t) = logistic sigmoid function • k = 0.8 (steepness) • x₀ = 5 (midpoint in years)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                      <button
                        onClick={() => setShowIccFormulaModal(false)}
                        className="w-full py-2 px-4 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <p>No ICC data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Non-Readiness Breakdown</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Click a bar to see who belongs to each category</p>
        </CardHeader>
        <CardContent>
          {readinessData?.reasonBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {readinessData.reasonBreakdown.map((r: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedReason(r.reason)}
                  className="w-full flex items-center gap-3 group text-left focus:outline-none"
                >
                  <div className="w-40 text-sm text-gray-300 truncate group-hover:text-white transition-colors">{r.reason}</div>
                  <div className="flex-1 relative">
                    <Progress value={r.percent} className="h-3 group-hover:opacity-80 transition-opacity" />
                  </div>
                  <div className="w-20 text-right text-sm text-gray-400 group-hover:text-gray-200 transition-colors whitespace-nowrap">
                    {r.count} ({r.percent}%)
                  </div>
                  <div className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">▸</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No non-readiness factors identified.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Squadron Readiness vs 85% Target</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {squadrons.map((sq: any) => (
              <div key={sq.squadron} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-300">{sq.squadron}SQN</div>
                <div className="flex-1 relative">
                  <Progress value={sq.readyPercent} className={`h-5 ${sq.readyPercent >= 85 ? '[&>div]:bg-green-500' : '[&>div]:bg-orange-500'}`} />
                  <div className="absolute top-0 h-5 border-l-2 border-dashed border-white/50" style={{ left: "85%" }}>
                    <span className="absolute -top-5 -left-2 text-[10px] text-gray-400">85%</span>
                  </div>
                </div>
                <div className={`w-12 text-right text-sm font-medium ${getReadinessColor(sq.readyPercent)}`}>{sq.readyPercent}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">At-Risk Personnel</CardTitle>
            {atRiskList.length > 0 && (
              <span className="text-xs text-gray-500">
                {atRiskList.length} total — page {atRiskPage + 1} of {Math.max(1, totalPages)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {atRiskList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333] text-gray-400">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Squadron</th>
                      <th className="text-left py-2 px-2">Risk Level</th>
                      <th className="text-left py-2 px-2">Days Inactive</th>
                      <th className="text-left py-2 px-2">Top Risk Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAtRisk.map((s: any, i: number) => {
                      const daysInactive = s.daysSinceActivity ?? null;
                      const daysColor = daysInactive === null ? "text-gray-500" :
                        daysInactive > 14 ? "text-red-400" :
                        daysInactive > 7 ? "text-amber-400" : "text-green-400";
                      return (
                        <tr key={i} className="border-b border-[#222] hover:bg-[#222]">
                          <td className="py-2 px-2 text-white">{s.name || s.email}</td>
                          <td className="py-2 px-2 text-gray-300">{s.squadron || "—"}</td>
                          <td className="py-2 px-2">
                            <Badge variant="outline" className={
                              s.riskLevel === "high" ? "border-red-500 text-red-400" :
                              s.riskLevel === "medium" ? "border-amber-500 text-amber-400" :
                              "border-yellow-500 text-yellow-400"
                            }>{s.riskLevel}</Badge>
                          </td>
                          <td className={`py-2 px-2 text-sm font-medium ${daysColor}`}>
                            {daysInactive !== null ? `${daysInactive}d` : "—"}
                          </td>
                          <td className="py-2 px-2 text-gray-400 text-xs">{s.topRiskFactor || s.riskFactors?.[0] || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333]">
                  <button
                    onClick={() => setAtRiskPage(p => Math.max(0, p - 1))}
                    disabled={atRiskPage === 0}
                    className="px-3 py-1 text-xs rounded border border-[#444] text-gray-400 hover:text-white hover:border-[#666] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setAtRiskPage(i)}
                        className={`w-6 h-6 text-xs rounded transition-colors ${
                          i === atRiskPage
                            ? "bg-orange-500 text-white"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setAtRiskPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={atRiskPage === totalPages - 1}
                    className="px-3 py-1 text-xs rounded border border-[#444] text-gray-400 hover:text-white hover:border-[#666] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No at-risk personnel identified.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function QualificationsTab({ currencyData, forecastData, readinessData }: { currencyData: any; forecastData: any; readinessData: any }) {
  const [selectedCriticalAlert, setSelectedCriticalAlert] = useState<any>(null);
  const summary = currencyData?.summary;
  const squadrons = (readinessData?.bySquadron || []).filter((s: any) => s.squadron !== "AMG");
  const perSquadronCurrency = (currencyData?.bySquadron || []).filter((s: any) => s.squadron !== "AMG");

  const totalQuals = summary ? (summary.current + summary.expiring30Days + summary.expiring60Days + summary.expiring90Days + summary.expired) : 0;
  const currencyBars = totalQuals > 0 ? [
    { label: "Expired", count: summary?.expired || 0, pct: Math.round(((summary?.expired || 0) / totalQuals) * 100), color: "bg-red-500" },
    { label: "30 days", count: summary?.expiring30Days || 0, pct: Math.round(((summary?.expiring30Days || 0) / totalQuals) * 100), color: "bg-orange-500" },
    { label: "60 days", count: summary?.expiring60Days || 0, pct: Math.round(((summary?.expiring60Days || 0) / totalQuals) * 100), color: "bg-amber-500" },
    { label: "90 days", count: summary?.expiring90Days || 0, pct: Math.round(((summary?.expiring90Days || 0) / totalQuals) * 100), color: "bg-yellow-500" },
    { label: "Current", count: summary?.current || 0, pct: Math.round(((summary?.current || 0) / totalQuals) * 100), color: "bg-green-500" },
  ] : [];

  const monthlyForecast = (forecastData?.forecast || []).map((f: any) => ({
    month: f.monthLabel || f.month,
    count: f.expiringThisMonth || 0,
    personnelAffected: f.personnelAffected || 0,
  }));
  const peakMonth = monthlyForecast.reduce((max: any, m: any) => (m.count > (max?.count || 0) ? m : max), null);

  return (
    <>
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Overall Currency Breakdown</CardTitle></CardHeader>
        <CardContent>
          {currencyBars.length > 0 ? (
            <>
              <div className="flex w-full h-8 rounded-lg overflow-hidden mb-3">
                {currencyBars.map((b) => (
                  b.pct > 0 && <div key={b.label} className={`${b.color} flex items-center justify-center text-xs text-white font-medium`} style={{ width: `${b.pct}%` }}>
                    {b.pct >= 5 ? `${b.count}` : ""}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                {currencyBars.map((b) => (
                  <span key={b.label} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded-sm ${b.color}`}></span>
                    {b.label}: {b.count} ({b.pct}%)
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No currency data available.</p>
          )}
        </CardContent>
      </Card>

      {perSquadronCurrency.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader><CardTitle className="text-white text-lg">Per-Squadron Currency</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {perSquadronCurrency.map((sq: any) => {
                const sqTotal = sq.total || ((sq.current || 0) + (sq.expiring || 0) + (sq.expired || 0));
                if (sqTotal === 0) return null;
                return (
                  <div key={sq.squadron}>
                    <div className="text-sm text-gray-300 mb-1">{sq.squadron}SQN</div>
                    <div className="flex w-full h-5 rounded overflow-hidden">
                      {sq.expired > 0 && <div className="bg-red-500 flex items-center justify-center text-[10px] text-white" style={{ width: `${(sq.expired / sqTotal) * 100}%` }}>{sq.expired}</div>}
                      {sq.expiring > 0 && <div className="bg-orange-500 flex items-center justify-center text-[10px] text-white" style={{ width: `${(sq.expiring / sqTotal) * 100}%` }}>{sq.expiring}</div>}
                      {sq.current > 0 && <div className="bg-green-500 flex items-center justify-center text-[10px] text-white" style={{ width: `${(sq.current / sqTotal) * 100}%` }}>{sq.current}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(() => {
        if (!peakMonth || !peakMonth.month || peakMonth.count <= 0) return null;
        const peakMonthStr = peakMonth.month;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        let peakDate: Date | null = null;
        for (let offset = 0; offset < 12; offset++) {
          const candidate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
          const label = monthNames[candidate.getMonth()];
          const labelFull = candidate.toLocaleDateString("en-AU", { month: "short" });
          if (peakMonthStr.includes(label) || peakMonthStr.includes(labelFull) || peakMonthStr.includes(candidate.toLocaleDateString("en-AU", { month: "long" }))) {
            peakDate = candidate;
            break;
          }
        }
        if (!peakDate) return null;
        const daysUntilPeak = Math.floor((peakDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilPeak > 60) return null;

        return (
          <Card className="bg-amber-500/10 border-amber-500/40">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">Peak Renewal Month Approaching</p>
                  <p className="text-sm text-gray-300 mt-0.5">
                    {peakMonthStr} has {peakMonth.count} qualification{peakMonth.count > 1 ? "s" : ""} due for renewal — the highest of any upcoming month.
                    {daysUntilPeak <= 30
                      ? " This is less than 30 days away. Initiate renewal scheduling immediately."
                      : ` This is approximately ${daysUntilPeak} days away. Begin scheduling renewal training now to avoid readiness gaps.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Upcoming Currency Renewals</CardTitle></CardHeader>
        <CardContent>
          {monthlyForecast.length > 0 ? (
            <div className="space-y-2">
              {monthlyForecast.map((m: any, i: number) => {
                const maxCount = Math.max(...monthlyForecast.map((x: any) => x.count), 1);
                const isPeak = m === peakMonth;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-gray-300">{m.month}</div>
                    <div className="flex-1">
                      <div className={`h-5 rounded ${isPeak ? "bg-amber-500" : "bg-blue-500/70"}`} style={{ width: `${(m.count / maxCount) * 100}%` }}></div>
                    </div>
                    <div className={`w-10 text-right text-sm ${isPeak ? "text-amber-400 font-bold" : "text-gray-400"}`}>{m.count}</div>
                    {isPeak && <Badge className="bg-amber-500/20 text-amber-400 text-xs">Peak</Badge>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No forecast data available.</p>
          )}
        </CardContent>
      </Card>

      {forecastData?.criticalAlerts?.length > 0 && (
        <>
          <Card className="bg-[#1a1a1a] border-[#333] border-red-500/30">
            <CardHeader><CardTitle className="text-red-400 text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Critical Alerts</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {forecastData.criticalAlerts.map((rawAlert: any, i: number) => {
                  let parsed = rawAlert;
                  if (typeof rawAlert === 'string') {
                    try { parsed = JSON.parse(rawAlert); } catch { parsed = { alert: rawAlert }; }
                  } else if (typeof rawAlert?.alert === 'string' && rawAlert.alert.trim().startsWith('{')) {
                    try { parsed = JSON.parse(rawAlert.alert); } catch {}
                  }
                  const month: string = parsed?.month || rawAlert?.month || '';
                  const alertText: string = parsed?.alert || rawAlert?.alert || rawAlert?.message || rawAlert?.text || String(rawAlert);
                  const personnel: any[] = parsed?.personnel || rawAlert?.personnel || [];
                  const hasPersonnel = personnel.length > 0;
                  return (
                    <button
                      key={i}
                      onClick={() => hasPersonnel ? setSelectedCriticalAlert({ month, text: alertText, personnel }) : undefined}
                      className={`w-full text-left rounded-lg border border-red-500/25 bg-red-950/20 overflow-hidden ${hasPersonnel ? "cursor-pointer hover:bg-red-950/40 transition-colors" : "cursor-default"}`}
                    >
                      {month && (
                        <div className="px-3 py-1.5 bg-red-900/30 border-b border-red-500/20 flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">{month}</span>
                        </div>
                      )}
                      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-200 leading-snug">{alertText}</span>
                        </div>
                        {hasPersonnel && <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedCriticalAlert && (
            <Dialog open={!!selectedCriticalAlert} onOpenChange={() => setSelectedCriticalAlert(null)}>
              <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-red-400 text-base font-semibold">{selectedCriticalAlert.text}</DialogTitle>
                  <DialogDescription className="text-gray-500 text-xs">
                    <span className="text-orange-400 uppercase font-medium">CRITICAL</span> — {selectedCriticalAlert.month} · {selectedCriticalAlert.personnel.length} qualification{selectedCriticalAlert.personnel.length !== 1 ? "s" : ""} affected
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2">
                  <div className="rounded border border-[#333] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#222] text-gray-400 text-xs">
                          <th className="text-left px-3 py-2">Personnel</th>
                          <th className="text-left px-3 py-2">Squadron</th>
                          <th className="text-left px-3 py-2">Qualification</th>
                          <th className="text-right px-3 py-2">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCriticalAlert.personnel.map((p: any, idx: number) => (
                          <tr key={idx} className="border-t border-[#2a2a2a] hover:bg-[#1e1e1e]">
                            <td className="px-3 py-2 text-white font-medium">{p.name || "—"}</td>
                            <td className="px-3 py-2 text-gray-400">{p.squadron ? (p.squadron.includes("SQN") ? p.squadron : `${p.squadron}SQN`) : "—"}</td>
                            <td className="px-3 py-2 text-gray-300">{p.qualification || "—"}</td>
                            <td className="px-3 py-2 text-right text-orange-400">{p.expiryDate || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#333]">
                  <Button variant="outline" size="sm" onClick={() => {
                    let txt = `CRITICAL ALERT DETAIL\n${"=".repeat(60)}\n`;
                    txt += `Alert: ${selectedCriticalAlert.text}\nMonth: ${selectedCriticalAlert.month}\nGenerated: ${new Date().toLocaleString("en-AU")}\n\n`;
                    txt += `PERSONNEL AFFECTED (${selectedCriticalAlert.personnel.length})\n${"-".repeat(40)}\n`;
                    selectedCriticalAlert.personnel.forEach((p: any, i: number) => {
                      txt += `${i + 1}. ${p.name} — ${p.squadron} | ${p.qualification} | Expires: ${p.expiryDate}\n`;
                    });
                    downloadText(txt, `critical-alert-${new Date().toISOString().slice(0, 10)}.txt`);
                  }} className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]">
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]">
                    <Printer className="h-4 w-4 mr-1.5" /> Print
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </>
  );
}

function TrainingTab({ squadronPerfData, submissionsData, topicData, weakestTopic, kpis, currencyData, readinessData }: any) {
  const squadronAvgs = useMemo(() => {
    if (!squadronPerfData || !Array.isArray(squadronPerfData)) return [];
    const sqMap: Record<string, { total: number; count: number }> = {};
    squadronPerfData.forEach((s: any) => {
      const sq = s.squadron;
      if (!sq || sq === "AMG") return;
      if (!sqMap[sq]) sqMap[sq] = { total: 0, count: 0 };
      sqMap[sq].total += (s.studentAverage || 0);
      sqMap[sq].count += 1;
    });
    return Object.entries(sqMap).map(([sq, v]) => ({
      name: sq.includes("SQN") ? sq : `${sq}SQN`,
      rawName: sq,
      avg: v.count > 0 ? Math.round(v.total / v.count) : 0,
    }));
  }, [squadronPerfData]);

  const overallAvg = squadronAvgs.length > 0
    ? Math.round(squadronAvgs.reduce((sum: number, s: any) => sum + s.avg, 0) / squadronAvgs.length)
    : 0;

  const maxScore = Math.max(...squadronAvgs.map((s: any) => s.avg), 100);

  const belowAvgSquadrons = squadronAvgs.filter((sq: any) => sq.avg < overallAvg);

  const getSquadronFactors = (sq: any) => {
    const factors: { label: string; value: string; concern: boolean }[] = [];
    const sqKey = sq.rawName;

    factors.push({
      label: "Training Score",
      value: `${sq.avg}% (avg: ${overallAvg}%, gap: ${overallAvg - sq.avg}pp)`,
      concern: true,
    });

    const readinessSq = (readinessData?.bySquadron || []).find(
      (r: any) => r.squadron === sqKey || r.squadron === sq.name || `${r.squadron}SQN` === sq.name
    );
    if (readinessSq) {
      const rPct = readinessSq.readyPercent ?? 0;
      factors.push({
        label: "Operational Readiness",
        value: `${rPct}% flight-ready (${readinessSq.ready ?? '?'}/${readinessSq.total ?? '?'} personnel)`,
        concern: rPct < 85,
      });
    }

    const currencySq = (currencyData?.bySquadron || []).find(
      (c: any) => c.squadron === sqKey || c.squadron === sq.name || `${c.squadron}SQN` === sq.name
    );
    if (currencySq) {
      const expiredCount = currencySq.expired ?? 0;
      const expiring30 = currencySq.expiring30Days ?? 0;
      const total = currencySq.total ?? 1;
      const currentPct = total > 0 ? Math.round(((currencySq.current ?? 0) / total) * 100) : 0;
      factors.push({
        label: "Qualification Currency",
        value: `${currentPct}% current${expiredCount > 0 ? ` — ${expiredCount} expired` : ''}${expiring30 > 0 ? `, ${expiring30} expiring within 30 days` : ''}`,
        concern: expiredCount > 0 || expiring30 > 2,
      });
    }

    const sqSubmissions = (submissionsData || []).filter(
      (s: any) => s.squadron === sqKey || s.squadron === sq.name || `${s.squadron}SQN` === sq.name
    );
    if (sqSubmissions.length > 0) {
      const totalSubs = sqSubmissions.length;
      const reviewed = sqSubmissions.filter((s: any) => s.status === 'reviewed').length;
      const pending = totalSubs - reviewed;
      if (pending > 0) {
        factors.push({
          label: "Unreviewed Submissions",
          value: `${pending} submission${pending > 1 ? 's' : ''} awaiting instructor review`,
          concern: pending > 2,
        });
      }
    }

    if (weakestTopic) {
      const mastery = weakestTopic.masteryPercentage ?? weakestTopic.avgScore ?? 0;
      factors.push({
        label: "Weakest Training Topic",
        value: `${weakestTopic.category} — ${Math.round(mastery)}% mastery (force-wide)`,
        concern: mastery < 60,
      });
    }

    return factors;
  };

  return (
    <>
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Squadron Performance Comparison</CardTitle></CardHeader>
        <CardContent>
          {squadronAvgs.length > 0 ? (
            <div className="space-y-3">
              {squadronAvgs.map((sq: any) => (
                <div key={sq.name} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-300">{sq.name}</div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-[#222] rounded h-6">
                      <div
                        className={`h-6 rounded ${sq.avg >= overallAvg ? "bg-blue-500" : "bg-orange-500"}`}
                        style={{ width: `${(sq.avg / maxScore) * 100}%` }}
                      />
                    </div>
                    {overallAvg > 0 && (
                      <div className="absolute top-0 h-6 border-l-2 border-dashed border-white/40" style={{ left: `${(overallAvg / maxScore) * 100}%` }}>
                        <span className="absolute -top-5 -left-4 text-[10px] text-gray-400">Avg {overallAvg}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-200">{sq.avg}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No squadron performance data.</p>
          )}
        </CardContent>
      </Card>

      {belowAvgSquadrons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">Below-Average Squadron Analysis</h3>
          </div>
          {belowAvgSquadrons.map((sq: any) => {
            const factors = getSquadronFactors(sq);
            return (
              <Card key={sq.name} className="bg-[#1a1a1a] border-orange-500/40">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-400 text-base">{sq.name} — Contributing Factors</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">Performing {overallAvg - sq.avg}pp below squadron average. Factors that may be contributing:</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {factors.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-3 py-2.5 border ${
                          f.concern
                            ? 'bg-red-950/20 border-red-500/25'
                            : 'bg-[#222] border-[#333]'
                        }`}
                      >
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${f.concern ? 'text-red-400' : 'text-gray-400'}`}>
                          {f.label}
                        </div>
                        <div className="text-sm text-gray-200">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className={`text-3xl font-bold ${kpis.quizPassRate >= 70 ? "text-green-400" : "text-red-400"}`}>{kpis.quizPassRate}%</div>
            <div className="text-sm text-gray-400 mt-1">Quiz Pass Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
            <div className={`text-3xl font-bold ${kpis.scenarioPassRate >= 70 ? "text-green-400" : "text-red-400"}`}>{kpis.scenarioPassRate}%</div>
            <div className="text-sm text-gray-400 mt-1">Scenario Pass Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            {weakestTopic ? (
              <>
                <div className="text-xl font-bold text-amber-400">{weakestTopic.category}</div>
                <div className="text-sm text-gray-400 mt-1">Weakest Topic — {Math.round(weakestTopic.avgScore)}%</div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-gray-500">N/A</div>
                <div className="text-sm text-gray-400 mt-1">Weakest Topic</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function buildSafetyRecommendations(data: any, periodMonths: number): { priority: 'critical' | 'high' | 'medium' | 'low'; title: string; body: string; action: string }[] {
  if (!data) return [];
  const recs: { priority: 'critical' | 'high' | 'medium' | 'low'; title: string; body: string; action: string }[] = [];

  const totalIncidents = data.byType?.incident ?? 0;
  const major = data.bySeverity?.major ?? 0;
  const moderate = data.bySeverity?.moderate ?? 0;
  const trainFail = data.byType?.training_failure ?? 0;
  const openCount = data.byStatus?.open ?? 0;
  const factors: any[] = data.topContributingFactors || [];
  const squadrons: any[] = (data.bySquadron || []).filter((s: any) => s.squadron !== "AMG");

  if (major > 0) {
    recs.push({ priority: 'critical', title: `${major} Major Incident${major > 1 ? 's' : ''} in Period`, body: `${major} major safety incident${major > 1 ? 's were' : ' was'} recorded in the last ${periodMonths} months. Major incidents indicate potential for significant harm or mission impact and require senior leadership attention.`, action: 'Conduct safety stand-down. Ensure all major incidents have formal investigation reports and corrective actions assigned.' });
  }

  if (openCount > 0) {
    recs.push({ priority: major > 0 ? 'high' : 'medium', title: `${openCount} Open Safety Report${openCount > 1 ? 's' : ''} Unresolved`, body: `${openCount} safety report${openCount > 1 ? 's remain' : ' remains'} in open status for this period. Open items represent unresolved safety risks.`, action: 'Review all open items and assign responsible officers with target closure dates.' });
  }

  if (moderate >= 2) {
    recs.push({ priority: 'high', title: `Elevated Moderate Incident Rate`, body: `${moderate} moderate-severity incident${moderate > 1 ? 's' : ''} occurred in the last ${periodMonths} months. Moderate incidents often precede more serious events if systemic causes are not addressed.`, action: 'Review each moderate incident for common root causes and update relevant procedures or training.' });
  }

  if (factors.length > 0 && factors[0].incidents > 0) {
    const top = factors[0];
    recs.push({ priority: top.incidents >= 3 ? 'high' : 'medium', title: `Primary Safety Factor: ${top.factor}`, body: `"${top.factor}" is the most frequently cited contributing factor this period, appearing in ${top.incidents} incident${top.incidents > 1 ? 's' : ''}, ${top.observations} observation${top.observations > 1 ? 's' : ''}, and ${top.trainingFailures} training failure${top.trainingFailures > 1 ? 's' : ''} (${top.total} total reports).`, action: `Prioritise a dedicated review of ${top.factor.toLowerCase()} procedures. Consider a targeted refresher briefing for all loadmasters.` });
  }

  if (factors.length > 1 && factors[1].incidents > 0) {
    const second = factors[1];
    recs.push({ priority: second.incidents >= 2 ? 'medium' : 'low', title: `Secondary Safety Factor: ${second.factor}`, body: `"${second.factor}" is the second most common factor, with ${second.total} total reports including ${second.incidents} incident${second.incidents > 1 ? 's' : ''} this period.`, action: `Schedule ${second.factor.toLowerCase()} awareness review at the next safety brief.` });
  }

  if (squadrons.length > 0) {
    const topSqn = [...squadrons].sort((a, b) => (b.incidents || 0) - (a.incidents || 0))[0];
    const avgInc = squadrons.reduce((s, sq) => s + (sq.incidents || 0), 0) / squadrons.length;
    if (topSqn.incidents > avgInc * 1.5 && topSqn.incidents >= 2) {
      recs.push({ priority: 'medium', title: `${topSqn.squadron}SQN — Elevated Incident Rate`, body: `${topSqn.squadron}SQN recorded ${topSqn.incidents} incident${topSqn.incidents > 1 ? 's' : ''} this period — ${Math.round(((topSqn.incidents - avgInc) / avgInc) * 100)}% above the squadron average of ${avgInc.toFixed(1)}. Targeted attention is recommended.`, action: `Engage ${topSqn.squadron}SQN flight safety rep for a focused debrief. Review any common crew or mission type patterns.` });
    }
  }

  if (trainFail >= 3) {
    recs.push({ priority: 'medium', title: `Training Compliance Failures`, body: `${trainFail} training failure${trainFail > 1 ? 's' : ''} recorded this period. Repeated training failures indicate gaps between current training content and operational requirements.`, action: 'Review training material currency and scheduling compliance. Identify if failures share a common topic or squadron.' });
  }

  const nightFactor = factors.find((f: any) => f.factor === 'Night Operations');
  if (nightFactor && nightFactor.incidents >= 2) {
    recs.push({ priority: 'medium', title: 'Night Operations Safety Pattern', body: `Night operations have been cited as a contributing factor in ${nightFactor.incidents} incidents and ${nightFactor.observations} observations this period. Low-visibility operations consistently carry elevated risk.`, action: 'Review night operations SOPs and ensure all loadmasters have current night currency. Consider additional simulator training.' });
  }

  const fatigueFactor = factors.find((f: any) => f.factor === 'Crew Fatigue');
  if (fatigueFactor && fatigueFactor.total >= 2) {
    recs.push({ priority: 'medium', title: 'Crew Fatigue Risk Pattern', body: `Crew fatigue appears as a contributing factor in ${fatigueFactor.total} reports this period (${fatigueFactor.incidents} incident${fatigueFactor.incidents > 1 ? 's' : ''}, ${fatigueFactor.observations} observation${fatigueFactor.observations > 1 ? 's' : ''}). Fatigue is a leading contributor to loadmaster errors.`, action: 'Audit scheduling practices for duty period compliance. Ensure fatigue risk assessments are completed before night or extended operations.' });
  }

  if (totalIncidents === 0 && trainFail === 0) {
    recs.push({ priority: 'low', title: 'Strong Safety Performance This Period', body: `No incidents or training failures recorded in the last ${periodMonths} months. Continued proactive reporting culture is evident.`, action: 'Maintain current safety culture. Consider recognising individual commendation contributors.' });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

function SafetyTab({ safetyData }: { safetyData: any }) {
  const safetyScore = safetyData?.safetyScore ?? 0;
  const openIncidents = (safetyData?.openItems || []).filter((i: any) => i.severity === "major" || i.severity === "moderate");
  const monthlySummary = safetyData?.monthlyTrend || [];
  const bySquadron = safetyData?.bySquadron?.filter((s: any) => s.squadron !== "AMG") || [];

  const [recPeriod, setRecPeriod] = useState<'3' | '6' | '12'>('6');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [periodData, setPeriodData] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  useEffect(() => {
    setPeriodLoading(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - parseInt(recPeriod), now.getDate());
    fetch(`/api/analytics/safety-summary?startDate=${start.toISOString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setPeriodData(d); setPeriodLoading(false); })
      .catch(() => setPeriodLoading(false));
  }, [recPeriod]);

  const recommendations = useMemo(() => buildSafetyRecommendations(periodData, parseInt(recPeriod)), [periodData, recPeriod]);

  const gaugeAngle = (safetyScore / 100) * 180;

  const priorityConfig = {
    critical: { color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-950/20', badge: 'bg-red-500/20 text-red-400 border-red-500/40' },
    high: { color: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-950/20', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
    medium: { color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/10', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    low: { color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-950/10', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  };

  return (
    <>
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Safety Score</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 110" className="w-48 h-28">
              <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#333" strokeWidth="12" strokeLinecap="round" />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke={safetyScore >= 80 ? "#22c55e" : safetyScore >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(gaugeAngle / 180) * 283} 283`}
              />
              <text x="100" y="85" textAnchor="middle" className="text-3xl font-bold" fill="white" fontSize="28">{safetyScore}</text>
              <text x="100" y="105" textAnchor="middle" fill="#999" fontSize="11">{getSafetyLabel(safetyScore)}</text>
            </svg>
            <p className="text-xs text-gray-500 mt-1">All-time force-wide composite score</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Safety Issue Recommendations
            </CardTitle>
            <Select value={recPeriod} onValueChange={(v: any) => setRecPeriod(v)}>
              <SelectTrigger className="w-36 bg-[#222] border-[#444] text-gray-200 text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#222] border-[#444]">
                <SelectItem value="3" className="text-gray-200">Last 3 months</SelectItem>
                <SelectItem value="6" className="text-gray-200">Last 6 months</SelectItem>
                <SelectItem value="12" className="text-gray-200">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-500 mt-1">Rule-based analysis of safety data for the selected period. No AI involved.</p>
        </CardHeader>
        <CardContent>
          {periodLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analysing period data...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium text-sm">No Safety Issues Identified</p>
                <p className="text-gray-500 text-xs mt-0.5">All metrics are within acceptable thresholds for the last {recPeriod} months.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => {
                const cfg = priorityConfig[rec.priority];
                return (
                  <div key={i} className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>
                          {rec.priority === 'critical' || rec.priority === 'high' ? <AlertTriangle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-sm font-semibold ${cfg.color}`}>{rec.title}</span>
                            <Badge variant="outline" className={`text-xs px-1.5 py-0 border ${cfg.badge}`}>{rec.priority.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm text-gray-300 leading-snug">{rec.body}</p>
                          {rec.action && (
                            <p className="text-xs text-gray-400 italic mt-1.5 border-t border-white/5 pt-1.5">
                              <span className="text-gray-500 not-italic font-medium">Recommended action: </span>{rec.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-600 pt-1 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" />
                {(periodData?.summary?.total ?? 0)} total records analysed for the last {recPeriod}-month period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-400">{selectedIncident?.title || "Safety Incident"}</DialogTitle>
            <DialogDescription className="text-gray-500 text-xs">
              ID #{selectedIncident?.id} — {selectedIncident?.date ? new Date(selectedIncident.date).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" }) : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4 mt-2">
              {selectedIncident.description && (
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Description</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{selectedIncident.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Severity</p>
                  <Badge variant="outline" className={selectedIncident.severity === "major" ? "border-red-500 text-red-400" : "border-orange-500 text-orange-400"}>{selectedIncident.severity}</Badge>
                </div>
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <Badge variant="outline" className="border-amber-500 text-amber-400">{selectedIncident.status}</Badge>
                </div>
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Squadron</p>
                  <p className="text-gray-200">{selectedIncident.squadron || "—"}</p>
                </div>
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-gray-200">{selectedIncident.location || "—"}</p>
                </div>
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Aircraft Type</p>
                  <p className="text-gray-200">{selectedIncident.aircraftType || "—"}</p>
                </div>
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Flight Phase</p>
                  <p className="text-gray-200">{selectedIncident.flightPhase || "—"}</p>
                </div>
                {selectedIncident.safetyLevel && (
                  <div className="bg-[#222] rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Safety Risk Level</p>
                    <p className="text-gray-200">{selectedIncident.safetyLevel}</p>
                  </div>
                )}
              </div>
              {selectedIncident.contributingFactors && (
                <div className="bg-[#222] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Contributing Factors</p>
                  <p className="text-sm text-gray-200">{selectedIncident.contributingFactors}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#333]">
            <Button variant="outline" size="sm" onClick={() => {
              if (!selectedIncident) return;
              let content = `SAFETY INCIDENT REPORT\n${"=".repeat(60)}\n`;
              content += `Title: ${selectedIncident.title || "Incident"}\n`;
              content += `Date: ${selectedIncident.date ? new Date(selectedIncident.date).toLocaleDateString("en-AU") : "N/A"}\n`;
              content += `Severity: ${selectedIncident.severity || "N/A"}\nStatus: ${selectedIncident.status || "N/A"}\n`;
              content += `Squadron: ${selectedIncident.squadron || "N/A"}\nLocation: ${selectedIncident.location || "N/A"}\n`;
              content += `Aircraft: ${selectedIncident.aircraftType || "N/A"}\nFlight Phase: ${selectedIncident.flightPhase || "N/A"}\n`;
              if (selectedIncident.safetyLevel) content += `Safety Level: ${selectedIncident.safetyLevel}\n`;
              if (selectedIncident.description) content += `\nDescription:\n${selectedIncident.description}\n`;
              if (selectedIncident.contributingFactors) content += `\nContributing Factors:\n${selectedIncident.contributingFactors}\n`;
              content += `\nReport generated: ${new Date().toLocaleString("en-AU")}\n`;
              downloadText(content, `incident-report-${selectedIncident.id}-${new Date().toISOString().slice(0, 10)}.txt`);
            }} className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]">
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]">
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Open Incidents (Major & Moderate)</CardTitle>
          {openIncidents.length > 0 && <p className="text-xs text-gray-500 mt-0.5">Click a row to view full details</p>}
        </CardHeader>
        <CardContent>
          {openIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#333] text-gray-400">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Title</th>
                    <th className="text-left py-2 px-2">Squadron</th>
                    <th className="text-left py-2 px-2">Severity</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {openIncidents.map((inc: any, i: number) => (
                    <tr key={i} onClick={() => setSelectedIncident(inc)} className="border-b border-[#222] hover:bg-[#222] cursor-pointer">
                      <td className="py-2 px-2 text-gray-300 whitespace-nowrap">{inc.date ? new Date(inc.date).toLocaleDateString("en-AU") : "—"}</td>
                      <td className="py-2 px-2 text-gray-200 max-w-[200px] truncate">{inc.title || "—"}</td>
                      <td className="py-2 px-2 text-gray-300">{inc.squadron || "—"}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className={inc.severity === "major" ? "border-red-500 text-red-400" : "border-orange-500 text-orange-400"}>
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="border-amber-500 text-amber-400">{inc.status}</Badge>
                      </td>
                      <td className="py-2 px-2 text-gray-600"><ChevronRight className="h-4 w-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> No open major or moderate incidents.</p>
          )}
        </CardContent>
      </Card>

      {monthlySummary.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader><CardTitle className="text-white text-lg">Monthly Safety Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const maxVal = Math.max(...monthlySummary.map((m: any) => Math.max(m.incidents || 0, m.observations || 0, m.commendations || 0)), 1);
                return monthlySummary.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-14 text-gray-400 text-xs">{m.month}</div>
                    <div className="flex-1 relative h-5">
                      <div className="absolute inset-0 flex">
                        {(m.incidents || 0) > 0 && <div className="bg-red-500/70 h-full rounded-l" style={{ width: `${((m.incidents || 0) / maxVal) * 100}%` }} title={`${m.incidents} incidents`}></div>}
                        {(m.observations || 0) > 0 && <div className="bg-amber-500/70 h-full" style={{ width: `${((m.observations || 0) / maxVal) * 100}%` }} title={`${m.observations} observations`}></div>}
                        {(m.commendations || 0) > 0 && <div className="bg-green-500/70 h-full rounded-r" style={{ width: `${((m.commendations || 0) / maxVal) * 100}%` }} title={`${m.commendations} commendations`}></div>}
                        {(m.incidents || 0) === 0 && (m.observations || 0) === 0 && (m.commendations || 0) === 0 && (
                          <div className="flex items-center h-full text-xs text-gray-700 italic">no activity</div>
                        )}
                      </div>
                    </div>
                    <div className="w-28 text-xs text-gray-500 text-right">{m.incidents || 0}i / {m.observations || 0}o / {m.commendations || 0}c</div>
                  </div>
                ));
              })()}
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/70"></span> Incidents</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500/70"></span> Observations</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/70"></span> Commendations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {bySquadron.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Incidents by Squadron</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">All-time incident counts per squadron</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bySquadron.map((sq: any) => {
                const maxInc = Math.max(...bySquadron.map((s: any) => s.incidents || 0), 1);
                const total = (sq.incidents || 0) + (sq.observations || 0) + (sq.commendations || 0);
                return (
                  <div key={sq.squadron} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-sm text-gray-300">{sq.squadron}SQN</div>
                      <div className="flex-1 relative h-6">
                        <div className="w-full bg-[#222] rounded h-6"></div>
                        <div className="absolute top-0 left-0 bg-red-500/60 h-6 rounded" style={{ width: `${((sq.incidents || 0) / maxInc) * 100}%`, minWidth: sq.incidents > 0 ? "4px" : "0" }}></div>
                      </div>
                      <div className="w-8 text-right text-sm text-gray-400">{sq.incidents || 0}</div>
                    </div>
                    <div className="flex gap-3 pl-20 text-xs text-gray-600">
                      <span>{sq.observations || 0} observations</span>
                      <span className="text-green-700">{sq.commendations || 0} commendations</span>
                      <span>{sq.trainingFailures || 0} training failures</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
