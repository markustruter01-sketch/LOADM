import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { 
  ClipboardList, 
  Plane, 
  Package2, 
  FileCheck, 
  Wrench, 
  GraduationCap 
} from "lucide-react";

export default function NavyHomePage() {
  const [, navigate] = useLocation();

  const handleServiceBranchChange = (value: string) => {
    if (value === 'airforce') {
      navigate('/');
    } else if (value === 'army') {
      navigate('/army');
    }
    // Navy stays on current page
  };

  return (
    <>
      <Helmet>
        <title>LOADMworkflow - Navy Logistics Documentation App</title>
        <meta 
          name="description" 
          content="Professional documentation and scenario tools for Navy logistics personnel. Access required documentation and training scenarios in one central location." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16 relative">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-orange-500 mb-4">COMING SOON</h1>
            <p className="text-2xl text-white font-medium">Navy Module in Development</p>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Service Branch Selection - Keep Interactive */}
          <div className="mb-8 text-center relative z-20">
            <div className="max-w-xs mx-auto">
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Select Service Branch
              </label>
              <Select defaultValue="navy" onValueChange={handleServiceBranchChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose your service branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airforce">Air Force</SelectItem>
                  <SelectItem value="army">Army</SelectItem>
                  <SelectItem value="navy">Navy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Rest of content - Blurred */}
          <div className="filter blur-sm pointer-events-none">
            {/* Welcome Section */}
            <section className="mb-10 text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Navy Logistics Documentation
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Access your training materials, submit scenarios, and manage documentation all in one place.
              </p>
            </section>

            {/* Main Content Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Link href="/quiz">
                    <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                          <ClipboardList className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Quiz Scenarios</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Interactive quizzes and assessments for training
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link href="/airframe?tab=training-modules">
                    <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors relative overflow-hidden">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                          <Plane className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Training Modules</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Structured learning modules and course materials
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link href="/airframe">
                    <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                          <Package2 className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Cargo Planning</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Aircraft load calculation and cargo planning tools
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link href="/documents">
                    <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                          <FileCheck className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Document Center</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Submit and review required training documents
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link href="/tools">
                    <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                          <Wrench className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Calculation Tools</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Weight, balance, and performance calculators
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  <Link href="/instructors-portal">
                    <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                          <GraduationCap className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Instructor Portal</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Manage scenarios and review student submissions
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}