import { Button } from "@/components/ui/button";
import { Download, X, FileText } from "lucide-react";
import type { PDFDocument } from "@/types/pdf-document";

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
}

export default function PDFViewer({ document, onClose }: PDFViewerProps) {
  const handleDownload = () => {
    console.log('Downloading PDF:', document.title);
    try {
      // Create a clean PDF data URL
      const pdfBlob = new Blob([
        Uint8Array.from(atob(document.pdfData), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(pdfBlob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Create a clean blob URL for the PDF
  const createPdfUrl = () => {
    try {
      const binaryString = atob(document.pdfData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to create PDF URL:', error);
      return null;
    }
  };

  const pdfUrl = document.pdfData ? createPdfUrl() : null;

  return (
    <div className="mt-6 border-t pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{document.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!document.pdfData}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="border rounded-lg bg-gray-50 h-[600px]">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded-lg"
            title={`PDF: ${document.title}`}
            onLoad={() => {
              console.log('PDF loaded successfully for:', document.title);
            }}
            onError={(e) => {
              console.error('PDF failed to load for:', document.title, e);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 text-lg font-semibold mb-2">
                Unable to Display PDF
              </div>
              <div className="text-gray-500 mb-2">
                Document: {document.title}
              </div>
              <div className="text-xs text-gray-400">
                Data available: {document.pdfData ? 'Yes' : 'No'} | 
                Length: {document.pdfData?.length || 0} chars
              </div>
              {document.pdfData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="mt-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}