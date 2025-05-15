import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect } from "react";

export default function DirectDocumentsPage() {
  const { data: documents, isLoading, refetch } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Force refetch on mount
  useEffect(() => {
    refetch();
    // Try to force reload styles if that's the issue
    const link = document.createElement('link');
    link.href = `/documents.css?v=${Date.now()}`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [refetch]);

  return (
    <div>
      <Helmet>
        <title>All Documents - LOADMdocs</title>
        <meta 
          name="description" 
          content="Browse and complete document templates for loadmaster operations." 
        />
        <style>
          {`
            body {
              background-color: #1a1a1a !important;
            }
            .main-header {
              color: white !important;
            }
          `}
        </style>
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white main-header">All Documents</h1>
            <p className="text-gray-400 mt-2">
              Browse and complete document templates for loadmaster operations
            </p>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents?.map((document) => (
                <Card key={document.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl text-white">{document.title}</CardTitle>
                      <Badge className="bg-orange-500 text-white">
                        Form
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-400">
                      {document.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center pt-2 pb-3">
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(document.lastUpdated).toLocaleString()}
                    </div>
                    <Link href={`/documents/${document.id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        Open
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}