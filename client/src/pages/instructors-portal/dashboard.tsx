
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, ClipboardList, FileText } from "lucide-react";

export default function InstructorDashboard() {
  return (
    <>
      <Helmet>
        <title>Instructor Dashboard - LOADMworkflow</title>
        <meta name="description" content="Instructor dashboard for managing courses and students" />
      </Helmet>
      
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Scenarios
              </CardTitle>
              <CardDescription>Manage training scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/instructors-portal/scenarios'}>
                Manage Scenarios
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quizzes
              </CardTitle>
              <CardDescription>Create and manage quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/instructors-portal/quizzes'}>
                Manage Quizzes
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students
              </CardTitle>
              <CardDescription>View student progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/instructors-portal/students'}>
                View Students
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </CardTitle>
              <CardDescription>Performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/instructors-portal/analytics'}>
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
