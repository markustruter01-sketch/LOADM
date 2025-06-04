import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, ExternalLink, Loader2 } from "lucide-react";
import PDFDocumentCard from "@/components/PDFDocumentCard";
import PDFViewerFixed from "@/components/PDFViewerFixed";
import PhoneDirectory from "@/components/PhoneDirectory";
import type { PDFDocument } from "@/types/pdf-document";

export default function DocumentsNewPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);

  // Fetch PDF documents using the new API
  const { data: documents = [], isLoading, error } = useQuery<PDFDocument[]>({
    queryKey: ['/api/pdf-documents'],
    refetchOnWindowFocus: false,
  });

  console.log('Documents data:', documents);

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDocument = (document: PDFDocument) => {
    console.log('Opening document:', document.title);
    setSelectedDocument(document);
  };

  const handleCloseViewer = () => {
    setSelectedDocument(null);
  };

  if (error) {
    console.error('Error loading documents:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Error Loading Documents
          </div>
          <div className="text-gray-500">
            {error instanceof Error ? error.message : 'Failed to load PDF documents'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Centre</h1>
        <p className="text-muted-foreground">
          Access Australian Defence Force operational documents and forms
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">PDF Documents</TabsTrigger>
          <TabsTrigger value="directory">Phone Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by title, description, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading documents...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'No documents found' : 'No documents available'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'PDF documents will appear here when loaded'
                  }
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Available Documents ({filteredDocuments.length})
                  </h2>
                  <div className="text-sm text-gray-500">
                    Total: {documents.length} documents
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocuments.map((document) => (
                    <PDFDocumentCard
                      key={document.id}
                      document={document}
                      onOpenDocument={handleOpenDocument}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="directory">
          <PhoneDirectory />
        </TabsContent>
      </Tabs>

      {/* PDF Viewer Modal */}
      {selectedDocument && (
        <PDFViewerFixed
          document={selectedDocument}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}