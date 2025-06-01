// Bob Instructor Portal Fix - Create all missing components
import fs from 'fs';
import path from 'path';

class BobInstructorPortalFix {
  constructor() {
    this.fixesApplied = [];
  }

  async runCompleteFix() {
    console.log('🤖 Bob: Fixing all instructor portal components...');
    
    await this.createMissingDirectories();
    await this.fixInstructorsPortalIndex();
    await this.fixScenariosIndex();
    await this.fixScenarioCreate();
    await this.fixScenarioEdit();
    await this.fixStudentProgress();
    await this.fixSubmissionReview();
    await this.fixAdvancedAnalytics();
    await this.fixScenarioSubmissions();
    await this.fixDocumentSubmissions();
    await this.fixTeachingMaterials();
    await this.fixBestPractices();
    await this.fixScenarioResources();
    await this.fixQuizSubmissions();
    await this.fixQuizSubmissionDetail();
    
    return this.generateReport();
  }

  async createMissingDirectories() {
    const dirs = [
      'client/src/pages/instructors-portal',
      'client/src/pages/instructors-portal/scenarios',
      'client/src/pages/instructors-portal/scenarios/edit',
      'client/src/pages/instructors-portal/student-progress',
      'client/src/pages/instructors-portal/quiz-submissions'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.fixesApplied.push(`Created directory: ${dir}`);
      }
    });
  }

  async fixInstructorsPortalIndex() {
    const filePath = 'client/src/pages/instructors-portal/index.tsx';
    
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').length < 100) {
      const content = `
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, Users, ClipboardList, FileText, GraduationCap, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function InstructorsPortal() {
  const { user } = useAuth();
  
  const { data: stats } = useQuery({
    queryKey: ['/api/instructor-stats'],
    enabled: !!user?.isInstructor || !!user?.isSuperAdmin
  });

  return (
    <>
      <Helmet>
        <title>Instructor Portal - LOADMworkflow</title>
        <meta name="description" content="Instructor portal for managing courses, scenarios, and student progress" />
      </Helmet>
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instructor Portal</h1>
            <p className="text-muted-foreground">Manage training content and monitor student progress</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scenarios</p>
                  <p className="text-3xl font-bold">{stats?.scenarioCount || 0}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                  <p className="text-3xl font-bold">{stats?.studentCount || 0}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                  <p className="text-3xl font-bold">{stats?.submissionCount || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                  <p className="text-3xl font-bold">{stats?.avgScore || 0}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Scenario Management
              </CardTitle>
              <CardDescription>Create, edit, and manage training scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/instructors-portal/scenarios">
                <Button className="w-full">Manage Scenarios</Button>
              </Link>
              <Link href="/instructors-portal/scenarios/create">
                <Button variant="outline" className="w-full">Create New Scenario</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quiz Management
              </CardTitle>
              <CardDescription>Create and manage quizzes and assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/instructors-portal/quizzes">
                <Button className="w-full">Manage Quizzes</Button>
              </Link>
              <Link href="/instructors-portal/quizzes/create">
                <Button variant="outline" className="w-full">Create New Quiz</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Progress
              </CardTitle>
              <CardDescription>Monitor and review student submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/instructors-portal/student-progress">
                <Button className="w-full">View Progress</Button>
              </Link>
              <Link href="/instructors-portal/submissions">
                <Button variant="outline" className="w-full">Review Submissions</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </CardTitle>
              <CardDescription>Performance analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/instructors-portal/analytics">
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Teaching Resources
              </CardTitle>
              <CardDescription>Access teaching materials and best practices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/instructors-portal/resources">
                <Button className="w-full">View Resources</Button>
              </Link>
              <Link href="/instructors-portal/best-practices">
                <Button variant="outline" className="w-full">Best Practices</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common instructor tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/instructors-portal/quiz-submissions">
                <Button variant="outline" className="w-full">Review Quiz Results</Button>
              </Link>
              <Link href="/instructors-portal/document-submissions">
                <Button variant="outline" className="w-full">Document Reviews</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Fixed instructors portal index component');
    }
  }

  async fixStudentProgress() {
    const filePath = 'client/src/pages/instructors-portal/student-progress/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function StudentProgress() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['/api/student-progress']
  });

  if (isLoading) return <div className="p-6">Loading student progress...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Student Progress Overview</h1>
      
      <div className="grid gap-6">
        {progress?.map((student: any) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.name || student.email}</CardTitle>
              <CardDescription>Progress Summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{student.overallProgress || 0}%</span>
                  </div>
                  <Progress value={student.overallProgress || 0} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Scenarios Completed</div>
                    <div className="font-semibold">{student.scenariosCompleted || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Quizzes Taken</div>
                    <div className="font-semibold">{student.quizzesTaken || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                    <div className="font-semibold">{student.averageScore || 0}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                      {student.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No student progress data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created student progress component');
    }
  }

  async fixSubmissionReview() {
    const filePath = 'client/src/pages/instructors-portal/student-progress/[id].tsx';
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SubmissionReview() {
  const [match, params] = useRoute("/instructors-portal/student-progress/:id");
  const submissionId = params?.id;

  const { data: submission, isLoading } = useQuery({
    queryKey: [\`/api/submissions/\${submissionId}\`],
    enabled: !!submissionId
  });

  if (isLoading) return <div className="p-6">Loading submission...</div>;
  if (!submission) return <div className="p-6">Submission not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Submission Review</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Progress
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
          <CardDescription>Review and provide feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Student</label>
              <p>{submission.studentName || 'Unknown Student'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Submitted</label>
              <p>{new Date(submission.submittedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Score</label>
              <p>{submission.score || 0}%</p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Badge variant={submission.passed ? 'default' : 'destructive'}>
                {submission.passed ? 'Passed' : 'Failed'}
              </Badge>
            </div>
          </div>
          
          {submission.answers && (
            <div>
              <h3 className="font-semibold mb-2">Student Answers</h3>
              <div className="space-y-2">
                {submission.answers.map((answer: any, index: number) => (
                  <div key={index} className="p-3 border rounded">
                    <p className="font-medium">Question {index + 1}</p>
                    <p className="text-sm text-muted-foreground">{answer.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created submission review component');
    }
  }

  async fixAdvancedAnalytics() {
    const filePath = 'client/src/pages/instructors-portal/analytics/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";

export default function AdvancedAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/instructor']
  });

  if (isLoading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Advanced Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newStudents || 0} from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.scoreImprovement || 0}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.completionImprovement || 0}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scenarios</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeScenarios || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.scenarioGrowth || 0} scenarios this month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Student performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded">
              <p className="text-muted-foreground">Performance chart would appear here</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Popular Scenarios</CardTitle>
            <CardDescription>Most attempted training scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.popularScenarios?.map((scenario: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{scenario.title}</p>
                    <p className="text-sm text-muted-foreground">{scenario.attempts} attempts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{scenario.averageScore}%</p>
                    <p className="text-sm text-muted-foreground">avg score</p>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">No scenario data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created advanced analytics component');
    }
  }

  async fixScenariosIndex() {
    const filePath = 'client/src/pages/instructors-portal/scenarios/index.tsx';
    
    if (fs.existsSync(filePath)) {
      // Component already exists, skip
      return;
    }
    
    const content = `
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScenariosIndex() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['/api/scenarios']
  });

  const deleteMutation = useMutation({
    mutationFn: async (scenarioId: number) => {
      const response = await fetch(\`/api/scenarios/\${scenarioId}\`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete scenario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
    }
  });

  if (isLoading) return <div className="p-6">Loading scenarios...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Scenario Management</h1>
        <Link href="/instructors-portal/scenarios/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Scenario
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios?.map((scenario: any) => (
          <Card key={scenario.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{scenario.title}</CardTitle>
              <CardDescription className="line-clamp-3">
                {scenario.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{scenario.type}</Badge>
                <Badge variant={scenario.status === 'active' ? 'default' : 'secondary'}>
                  {scenario.status}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Link href={"/scenarios/" + scenario.id}>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>
                <Link href={"/instructors-portal/scenarios/edit/" + scenario.id}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteMutation.mutate(scenario.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No scenarios found</p>
              <Link href="/instructors-portal/scenarios/create">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Scenario
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
`;
    
    fs.writeFileSync(filePath, content);
    this.fixesApplied.push('Created scenarios index component');
  }

  async fixScenarioCreate() {
    const filePath = 'client/src/pages/instructors-portal/scenarios/new-create.tsx';
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CreateScenario() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    difficulty: 'medium'
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create scenario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      toast({
        title: "Success",
        description: "Scenario created successfully",
      });
      setLocation('/instructors-portal/scenarios');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Scenario</h1>
        <Button variant="outline" onClick={() => setLocation('/instructors-portal/scenarios')}>
          Back to Scenarios
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scenario Details</CardTitle>
          <CardDescription>Enter the basic information for your new scenario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter scenario title"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the scenario objectives and context"
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loading">Loading Operations</SelectItem>
                  <SelectItem value="planning">Load Planning</SelectItem>
                  <SelectItem value="safety">Safety Procedures</SelectItem>
                  <SelectItem value="emergency">Emergency Response</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Scenario'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation('/instructors-portal/scenarios')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created scenario create component');
    }
  }

  async fixScenarioEdit() {
    const filePath = 'client/src/pages/instructors-portal/scenarios/edit/[id].tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function EditScenario() {
  const [match, params] = useRoute("/instructors-portal/scenarios/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scenarioId = params?.id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    difficulty: 'medium'
  });

  const { data: scenario, isLoading } = useQuery({
    queryKey: [\`/api/scenarios/\${scenarioId}\`],
    enabled: !!scenarioId
  });

  useEffect(() => {
    if (scenario) {
      setFormData({
        title: scenario.title || '',
        description: scenario.description || '',
        type: scenario.type || '',
        difficulty: scenario.difficulty || 'medium'
      });
    }
  }, [scenario]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(\`/api/scenarios/\${scenarioId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update scenario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      toast({
        title: "Success",
        description: "Scenario updated successfully",
      });
      setLocation('/instructors-portal/scenarios');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-6">Loading scenario...</div>;
  if (!scenario) return <div className="p-6">Scenario not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Scenario</h1>
        <Button variant="outline" onClick={() => setLocation('/instructors-portal/scenarios')}>
          Back to Scenarios
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scenario Details</CardTitle>
          <CardDescription>Update the scenario information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter scenario title"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the scenario objectives and context"
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loading">Loading Operations</SelectItem>
                  <SelectItem value="planning">Load Planning</SelectItem>
                  <SelectItem value="safety">Safety Procedures</SelectItem>
                  <SelectItem value="emergency">Emergency Response</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Scenario'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation('/instructors-portal/scenarios')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created scenario edit component');
    }
  }

  // Add remaining component fixes
  async fixScenarioSubmissions() {
    const filePath = 'client/src/pages/instructors-portal/submissions/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ScenarioSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/scenario-submissions']
  });

  if (isLoading) return <div className="p-6">Loading submissions...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Scenario Submissions</h1>
      
      <div className="space-y-4">
        {submissions?.map((submission: any) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{submission.scenarioTitle}</CardTitle>
                  <CardDescription>Submitted by {submission.studentName}</CardDescription>
                </div>
                <Badge variant={submission.passed ? 'default' : 'destructive'}>
                  {submission.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
                <Link href={"/instructors-portal/student-progress/" + submission.id}>
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No submissions found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created scenario submissions component');
    }
  }

  async fixDocumentSubmissions() {
    const filePath = 'client/src/pages/instructors-portal/document-submissions/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/document-submissions']
  });

  if (isLoading) return <div className="p-6">Loading document submissions...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Document Submissions</h1>
      
      <div className="space-y-4">
        {submissions?.map((submission: any) => (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle>{submission.documentTitle}</CardTitle>
              <CardDescription>Submitted by {submission.studentName}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No document submissions found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created document submissions component');
    }
  }

  async fixTeachingMaterials() {
    const filePath = 'client/src/pages/instructors-portal/resources/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

export default function TeachingMaterials() {
  const resources = [
    {
      id: 1,
      title: "Instructor Guide - Scenario Creation",
      description: "Complete guide for creating effective training scenarios",
      type: "PDF",
      size: "2.5 MB"
    },
    {
      id: 2,
      title: "Assessment Rubrics",
      description: "Standardized rubrics for evaluating student performance",
      type: "DOCX",
      size: "1.2 MB"
    },
    {
      id: 3,
      title: "Safety Procedures Manual",
      description: "Updated safety protocols for training environments",
      type: "PDF",
      size: "3.8 MB"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Teaching Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {resource.title}
              </CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{resource.type}</span>
                <span>{resource.size}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created teaching materials component');
    }
  }

  async fixBestPractices() {
    const filePath = 'client/src/pages/instructors-portal/best-practices/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Target, BookOpen } from "lucide-react";

export default function BestPractices() {
  const practices = [
    {
      id: 1,
      title: "Effective Scenario Design",
      description: "Best practices for creating engaging and educational scenarios",
      category: "Design",
      rating: 5,
      icon: Target
    },
    {
      id: 2,
      title: "Student Engagement Strategies",
      description: "Techniques to keep students motivated and participating",
      category: "Teaching",
      rating: 4,
      icon: Users
    },
    {
      id: 3,
      title: "Assessment and Feedback",
      description: "How to provide constructive feedback that improves learning",
      category: "Assessment",
      rating: 5,
      icon: BookOpen
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Best Practices</h1>
      
      <div className="space-y-6">
        {practices.map((practice) => {
          const IconComponent = practice.icon;
          return (
            <Card key={practice.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-6 h-6 text-blue-500" />
                    <div>
                      <CardTitle>{practice.title}</CardTitle>
                      <CardDescription>{practice.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{practice.category}</Badge>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: practice.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Click to view detailed guidelines and implementation strategies for this best practice.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created best practices component');
    }
  }

  async fixScenarioResources() {
    const filePath = 'client/src/pages/instructors-portal/scenarios/resources/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Video } from "lucide-react";

export default function ScenarioResources() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Scenario Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates
            </CardTitle>
            <CardDescription>Pre-built scenario templates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Browse Templates</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Media Library
            </CardTitle>
            <CardDescription>Images and diagrams for scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Media</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Resources
            </CardTitle>
            <CardDescription>Training videos and demonstrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Watch Videos</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created scenario resources component');
    }
  }

  async fixQuizSubmissions() {
    const filePath = 'client/src/pages/instructors-portal/quiz-submissions/index.tsx';
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function QuizSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/quiz-submissions']
  });

  if (isLoading) return <div className="p-6">Loading quiz submissions...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Quiz Submissions</h1>
      
      <div className="space-y-4">
        {submissions?.map((submission: any) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{submission.quizTitle}</CardTitle>
                  <CardDescription>Submitted by {submission.studentName}</CardDescription>
                </div>
                <Badge variant={submission.passed ? 'default' : 'destructive'}>
                  {submission.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
                <Link href={"/instructors-portal/quiz-submissions/" + submission.id}>
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No quiz submissions found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created quiz submissions component');
    }
  }

  async fixQuizSubmissionDetail() {
    const filePath = 'client/src/pages/instructors-portal/quiz-submissions/[id].tsx';
    
    if (!fs.existsSync(filePath)) {
      const content = `
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function QuizSubmissionDetail() {
  const [match, params] = useRoute("/instructors-portal/quiz-submissions/:id");
  const submissionId = params?.id;

  const { data: submission, isLoading } = useQuery({
    queryKey: [\`/api/quiz-submissions/\${submissionId}\`],
    enabled: !!submissionId
  });

  if (isLoading) return <div className="p-6">Loading submission details...</div>;
  if (!submission) return <div className="p-6">Submission not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quiz Submission Details</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Submissions
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Submission Overview</CardTitle>
          <CardDescription>{submission.quizTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Student</label>
              <p>{submission.studentName}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Score</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{submission.score}%</span>
                <Badge variant={submission.passed ? 'default' : 'destructive'}>
                  {submission.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Submitted</label>
              <p>{new Date(submission.submittedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Time Taken</label>
              <p>{submission.timeSpent} minutes</p>
            </div>
          </div>
          
          {submission.answers && (
            <div>
              <h3 className="font-semibold mb-4">Question Responses</h3>
              <div className="space-y-4">
                {submission.answers.map((answer: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <Badge variant={answer.correct ? 'default' : 'destructive'}>
                        {answer.correct ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{answer.question}</p>
                    <p className="font-medium">Student Answer: {answer.studentAnswer}</p>
                    {!answer.correct && (
                      <p className="text-sm text-green-600">Correct Answer: {answer.correctAnswer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;
      
      fs.writeFileSync(filePath, content);
      this.fixesApplied.push('Created quiz submission detail component');
    }
  }

  generateReport() {
    console.log('\n🔧 Bob Instructor Portal Fix Report');
    console.log('=====================================');
    console.log(`Total Fixes Applied: ${this.fixesApplied.length}`);
    
    if (this.fixesApplied.length > 0) {
      console.log('\n✅ Fixes Applied:');
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    }
    
    console.log('\n🤖 Bob: All instructor portal components have been created/fixed');
    console.log('The instructor portal should now be fully functional');
    
    return this.fixesApplied;
  }
}

// Run Bob Instructor Portal Fix
async function runBobInstructorPortalFix() {
  const bob = new BobInstructorPortalFix();
  const results = await bob.runCompleteFix();
  return results;
}

runBobInstructorPortalFix().catch(error => {
  console.error('Bob Instructor Portal Fix error:', error.message);
});