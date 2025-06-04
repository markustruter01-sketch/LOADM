import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PDFDocument, DocumentCardProps } from "@/types/pdf-document";

export default function PDFDocumentCard({ document, onOpenDocument }: DocumentCardProps) {
  const handleOpenDocument = () => {
    console.log('Opening PDF document:', document.id, document.title);
    onOpenDocument(document);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Downloading PDF:', document.title);
    
    if (document.pdfData) {
      const link = window.document.createElement('a');
      link.href = `data:application/pdf;base64,${document.pdfData}`;
      link.download = `${document.title}.pdf`;
      link.click();
    }
  };



  const formattedDate = document.lastUpdated 
    ? formatDistanceToNow(new Date(document.lastUpdated), { addSuffix: true })
    : 'Recently';

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" 
      onClick={handleOpenDocument}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
              {document.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {document.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {document.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {document.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Updated {formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenDocument}
              className="h-8 px-2"
            >
              <Eye className="h-3 w-3 mr-1" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-2"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500">
          PDF Data: {document.pdfData ? `${document.pdfData.length} chars` : 'Missing'}
        </div>
      </CardContent>
    </Card>
  );
}