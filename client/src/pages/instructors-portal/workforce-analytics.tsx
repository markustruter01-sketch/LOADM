import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Plane, Clock, Users, Shield, AlertTriangle, CheckCircle2, 
  Calendar, TrendingUp, BarChart3, Activity, Award, RefreshCw
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];
const SQUADRONS = ['33', '35', '36', '37', 'AMG'];

export default function WorkforceAnalytics() {
  const [selectedSquadron, setSelectedSquadron] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");

  const { data: flightHoursData, isLoading: isLoadingFlightHours, refetch: refetchFlightHours } = useQuery({
    queryKey: ['/api/analytics/flight-hours', selectedSquadron, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSquadron !== "all") params.append('squadron', selectedSquadron);
      params.append('days', timeRange);
      const res = await fetch(`/api/analytics/flight-hours?${params}`);
      return res.json();
    }
  });

  const { data: currencyData, isLoading: isLoadingCurrency, refetch: refetchCurrency } = useQuery({
    queryKey: ['/api/analytics/currency-status', selectedSquadron],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSquadron !== "all") params.append('squadron', selectedSquadron);
      const res = await fetch(`/api/analytics/currency-status?${params}`);
      return res.json();
    }
  });

  const { data: readinessData, isLoading: isLoadingReadiness, refetch: refetchReadiness } = useQuery({
    queryKey: ['/api/analytics/squadron-readiness', selectedSquadron],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSquadron !== "all") params.append('squadron', selectedSquadron);
      const res = await fetch(`/api/analytics/squadron-readiness?${params}`);
      return res.json();
    }
  });

  const { data: safetyData, isLoading: isLoadingSafety, refetch: refetchSafety } = useQuery({
    queryKey: ['/api/analytics/safety-summary', selectedSquadron],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSquadron !== "all") params.append('squadron', selectedSquadron);
      const res = await fetch(`/api/analytics/safety-summary?${params}`);
      return res.json();
    }
  });

  const handleRefresh = () => {
    refetchFlightHours();
    refetchCurrency();
    refetchReadiness();
    refetchSafety();
  };

  const readinessChartData = readinessData?.squadronBreakdown?.map((sq: any) => ({
    name: `SQN ${sq.squadron}`,
    ready: sq.ready,
    notReady: sq.notReady,
    readinessPercent: sq.total > 0 ? Math.round((sq.ready / sq.total) * 100) : 0
  })) || [];

  const currencyChartData = [
    { name: 'Current', value: currencyData?.current || 0, color: '#22c55e' },
    { name: 'Expiring Soon', value: currencyData?.expiringSoon || 0, color: '#eab308' },
    { name: 'Expired', value: currencyData?.expired || 0, color: '#ef4444' },
  ];

  const safetyChartData = safetyData?.byType?.map((item: any) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    count: item.count,
    fill: item.type === 'commendation' ? '#22c55e' : item.type === 'incident' ? '#ef4444' : '#3b82f6'
  })) || [];

  const flightHoursByAircraft = flightHoursData?.byAircraftType?.map((item: any) => ({
    name: item.aircraftType,
    hours: parseFloat(item.totalHours?.toFixed(1) || 0),
    flights: item.flightCount
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white">
      <Helmet>
        <title>Workforce Analytics | LOADMworkflow</title>
        <meta name="description" content="Air Force loadmaster workforce analytics dashboard" />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/instructors-portal">
              <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Workforce Analytics</h1>
              <p className="text-gray-400">Loadmaster readiness and performance metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
            <Button onClick={handleRefresh} variant="outline" className="border-[#333333] text-gray-300 hover:bg-[#2a2a2a]" data-testid="button-refresh">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#2a2a2a] border border-[#333333]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Activity className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="flight-hours" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Clock className="mr-2 h-4 w-4" />
              Flight Hours
            </TabsTrigger>
            <TabsTrigger value="currency" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Calendar className="mr-2 h-4 w-4" />
              Currency Status
            </TabsTrigger>
            <TabsTrigger value="readiness" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Squadron Readiness
            </TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Shield className="mr-2 h-4 w-4" />
              Safety & Compliance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-orange-500" />
                    Total Personnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{readinessData?.totalUsers || 0}</div>
                  <p className="text-xs text-gray-500">Active loadmasters</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Flight Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {readinessData?.readyPercent || 0}%
                  </div>
                  <p className="text-xs text-gray-500">{readinessData?.ready || 0} personnel ready</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    Total Flight Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {parseFloat(flightHoursData?.totalHours?.toFixed(1) || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">Last {timeRange} days</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                    Currency Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500">
                    {(currencyData?.expiringSoon || 0) + (currencyData?.expired || 0)}
                  </div>
                  <p className="text-xs text-gray-500">Qualifications at risk</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-orange-500" />
                    Squadron Readiness Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingReadiness ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                  ) : readinessChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={readinessChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Bar dataKey="ready" name="Flight Ready" fill="#22c55e" />
                        <Bar dataKey="notReady" name="Not Ready" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Award className="mr-2 h-5 w-5 text-orange-500" />
                    Currency Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingCurrency ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                  ) : currencyData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currencyChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {currencyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Flight Hours Tab */}
          <TabsContent value="flight-hours">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {parseFloat(flightHoursData?.totalHours?.toFixed(1) || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <div className="flex-1">
                      <span className="text-gray-400">Day: </span>
                      <span className="text-white">{parseFloat(flightHoursData?.dayHours?.toFixed(1) || 0)}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-400">Night: </span>
                      <span className="text-white">{parseFloat(flightHoursData?.nightHours?.toFixed(1) || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {flightHoursData?.totalFlights || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">In last {timeRange} days</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Active Personnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {flightHoursData?.uniqueUsers || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">With recorded flights</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-end mb-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] bg-[#2a2a2a] border-[#333333] text-white" data-testid="select-time-range">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-[#333333]">
                  <SelectItem value="7" className="text-white hover:bg-[#333333]">Last 7 Days</SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-[#333333]">Last 30 Days</SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-[#333333]">Last 90 Days</SelectItem>
                  <SelectItem value="365" className="text-white hover:bg-[#333333]">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plane className="mr-2 h-5 w-5 text-orange-500" />
                  Hours by Aircraft Type
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoadingFlightHours ? (
                  <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                ) : flightHoursByAircraft.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flightHoursByAircraft} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" stroke="#888" />
                      <YAxis dataKey="name" type="category" stroke="#888" width={80} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        formatter={(value: any, name: string) => [
                          name === 'hours' ? `${value} hrs` : value,
                          name === 'hours' ? 'Flight Hours' : 'Number of Flights'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="hours" name="Flight Hours" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No flight data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency Status Tab */}
          <TabsContent value="currency">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{currencyData?.total || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-green-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-400 flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Current
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{currencyData?.current || 0}</div>
                  <p className="text-xs text-gray-500">Valid qualifications</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-yellow-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-400 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Expiring Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500">{currencyData?.expiringSoon || 0}</div>
                  <p className="text-xs text-gray-500">Within 90 days</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-red-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-400 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Expired
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">{currencyData?.expired || 0}</div>
                  <p className="text-xs text-gray-500">Require renewal</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Currency Health</CardTitle>
                  <CardDescription className="text-gray-400">Overall qualification status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Current</span>
                        <span className="text-green-500">{currencyData?.currentPercent || 0}%</span>
                      </div>
                      <Progress value={currencyData?.currentPercent || 0} className="bg-[#333]" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Expiring Soon</span>
                        <span className="text-yellow-500">{currencyData?.expiringSoonPercent || 0}%</span>
                      </div>
                      <Progress value={currencyData?.expiringSoonPercent || 0} className="bg-[#333]" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Expired</span>
                        <span className="text-red-500">{currencyData?.expiredPercent || 0}%</span>
                      </div>
                      <Progress value={currencyData?.expiredPercent || 0} className="bg-[#333]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Expiring Qualifications</CardTitle>
                  <CardDescription className="text-gray-400">Action required within 90 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {currencyData?.expiringDetails?.length > 0 ? (
                      currencyData.expiringDetails.slice(0, 10).map((qual: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                          <div>
                            <p className="text-white font-medium">{qual.name}</p>
                            <p className="text-gray-400 text-sm">{qual.userEmail}</p>
                          </div>
                          <Badge variant={qual.daysUntilExpiry <= 30 ? "destructive" : "secondary"} 
                                 className={qual.daysUntilExpiry <= 30 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}>
                            {qual.daysUntilExpiry} days
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">No expiring qualifications</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Squadron Readiness Tab */}
          <TabsContent value="readiness">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Personnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{readinessData?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-green-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">Flight Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{readinessData?.ready || 0}</div>
                  <Progress value={readinessData?.readyPercent || 0} className="mt-2 bg-[#333]" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-red-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-400">Not Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">{readinessData?.notReady || 0}</div>
                  <Progress value={readinessData?.notReadyPercent || 0} className="mt-2 bg-[#333]" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Squadron Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {isLoadingReadiness ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                  ) : readinessChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={readinessChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        />
                        <Legend />
                        <Bar dataKey="ready" name="Flight Ready" fill="#22c55e" stackId="a" />
                        <Bar dataKey="notReady" name="Not Ready" fill="#ef4444" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Not Ready Reasons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {readinessData?.notReadyReasons?.length > 0 ? (
                      readinessData.notReadyReasons.map((reason: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                          <span className="text-gray-300">{reason.reason || 'Unspecified'}</span>
                          <Badge className="bg-orange-500/20 text-orange-400">{reason.count}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">No personnel marked as not ready</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{safetyData?.totalRecords || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-red-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-400">Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">
                    {safetyData?.byType?.find((t: any) => t.type === 'incident')?.count || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-blue-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-400">Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">
                    {safetyData?.byType?.find((t: any) => t.type === 'observation')?.count || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-green-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">Commendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {safetyData?.byType?.find((t: any) => t.type === 'commendation')?.count || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Safety Records by Type</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingSafety ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                  ) : safetyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={safetyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        />
                        <Bar dataKey="count" name="Count">
                          {safetyChartData.map((entry: { name: string; count: number; fill: string }, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No safety records</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Recent Safety Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {safetyData?.recentRecords?.length > 0 ? (
                      safetyData.recentRecords.map((record: any, index: number) => (
                        <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={
                              record.type === 'incident' ? 'bg-red-500/20 text-red-400' :
                              record.type === 'commendation' ? 'bg-green-500/20 text-green-400' :
                              'bg-blue-500/20 text-blue-400'
                            }>
                              {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                            </Badge>
                            <span className="text-gray-500 text-xs">
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white text-sm">{record.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">No recent safety records</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
