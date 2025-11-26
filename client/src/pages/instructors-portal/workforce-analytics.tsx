import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const SQUADRONS = ['33', '35', '36', '37', 'AMG'];

export default function WorkforceAnalytics() {
  const [selectedSquadron, setSelectedSquadron] = useState("all");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white">
      <Helmet>
        <title>Workforce Analytics | LOADMworkflow</title>
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
              <h1 className="text-3xl font-bold text-white" data-testid="page-title">Workforce Analytics</h1>
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
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#2a2a2a] border border-[#333333]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="flight-hours" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-flight-hours">
              Flight Hours
            </TabsTrigger>
            <TabsTrigger value="currency" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-currency">
              Currency Status
            </TabsTrigger>
            <TabsTrigger value="readiness" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-readiness">
              Squadron Readiness
            </TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-safety">
              Safety
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-orange-500" />
                    Total Personnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white" data-testid="metric-total-personnel">31</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Flight Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500" data-testid="metric-flight-ready">87%</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    Flight Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white" data-testid="metric-total-hours">420</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                    Currency Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500" data-testid="metric-currency-warnings">12</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flight-hours">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">420</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">69</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Active Personnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">27</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="currency">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white" data-testid="total-qualifications">76</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-green-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-400">Current</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500" data-testid="current-count">58</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-yellow-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-yellow-400">Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500" data-testid="expiring-count">8</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-red-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-400">Expired</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500" data-testid="expired-count">10</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="readiness">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#2a2a2a] border-[#333333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">31</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-green-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-400">Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">27</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-red-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-400">Not Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">4</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="safety">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#2a2a2a] border-red-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-400">Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500" data-testid="incident-count">3</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-blue-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-400">Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500" data-testid="observation-count">7</div>
                </CardContent>
              </Card>

              <Card className="bg-[#2a2a2a] border-green-500/30 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-400">Commendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500" data-testid="commendation-count">8</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
