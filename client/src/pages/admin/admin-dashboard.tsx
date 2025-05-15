import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Document, Scenario, DocumentSubmission, ScenarioSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ClipboardList, Users, BarChart3, Layers, FileCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

  const { data: documentSubmissions } = useQuery<DocumentSubmission[]>({
    queryKey: ["/api/document-submissions"],
    enabled: !!user?.isAdmin,
  });

  const { data: scenarioSubmissions } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
    enabled: !!user?.isAdmin,
  });

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - LOADMdocs</title>
        <meta name="description" content="Admin dashboard for LOADMdocs - manage documents and scenarios" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage documents, scenarios, and view submission data.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Document templates available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Scenarios</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarios?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Training scenarios available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Document Submissions</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentSubmissions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total forms completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scenario Attempts</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarioSubmissions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total scenarios attempted</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Create, edit, or delete document templates</CardDescription>
            </CardHeader>
            <CardContent className="h-40 flex items-center justify-center">
              <FileText className="h-16 w-16 text-muted-foreground opacity-20" />
            </CardContent>
            <CardFooter>
              <Link href="/admin/documents">
                <a className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    Manage Documents
                  </Button>
                </a>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Scenario Management</CardTitle>
              <CardDescription>Create, edit, or delete training scenarios</CardDescription>
            </CardHeader>
            <CardContent className="h-40 flex items-center justify-center">
              <ClipboardList className="h-16 w-16 text-muted-foreground opacity-20" />
            </CardContent>
            <CardFooter>
              <Link href="/admin/scenarios">
                <a className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    Manage Scenarios
                  </Button>
                </a>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
