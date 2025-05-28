import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileCheck, 
  ClipboardList, 
  Package2, 
  UserCircle, 
  Wrench, 
  GraduationCap,
  BookOpen,
  Plane 
} from "lucide-react";
import armyHelicopterImage from "@assets/image_1748392010087.png";

export default function ArmyHomePage() {
  const [, setLocation] = useLocation();

  const handleServiceBranchChange = (value: string) => {
    if (value === "airforce") {
      setLocation("/");
    } else if (value === "navy") {
      setLocation("/navy");
    }
    // Army stays on current page
  };

  return (
    <>
      <Helmet>
        <title>LOADMworkflow - Army Logistics Documentation App</title>
        <meta 
          name="description" 
          content="Professional documentation and scenario tools for Army logistics personnel. Access required documentation and training scenarios in one central location." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Service Branch Selection */}
          <div className="mb-8 text-center">
            <div className="max-w-xs mx-auto">
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Select Service Branch
              </label>
              <Select defaultValue="army" onValueChange={handleServiceBranchChange}>
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

          {/* Welcome Section */}
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Welcome to <span className="text-white">LOADM</span><span className="text-primary">workflow</span> - Army
            </h2>
            <p className="text-muted-foreground mb-6">
              Professional documentation and scenario tools for Army logistics personnel
            </p>

            {/* Featured Section Banner - Army Theme */}
            <div className="relative rounded-xl overflow-hidden shadow-xl mb-10 h-64">
              <img
                src={armyHelicopterImage}
                alt="Army helicopter conducting logistics operations"
                className="w-full h-full object-cover object-center"
                style={{ objectPosition: 'center 30%' }}
              />
              <div className="gradient-overlay flex items-end">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2 text-left">
                    Army Logistics Operations
                  </h3>
                  <p className="text-muted-foreground max-w-xl text-left">
                    Access Load Planning, Documentation, Training Scenarios and Assessments for Army operations.
                  </p>
                </div>
              </div>
            </div>

            {/* Sections Navigation */}
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4 text-left">Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/scenarios" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <ClipboardList className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Scenarios</h3>
                      <p className="text-sm text-center text-muted-foreground">
                        Training scenarios and simulations for Army logistics
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/training-modules" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors relative overflow-hidden">
                    <div className="absolute top-1 right-1">
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">New</span>
                    </div>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <Plane className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Vehicle Training</h3>
                      <p className="text-sm text-center text-muted-foreground">
                        Progressive vehicle-specific training modules
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/load-planning" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <Package2 className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Load Planning</h3>
                      <p className="text-sm text-center text-muted-foreground">
                        Visual load planning tools for Army vehicles
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/documents" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <FileCheck className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Documents</h3>
                      <p className="text-sm text-center text-muted-foreground">
                        Access and complete required Army documentation
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/tools" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <Wrench className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Tools</h3>
                      <p className="text-sm text-center text-muted-foreground">
                        Army logistics calculators and specialized tools
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/instructors-portal" className="block">
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
    </>
  );
}