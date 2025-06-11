import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { BookOpen, Users, BarChart2, FileCheck2, HelpCircle, Edit, ClipboardList, Search, Filter, Download, Mail, Calendar, Clock, TrendingUp, Award, Target, Activity } from "lucide-react";
import InstructorLayout from "../../components/InstructorLayout";
import { useIsolatedAuth } from "../../auth-isolated/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function InstructorsPortalUpdated() {
  const { user } = useIsolatedAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedSquadron, setSelectedSquadron] = useState<string>("AMG");

  const squadrons = [
    { value: "33SQN", label: "33 Squadron" },
    { value: "35SQN", label: "35 Squadron" },
    { value: "36SQN", label: "36 Squadron" },
    { value: "37SQN", label: "37 Squadron" },
    { value: "AMG", label: "All Squadrons" }
  ];

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'markustruter01@gmail.com',
          subject: 'Test Email from Instructor Portal',
          text: 'This is a test email to verify the email functionality is working correctly.'
        }),
      });

      if (response.ok) {
        toast({
          title: "Email sent successfully",
          description: "Test email has been sent to markustruter01@gmail.com",
        });
      } else {
        toast({
          title: "Email failed",
          description: "There was an error sending the test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Email error",
        description: "Network error occurred while sending email",
        variant: "destructive",
      });
    }
  };

  // Only show instructor content for instructors and superadmins
  if (!user || (user.role !== 'instructor' && user.role !== 'superadmin')) {
    return (
      <InstructorLayout title="Instructor Portal">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Access Restricted</CardTitle>
              <CardDescription className="text-center">
                You need instructor or superadmin privileges to access this portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Current role: {user?.role || 'Not authenticated'}
              </p>
              <Button 
                onClick={() => setLocation('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout title="Instructor Portal">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Instructor Portal</h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive training management and student assessment tools
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Label htmlFor="squadron-select" className="text-sm font-medium">
                Squadron Filter:
              </Label>
              <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select squadron" />
                </SelectTrigger>
                <SelectContent>
                  {squadrons.map((squadron) => (
                    <SelectItem key={squadron.value} value={squadron.value}>
                      {squadron.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-primary">Active Students</p>
                    <p className="text-2xl font-bold text-primary">47</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Avg Score</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">87%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Recent Submissions</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Completion Rate</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">92%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Management Functions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Core Management Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Pop Quizzes Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pop Quizzes</CardTitle>
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Create and manage quick knowledge tests</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Create randomized knowledge check quizzes from a library of loadmaster-specific questions to test student knowledge
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/quizzes">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Create Pop Quiz
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pop Quiz Questions Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pop Quiz Questions</CardTitle>
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Edit question bank and answers</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Manage the question library used for pop quizzes, including correct and incorrect answer options
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/quiz-questions">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Edit Quiz Questions
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Workforce Management Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workforce</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Squadron Personnel Management</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                View squadron personnel, track individual student progress, and review recent submissions by squadron members.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/workforce">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  View Workforce
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Advanced Analytics Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Analytics</CardTitle>
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Comprehensive Performance Metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Analyze performance across all assessment types, track squadron-specific progress, and view detailed training metrics.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/analytics">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Workforce Performance Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Additional Resources */}
        <h3 className="text-xl font-semibold mb-4 text-foreground">Instructor Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Training Guidelines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Access comprehensive instructor manuals and training protocols
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Guide
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Email Testing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Test email functionality and notifications system
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleTestEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Schedule</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                View training schedules and upcoming assessments
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Achievements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Track student achievements and certifications
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Award className="h-4 w-4 mr-2" />
                View Awards
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </InstructorLayout>
  );
}