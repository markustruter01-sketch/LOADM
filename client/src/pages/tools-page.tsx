import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ToolsPage() {
  const [_, navigate] = useLocation();

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>Tools - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Loadmaster tools and utilities for aircraft cargo operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          {/* Header Section */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Tools
            </h2>
            <p className="text-muted-foreground mb-6">
              Loadmaster tools and utilities for aircraft cargo operations
            </p>
          </section>

          {/* Placeholder Content */}
          <div className="bg-muted p-12 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-4">Tools Coming Soon</h3>
            <p className="text-muted-foreground">
              This page will contain useful tools and utilities for loadmasters. Check back later for updates.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}