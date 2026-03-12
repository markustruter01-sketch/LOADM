import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, Shield, Award, AlertTriangle, CheckCircle2, RefreshCw, Printer,
  TrendingUp, TrendingDown, Minus, Activity, Target, Plane, GraduationCap,
  AlertCircle, Loader2, ChevronRight
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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const sqParam = squadron === "ALL" ? "" : `squadron=${squadron.replace("SQN", "")}`;
      const [readinessRes, currencyRes, safetyRes, historyRes, forecastRes, atRiskRes, subsRes, topicRes, sqPerfRes, scenSubsRes] = await Promise.all([
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
      ]);

      const [readiness, currency, safety, history, forecast, atRisk, subs, topic, sqPerf, scenSubs] = await Promise.all([
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
    const highRiskCount = (atRiskData?.students || []).filter((s: any) => s.riskLevel === "high").length;

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
    };
  }, [readinessData, currencyData, safetyData, atRiskData, submissionsData, scenarioSubsData, historyData, dateRange]);

  const alerts = useMemo(() => {
    const items: { text: string; severity: "critical" | "high" | "medium" }[] = [];

    if (readinessData?.bySquadron) {
      readinessData.bySquadron.forEach((sq: any) => {
        if (sq.squadron !== "AMG" && sq.readyPercent < 70) {
          items.push({ text: `${sq.squadron}SQN readiness ${sq.readyPercent}% — below target`, severity: "critical" });
        } else if (sq.squadron !== "AMG" && sq.readyPercent < 85) {
          items.push({ text: `${sq.squadron}SQN readiness ${sq.readyPercent}% — approaching target`, severity: "medium" });
        }
      });
    }

    if (currencyData?.summary?.expired > 0) {
      items.push({ text: `${currencyData.summary.expired} expired qualification${currencyData.summary.expired > 1 ? "s" : ""} across force`, severity: "critical" });
    }
    if (kpis.expiring30 >= 5) {
      items.push({ text: `${kpis.expiring30} quals expiring within 30 days`, severity: "high" });
    }

    if (safetyData?.openItems) {
      const openMajor = safetyData.openItems.filter((i: any) => i.severity === "major");
      if (openMajor.length > 0) {
        items.push({ text: `${openMajor.length} open major incident${openMajor.length > 1 ? "s" : ""}`, severity: "critical" });
      }
    } else if (safetyData?.bySeverity?.major > 0 && safetyData?.byStatus?.open > 0) {
      items.push({ text: `${safetyData.bySeverity.major} major safety incident${safetyData.bySeverity.major > 1 ? "s" : ""} on record`, severity: "critical" });
    }

    if (kpis.highRiskCount > 0) {
      items.push({ text: `${kpis.highRiskCount} high-risk personnel identified`, severity: "high" });
    }

    items.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 };
      return order[a.severity] - order[b.severity];
    });

    return items;
  }, [readinessData, currencyData, safetyData, kpis]);

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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
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

          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {alerts.length === 0 ? (
                <div className="alert-chip flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm whitespace-nowrap">
                  <CheckCircle2 className="h-4 w-4" /> All systems nominal
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`alert-chip flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap border ${
                      alert.severity === "critical"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : alert.severity === "high"
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {alert.text}
                  </div>
                ))
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="print-expand">
            <TabsList className="bg-[#1a1a1a] border border-[#333] mb-4 no-print">
              <TabsTrigger value="readiness">Operational Readiness</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications & Currency</TabsTrigger>
              <TabsTrigger value="training">Training Performance</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
            </TabsList>

            <TabsContent value="readiness" className="print-expand space-y-4">
              <ReadinessTab readinessData={readinessData} atRiskData={atRiskData} />
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

function ReadinessTab({ readinessData, atRiskData }: { readinessData: any; atRiskData: any }) {
  const squadrons = (readinessData?.bySquadron || []).filter((s: any) => s.squadron !== "AMG");

  return (
    <>
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Squadron Battle-Board</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {squadrons.map((sq: any) => (
              <div
                key={sq.squadron}
                className={`rounded-xl p-4 border-2 ring-2 ${getReadinessBg(sq.readyPercent)} ${getReadinessRing(sq.readyPercent)}`}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300 mb-1">{sq.squadron}SQN</div>
                  <div className={`text-3xl font-bold ${getReadinessColor(sq.readyPercent)}`}>{sq.readyPercent}%</div>
                  <div className="text-xs text-gray-400 mt-1">{sq.ready} / {sq.total} ready</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Non-Readiness Breakdown</CardTitle></CardHeader>
        <CardContent>
          {readinessData?.reasonBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {readinessData.reasonBreakdown.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-40 text-sm text-gray-300 truncate">{r.reason}</div>
                  <div className="flex-1">
                    <Progress value={r.percent} className="h-3" />
                  </div>
                  <div className="w-16 text-right text-sm text-gray-400">{r.count} ({r.percent}%)</div>
                </div>
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
                  <Progress value={sq.readyPercent} className="h-5" />
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
        <CardHeader><CardTitle className="text-white text-lg">At-Risk Personnel</CardTitle></CardHeader>
        <CardContent>
          {(atRiskData?.students?.length > 0) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#333] text-gray-400">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Squadron</th>
                    <th className="text-left py-2 px-2">Risk Level</th>
                    <th className="text-left py-2 px-2">Top Risk Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskData.students.map((s: any, i: number) => (
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
                      <td className="py-2 px-2 text-gray-400 text-xs">{s.topRiskFactor || s.riskFactors?.[0] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No at-risk personnel identified.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function QualificationsTab({ currencyData, forecastData, readinessData }: { currencyData: any; forecastData: any; readinessData: any }) {
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

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">6-Month Renewal Forecast</CardTitle></CardHeader>
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
        <Card className="bg-[#1a1a1a] border-[#333] border-red-500/30">
          <CardHeader><CardTitle className="text-red-400 text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Critical Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {forecastData.criticalAlerts.map((alert: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{typeof alert === "string" ? alert : alert.message || alert.text || JSON.stringify(alert)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function TrainingTab({ squadronPerfData, submissionsData, topicData, weakestTopic, kpis }: any) {
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
      avg: v.count > 0 ? Math.round(v.total / v.count) : 0,
    }));
  }, [squadronPerfData]);

  const overallAvg = squadronAvgs.length > 0
    ? Math.round(squadronAvgs.reduce((sum: number, s: any) => sum + s.avg, 0) / squadronAvgs.length)
    : 0;

  const maxScore = Math.max(...squadronAvgs.map((s: any) => s.avg), 100);

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

function SafetyTab({ safetyData }: { safetyData: any }) {
  const safetyScore = safetyData?.safetyScore ?? 0;
  const openIncidents = (safetyData?.openItems || []).filter((i: any) => i.severity === "major" || i.severity === "moderate");
  const monthlySummary = safetyData?.monthlyTrend || [];
  const bySquadron = safetyData?.bySquadron?.filter((s: any) => s.squadron !== "AMG") || [];

  const gaugeAngle = (safetyScore / 100) * 180;

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
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader><CardTitle className="text-white text-lg">Open Incidents (Major & Moderate)</CardTitle></CardHeader>
        <CardContent>
          {openIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#333] text-gray-400">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Squadron</th>
                    <th className="text-left py-2 px-2">Severity</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openIncidents.map((inc: any, i: number) => (
                    <tr key={i} className="border-b border-[#222] hover:bg-[#222]">
                      <td className="py-2 px-2 text-gray-300">{inc.date ? new Date(inc.date).toLocaleDateString() : "—"}</td>
                      <td className="py-2 px-2 text-gray-300">{inc.squadron || "—"}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className={inc.severity === "major" ? "border-red-500 text-red-400" : "border-orange-500 text-orange-400"}>
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="border-amber-500 text-amber-400">{inc.status}</Badge>
                      </td>
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
              {monthlySummary.slice(-6).map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-16 text-gray-400">{m.month}</div>
                  <div className="flex-1 flex gap-1">
                    <div className="bg-red-500/70 h-4 rounded" style={{ width: `${(m.incidents || 0) * 20}px` }} title={`${m.incidents || 0} incidents`}></div>
                    <div className="bg-amber-500/70 h-4 rounded" style={{ width: `${(m.observations || 0) * 10}px` }} title={`${m.observations || 0} observations`}></div>
                    <div className="bg-green-500/70 h-4 rounded" style={{ width: `${(m.commendations || 0) * 10}px` }} title={`${m.commendations || 0} commendations`}></div>
                  </div>
                  <div className="w-32 text-xs text-gray-500">{m.incidents || 0}i / {m.observations || 0}o / {m.commendations || 0}c</div>
                </div>
              ))}
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
          <CardHeader><CardTitle className="text-white text-lg">Incidents by Squadron</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bySquadron.map((sq: any) => {
                const maxInc = Math.max(...bySquadron.map((s: any) => s.incidents || 0), 1);
                return (
                  <div key={sq.squadron} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-gray-300">{sq.squadron}SQN</div>
                    <div className="flex-1">
                      <div className="bg-red-500/60 h-5 rounded" style={{ width: `${((sq.incidents || 0) / maxInc) * 100}%`, minWidth: sq.incidents > 0 ? "20px" : "0" }}></div>
                    </div>
                    <div className="w-8 text-right text-sm text-gray-400">{sq.incidents || 0}</div>
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
