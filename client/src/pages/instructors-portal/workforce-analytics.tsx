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
  UserX, Stethoscope, GraduationCap, FileWarning, AlertCircle, Loader2
} from "lucide-react";

const SQUADRONS = ['33', '35', '36', '37', 'AMG'];

export default function WorkforceAnalytics() {
  const [selectedSquadron, setSelectedSquadron] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const [flightData, setFlightData] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);
  const [readinessData, setReadinessData] = useState<any>(null);
  const [safetyData, setSafetyData] = useState<any>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const squadronParam = selectedSquadron !== "all" ? `squadron=${selectedSquadron}` : "";
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDateParam = `startDate=${thirtyDaysAgo.toISOString()}`;
      
      const [flightRes, currencyRes, readinessRes, safetyRes] = await Promise.all([
        fetch(`/api/analytics/flight-hours?${startDateParam}&${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/currency-status?${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/squadron-readiness?${squadronParam}`, { credentials: 'include' }),
        fetch(`/api/analytics/safety-summary?${squadronParam}`, { credentials: 'include' }),
      ]);

      if (flightRes.ok) setFlightData(await flightRes.json());
      if (currencyRes.ok) setCurrencyData(await currencyRes.json());
      if (readinessRes.ok) setReadinessData(await readinessRes.json());
      if (safetyRes.ok) setSafetyData(await safetyRes.json());
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSquadron]);

  const getReasonIcon = (reason: string) => {
    switch (reason?.toLowerCase()) {
      case 'medical': return <Stethoscope className="h-4 w-4" />;
      case 'leave/personal': return <Calendar className="h-4 w-4" />;
      case 'training required': return <GraduationCap className="h-4 w-4" />;
      case 'currency lapsed': return <FileWarning className="h-4 w-4" />;
      case 'administrative': return <AlertCircle className="h-4 w-4" />;
      default: return <UserX className="h-4 w-4" />;
    }
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
  const expiringSoon = (currencyData?.summary?.expiring30Days || 0) + 
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
        <title>Workforce Analytics | LOADMworkflow</title>
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
              <h1 className="text-3xl font-bold text-white" data-testid="page-title">Workforce Analytics</h1>
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

        {/* Critical Alert Banner (if any issues) */}
        {(expiredQuals > 0 || notReadyCount > 3) && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-medium">Attention Required</p>
              <p className="text-red-400 text-sm">
                {expiredQuals > 0 && `${expiredQuals} expired qualifications need renewal. `}
                {notReadyCount > 3 && `${notReadyCount} personnel currently not flight ready.`}
              </p>
            </div>
          </div>
        )}

        {/* ==================== SECTION 1: WORKFORCE READINESS ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Workforce Readiness</h2>
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
                    <div className="text-3xl font-bold text-yellow-500">{expiringSoon}</div>
                    <div className="text-sm text-gray-400">At Risk</div>
                    <div className="text-xs text-yellow-400 mt-1">Quals expiring within 90 days</div>
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
                  {readinessData?.reasonBreakdown && readinessData.reasonBreakdown.length > 0 ? (
                    readinessData.reasonBreakdown.map((reason: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="text-orange-500">{getReasonIcon(reason.reason)}</div>
                          <span className="text-gray-300 text-sm">{reason.reason}</span>
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
                  )}
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
            <span className="text-xs text-gray-500 ml-auto">Last 30 days</span>
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
                  <span className="text-xs text-gray-500">Missions</span>
                </div>
                <div className="text-3xl font-bold text-white">{totalFlights}</div>
                <div className="text-sm text-gray-400">Total Flights Logged</div>
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg per person</span>
                    <span className="text-white">{totalPersonnel > 0 ? (totalFlights / totalPersonnel).toFixed(1) : 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-green-500" />
                  <span className="text-xs text-gray-500">Active</span>
                </div>
                <div className="text-3xl font-bold text-white">{flightData?.summary?.uniqueUsers || 0}</div>
                <div className="text-sm text-gray-400">Personnel with Flights</div>
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
                  <span className="text-xs text-gray-500">Average</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {flightData?.summary?.avgHoursPerPerson || 0}
                </div>
                <div className="text-sm text-gray-400">Avg Hours per Person</div>
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Night ratio</span>
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
              <CardDescription className="text-gray-400">Flight time distribution across airframes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {flightData?.byAircraftType && flightData.byAircraftType.length > 0 ? (
                  flightData.byAircraftType.map((aircraft: any, idx: number) => {
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
                        <div className="text-xs text-gray-500">{aircraft.flightCount} flights</div>
                        <Progress value={percent} className="h-2 mt-3 bg-[#333]" />
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-6 text-gray-500">No aircraft data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ==================== SECTION 3: QUALIFICATIONS & CURRENCY ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Award className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Qualifications & Currency</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currency Overview */}
            <Card className="bg-[#2a2a2a] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Currency Status Distribution</CardTitle>
                <CardDescription className="text-gray-400">{totalQuals} total qualifications tracked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const currentPercent = totalQuals > 0 ? Math.round((currentQuals / totalQuals) * 100) : 0;
                    const expiringSoonPercent = totalQuals > 0 ? Math.round((expiringSoon / totalQuals) * 100) : 0;
                    const expiredPercent = totalQuals > 0 ? Math.round((expiredQuals / totalQuals) * 100) : 0;
                    return (
                      <>
                        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span className="text-gray-300">Current</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-500">{currentQuals}</div>
                              <div className="text-xs text-green-400">{currentPercent}%</div>
                            </div>
                          </div>
                          <Progress value={currentPercent} className="h-2 mt-3 bg-[#1a1a1a]" />
                        </div>
                        
                        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              <span className="text-gray-300">Expiring Soon (90 days)</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-yellow-500">{expiringSoon}</div>
                              <div className="text-xs text-yellow-400">{expiringSoonPercent}%</div>
                            </div>
                          </div>
                          <Progress value={expiringSoonPercent} className="h-2 mt-3 bg-[#1a1a1a]" />
                        </div>
                        
                        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-red-500" />
                              <span className="text-gray-300">Expired</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-500">{expiredQuals}</div>
                              <div className="text-xs text-red-400">{expiredPercent}%</div>
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
        </section>

        {/* ==================== SECTION 4: SAFETY & COMPLIANCE ==================== */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-500/30 pb-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Safety & Compliance</h2>
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
                  <div className="text-sm text-gray-400">Safety Score</div>
                  <Badge className={`mt-2 ${
                    (safetyData?.safetyScore || 0) >= 80 ? 'bg-green-900/50 text-green-400' : 
                    (safetyData?.safetyScore || 0) >= 60 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {safetyData?.safetyScoreLabel || 'N/A'}
                  </Badge>
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
                  <span className="text-xs text-gray-500">Reports</span>
                </div>
                <div className="text-3xl font-bold text-blue-500">{observations}</div>
                <div className="text-sm text-gray-400">Safety Observations</div>
                <div className="text-xs text-gray-500 mt-2">
                  Proactive safety reporting
                </div>
              </CardContent>
            </Card>

            {/* Commendations */}
            <Card className="bg-[#2a2a2a] border-green-500/30 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="h-8 w-8 text-green-500" />
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-500">{commendations}</div>
                <div className="text-sm text-gray-400">Commendations</div>
                <div className="text-xs text-gray-500 mt-2">
                  Excellence recognized
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Safety Records Summary */}
          <Card className="bg-[#2a2a2a] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Safety Record Analysis</CardTitle>
              <CardDescription className="text-gray-400">{safetyData?.total || 0} total safety records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safetyData?.byType ? (
                  <>
                    {/* Incidents */}
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-red-400 font-medium capitalize">Incidents</span>
                        <Badge variant="outline" className="border-red-500/50 text-red-400">
                          {safetyData.total > 0 ? ((incidents / safetyData.total) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <Progress value={safetyData.total > 0 ? (incidents / safetyData.total) * 100 : 0} className="flex-1 h-2 bg-[#333]" />
                        <span className="text-white font-medium">{incidents}</span>
                      </div>
                    </div>
                    {/* Observations */}
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-blue-400 font-medium capitalize">Observations</span>
                        <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                          {safetyData.total > 0 ? ((observations / safetyData.total) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <Progress value={safetyData.total > 0 ? (observations / safetyData.total) * 100 : 0} className="flex-1 h-2 bg-[#333]" />
                        <span className="text-white font-medium">{observations}</span>
                      </div>
                    </div>
                    {/* Commendations */}
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-400 font-medium capitalize">Commendations</span>
                        <Badge variant="outline" className="border-green-500/50 text-green-400">
                          {safetyData.total > 0 ? ((commendations / safetyData.total) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <Progress value={safetyData.total > 0 ? (commendations / safetyData.total) * 100 : 0} className="flex-1 h-2 bg-[#333]" />
                        <span className="text-white font-medium">{commendations}</span>
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

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-600">
          Workforce Analytics Dashboard • Data refreshed at {lastRefresh.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
