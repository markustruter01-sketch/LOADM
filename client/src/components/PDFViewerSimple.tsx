import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, ExternalLink } from "lucide-react";
import type { PDFDocument } from "@/types/pdf-document";

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
}

export default function PDFViewerSimple({ document, onClose }: PDFViewerProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (document.pdfData) {
      // Create data URL directly - this bypasses blob URL security issues
      const dataUrl = `data:application/pdf;base64,${document.pdfData}`;
      setPdfDataUrl(dataUrl);
      console.log('PDF data URL created:', dataUrl.substring(0, 100) + '...');
    }
  }, [document]);

  const handleDownload = () => {
    if (!document.pdfData) return;
    
    try {
      const binaryString = atob(document.pdfData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleOpenNewTab = () => {
    if (pdfDataUrl) {
      window.open(pdfDataUrl, '_blank');
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{document.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!document.pdfData}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenNewTab} disabled={!pdfDataUrl}>
              <ExternalLink className="h-4 w-4 mr-2" />
              New Tab
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-4">
          {pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              className="w-full h-full border border-gray-300 rounded"
              title={`PDF: ${document.title}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600 text-lg font-semibold mb-2">
                  Loading PDF...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}