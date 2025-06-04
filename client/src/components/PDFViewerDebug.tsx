import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, ExternalLink, AlertCircle } from "lucide-react";
import type { PDFDocument } from "@/types/pdf-document";

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
}

export default function PDFViewerDebug({ document, onClose }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
    console.log('PDF DEBUG:', info);
  };

  useEffect(() => {
    const processPDF = async () => {
      try {
        addDebugInfo(`Starting PDF processing for: ${document.title}`);
        addDebugInfo(`PDF data length: ${document.pdfData?.length || 0} characters`);
        
        if (!document.pdfData) {
          addDebugInfo('ERROR: No PDF data found');
          setIsProcessing(false);
          return;
        }

        // Check if the data looks like base64
        const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(document.pdfData);
        addDebugInfo(`Data appears to be base64: ${isBase64}`);
        
        if (!isBase64) {
          addDebugInfo('ERROR: PDF data does not appear to be valid base64');
          setIsProcessing(false);
          return;
        }

        // Try to decode base64
        let binaryString;
        try {
          binaryString = atob(document.pdfData);
          addDebugInfo(`Successfully decoded base64. Binary length: ${binaryString.length}`);
        } catch (error) {
          addDebugInfo(`ERROR: Failed to decode base64: ${error}`);
          setIsProcessing(false);
          return;
        }

        // Check PDF header
        const pdfHeader = binaryString.substring(0, 4);
        addDebugInfo(`PDF header: ${pdfHeader} (should be %PDF)`);
        
        if (!pdfHeader.startsWith('%PDF')) {
          addDebugInfo('ERROR: Invalid PDF header - data is not a valid PDF');
          setIsProcessing(false);
          return;
        }

        // Create Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        addDebugInfo(`Created Uint8Array with ${bytes.length} bytes`);

        // Create blob
        const blob = new Blob([bytes], { type: 'application/pdf' });
        addDebugInfo(`Created blob with size: ${blob.size} bytes, type: ${blob.type}`);

        // Create object URL
        const url = URL.createObjectURL(blob);
        addDebugInfo(`Created object URL: ${url.substring(0, 50)}...`);
        
        setPdfUrl(url);
        setIsProcessing(false);
        addDebugInfo('PDF processing completed successfully');

      } catch (error) {
        addDebugInfo(`CRITICAL ERROR: ${error}`);
        setIsProcessing(false);
      }
    };

    processPDF();

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [document]);

  const handleDownload = () => {
    addDebugInfo('Starting download process');
    try {
      if (!document.pdfData) {
        addDebugInfo('ERROR: No PDF data for download');
        return;
      }

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
      addDebugInfo('Download completed successfully');
    } catch (error) {
      addDebugInfo(`Download failed: ${error}`);
    }
  };

  const handleOpenNewTab = () => {
    addDebugInfo('Opening PDF in new tab');
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      addDebugInfo('New tab opened successfully');
    } else {
      addDebugInfo('ERROR: No PDF URL available for new tab');
    }
  };

  const handleClose = () => {
    addDebugInfo('Closing PDF viewer');
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{document.title}</h3>
            <div className="text-sm text-gray-500 ml-2">
              ({document.pdfData?.length || 0} chars loaded)
            </div>
            {isProcessing && (
              <div className="text-sm text-blue-600 animate-pulse">Processing...</div>
            )}
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
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
              disabled={!pdfUrl}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* PDF Viewer */}
          <div className="flex-1 p-4">
            {isProcessing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <div className="text-lg font-semibold text-gray-600">Processing PDF...</div>
                  <div className="text-sm text-gray-500">Please wait while we prepare the document</div>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border border-gray-300 rounded"
                title={`PDF: ${document.title}`}
                onLoad={() => addDebugInfo('PDF iframe loaded successfully')}
                onError={() => addDebugInfo('ERROR: PDF iframe failed to load')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <div className="text-red-600 text-lg font-semibold mb-2">
                    Failed to Load PDF
                  </div>
                  <div className="text-gray-500 mb-2">
                    Document: {document.title}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    Check the debug panel for detailed error information
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!document.pdfData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Try Download Instead
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Debug Panel */}
          <div className="w-80 border-l bg-gray-50 p-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Debug Information
            </h4>
            <div className="space-y-1 text-xs font-mono bg-white p-2 rounded border max-h-96 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className={`${info.includes('ERROR') ? 'text-red-600' : info.includes('SUCCESS') ? 'text-green-600' : 'text-gray-600'}`}>
                  {info}
                </div>
              ))}
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-600">
                <strong>Document ID:</strong> {document.id}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Title:</strong> {document.title}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Type:</strong> {document.type || 'Unknown'}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Data Length:</strong> {document.pdfData?.length || 0} chars
              </div>
              <div className="text-xs text-gray-600">
                <strong>Has Data:</strong> {document.pdfData ? 'Yes' : 'No'}
              </div>
              {document.pdfData && (
                <div className="text-xs text-gray-600">
                  <strong>First 20 chars:</strong> {document.pdfData.substring(0, 20)}...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}