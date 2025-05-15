import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2 } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Documents - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Browse and complete document templates for loadmaster operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-2">
              Browse and complete document templates for loadmaster operations
            </p>
          </div>

          {/* Documents Grid */}
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
        </div>
      </div>
    </div>
  );
}