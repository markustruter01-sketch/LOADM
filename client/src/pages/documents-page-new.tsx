import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2 } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";

export default function DocumentsPageNew() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Documents - LOADMdocs</title>
        <meta 
          name="description" 
          content="Browse and complete document templates for loadmaster operations." 
        />
      </Helmet>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-4xl mx-auto">
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
    </div>
  );
}