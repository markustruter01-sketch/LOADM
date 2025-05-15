import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DocumentsPage() {
  const [_, navigate] = useLocation();
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const handleBackClick = () => {
    // Navigate directly to the home page
    window.location.href = "/";
  };

  return (
    <>
      <Helmet>
        <title>Documents - LOADMdocs</title>
        <meta 
          name="description" 
          content="Browse and complete document templates for loadmaster operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-4 mb-0">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="link" 
            size="sm" 
            className="text-primary hover:text-primary/80 p-0 mb-3"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          
          {/* Header Section */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Documents
            </h2>
            <p className="text-muted-foreground mb-6">
              Browse and complete document templates for loadmaster operations
            </p>
          </section>

          {/* Documents Grid */}
          <section>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents?.map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}