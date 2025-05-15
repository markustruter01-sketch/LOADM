import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, ClipboardList, Package2, UserCircle } from "lucide-react";
import cargoBayImage from "../assets/cargo-bay.png";

export default function HomePage() {

  return (
    <>
      <Helmet>
        <title>LOADMdocs - Professional Loadmaster Documentation App</title>
        <meta 
          name="description" 
          content="Professional documentation and scenario tools for loadmasters. Access required documentation and training scenarios in one central location." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Welcome to <span className="text-primary">LOADMdocs</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/scenarios" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
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
                </Link>
                
                <Link href="/load-planning" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
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
                </Link>
                
                <Link href="/cargo-manifest" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
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
                </Link>
                
                <Link href="/auth" className="block">
                  <Card className="h-full bg-card hover:bg-card/80 cursor-pointer transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <UserCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Profile</h3>
                      <p className="text-sm text-center text-muted-foreground">
                        Manage your account and preferences
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </section>

          {/* Additional content could be added here if needed */}
        </div>
      </div>
    </>
  );
}
