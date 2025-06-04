import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2, FileText } from "lucide-react";
import { useLocation } from "wouter";
import EnhancedDocumentCard from "@/components/EnhancedDocumentCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function DocumentsPage() {
  const [, navigate] = useLocation();
  
  // State for inline PDF viewer functionality
  const [activePdf, setActivePdf] = useState<{ id: string; title: string } | null>(null);
  
  // Documents state
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Handle opening PDF documents inline
  const handleOpenForm = (documentId: string, documentTitle: string) => {
    setActivePdf({ id: documentId, title: documentTitle });
  };

  // Handle closing PDF viewer
  const handleClosePdf = () => {
    setActivePdf(null);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Documents - LOADMworkflow</title>
        <meta name="description" content="Document management for military cargo load planning" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Manage and access military cargo load planning documents
            </p>
          </div>
          <Button variant="outline" onClick={handleBackClick}>
            Back to Home
          </Button>
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="directory">Phone Directory</TabsTrigger>
          </TabsList>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-6">
              {/* Enhanced Document Cards */}
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading documents...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc) => (
                    <EnhancedDocumentCard
                      key={doc.id}
                      document={doc}
                      onOpenForm={handleOpenForm}
                    />
                  ))}
                </div>
              )}

              {/* Inline PDF Display */}
              {activePdf && (
                <div id="inline-pdf-section" className="mt-8 p-6 bg-card rounded-lg border shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">{activePdf.title}</h3>
                    <Button variant="ghost" size="sm" onClick={handleClosePdf}>
                      ✕
                    </Button>
                  </div>
                  
                  {/* PDF Document Viewer */}
                  <div className="min-h-[500px] bg-white rounded-lg border p-8 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-700 mb-4">PDF Document Ready</h2>
                      <p className="text-lg text-muted-foreground mb-6">
                        This area will display the stored PDF template for {activePdf?.title}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>Available actions:</p>
                        <ul className="mt-2 space-y-1">
                          <li>• Download PDF document</li>
                          <li>• Share via email or native sharing</li>
                          <li>• Print document directly</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Phone Directory Tab */}
          <TabsContent value="directory" className="mt-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-bold mb-4">Phone Directory</h2>
              <p className="text-muted-foreground">Phone directory functionality will be available here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}