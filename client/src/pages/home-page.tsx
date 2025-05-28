import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
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
import cargoBayImage from "../assets/cargo-bay.png";
import { useAuth } from "@/hooks/use-simple-auth";
import SimpleLoginModal from "@/components/SimpleLoginModal";
import { useState } from "react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const requireLogin = (targetPath: string) => {
    if (!user) {
      setPendingNavigation(targetPath);
      setShowLoginModal(true);
      return;
    }
    setLocation(targetPath);
  };

  const handleServiceBranchChange = (value: string) => {
    if (value === "army") {
      requireLogin("/army");
    } else if (value === "navy") {
      requireLogin("/navy");
    }
  };

  const handleCardClick = (href: string) => {
    return () => {
      requireLogin(href);
    };
  };

  const handleLoginSuccess = () => {
    if (pendingNavigation) {
      setLocation(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>LOADMworkflow - Professional Loadmaster Documentation App</title>
        <meta 
          name="description" 
          content="Professional documentation and scenario tools for loadmasters. Access required documentation and training scenarios in one central location." 
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
              <Select defaultValue="airforce" onValueChange={handleServiceBranchChange}>
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
              Welcome to <span className="text-white">LOADM</span><span className="text-primary">workflow</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Professional documentation and scenario tools for loadmasters
            </p>

            {/* Featured Section Banner */}
            <div className="relative rounded-xl overflow-hidden shadow-xl mb-10 h-64">
              <img
                src={cargoBayImage}
                alt="Military cargo loadmaster in aircraft bay"
                className="w-full h-full object-cover"
              />
              <div className="gradient-overlay flex items-end">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2 text-left">
                    Streamline Your Loadmaster Experience
                  </h3>
                  <p className="text-muted-foreground max-w-xl text-left">
                    Access Load Planning, Documentation, Training Scenarios and Assessments.
                  </p>
                </div>
              </div>
            </div>

            {/* Sections Navigation */}
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4 text-left">Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={handleCardClick("/scenarios")}>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <ClipboardList className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Scenarios</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Training scenarios and simulations for loadmasters
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors relative overflow-hidden" onClick={handleCardClick("/training-modules")}>
                  <div className="absolute top-1 right-1">
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">New</span>
                  </div>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <Plane className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Aircraft Training</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Progressive aircraft-specific training modules
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={handleCardClick("/load-planning")}>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <Package2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Load Planning</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Visual load planning tools for aircraft cargo
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={handleCardClick("/documents")}>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Documents</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Access and complete required documentation
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={handleCardClick("/tools")}>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <Wrench className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Tools</h3>
                    <p className="text-sm text-center text-muted-foreground">
                      Loadmaster calculators and specialized tools
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={handleCardClick("/instructors-portal")}>
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
              </div>
            </div>
          </section>

          {/* Additional content could be added here if needed */}
        </div>
      </div>

      {/* Login Modal */}
      <SimpleLoginModal 
        open={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
