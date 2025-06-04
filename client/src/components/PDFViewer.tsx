import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";
import type { PDFDocument } from "@/types/pdf-document";

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
}

export default function PDFViewer({ document, onClose }: PDFViewerProps) {
  const handleDownload = () => {
    console.log('Downloading PDF:', document.title);
    const link = window.document.createElement('a');
    link.href = `data:application/pdf;base64,${document.pdfData}`;
    link.download = `${document.title}.pdf`;
    link.click();
  };

  const handleOpenNewTab = () => {
    console.log('Opening PDF in new tab:', document.title);
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>${document.title}</title></head>
        <body style="margin:0;">
          <iframe 
            src="data:application/pdf;base64,${document.pdfData}" 
            style="width:100%;height:100vh;border:none;"
            title="${document.title}">
          </iframe>
        </body>
        </html>
      `);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold">{document.title}</h2>
            <div className="text-sm text-gray-500">
              PDF Data: {document.pdfData ? `${document.pdfData.length} characters loaded` : 'No data'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-4">
          {document.pdfData ? (
            <iframe
              src={`data:application/pdf;base64,${document.pdfData}`}
              className="w-full h-full border border-gray-300 rounded"
              title={`PDF: ${document.title}`}
              onLoad={() => {
                console.log('PDF iframe loaded successfully for:', document.title);
              }}
              onError={(e) => {
                console.error('PDF iframe failed to load for:', document.title, e);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-600 text-lg font-semibold mb-2">
                  PDF Data Not Available
                </div>
                <div className="text-gray-500">
                  Document: {document.title}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  ID: {document.id} | Type: {document.type}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}