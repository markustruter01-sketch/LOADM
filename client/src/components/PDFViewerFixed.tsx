import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, ExternalLink, AlertCircle, Eye } from "lucide-react";
import type { PDFDocument } from "@/types/pdf-document";

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
}

export default function PDFViewerFixed({ document, onClose }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [renderMethod, setRenderMethod] = useState<'iframe' | 'embed' | 'object' | 'newTab'>('iframe');

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
    console.log('PDF DEBUG:', info);
  };

  useEffect(() => {
    const processPDF = async () => {
      try {
        addDebugInfo(`Starting PDF processing for: ${document.title}`);
        
        if (!document.pdfData) {
          addDebugInfo('ERROR: No PDF data found');
          setIsProcessing(false);
          return;
        }

        // Create blob with proper MIME type and additional options
        const binaryString = atob(document.pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Try multiple blob creation methods
        const blob = new Blob([bytes], { 
          type: 'application/pdf'
        });
        
        addDebugInfo(`Created blob: ${blob.size} bytes, type: ${blob.type}`);
        
        const url = URL.createObjectURL(blob);
        addDebugInfo(`Created object URL: ${url}`);
        
        // Test if the URL is accessible
        try {
          const response = await fetch(url);
          addDebugInfo(`URL fetch test: ${response.ok ? 'SUCCESS' : 'FAILED'} - Status: ${response.status}`);
        } catch (error) {
          addDebugInfo(`URL fetch test failed: ${error}`);
        }
        
        setPdfUrl(url);
        setIsProcessing(false);
        addDebugInfo('PDF processing completed - ready for display');

      } catch (error) {
        addDebugInfo(`CRITICAL ERROR: ${error}`);
        setIsProcessing(false);
      }
    };

    processPDF();

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
      const newWindow = window.open(pdfUrl, '_blank');
      if (newWindow) {
        addDebugInfo('New tab opened successfully');
        // Add viewer controls to the new window
        newWindow.document.title = document.title;
      } else {
        addDebugInfo('ERROR: Failed to open new tab (popup blocked?)');
      }
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

  const renderPDFContent = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-600">Processing PDF...</div>
          </div>
        </div>
      );
    }

    if (!pdfUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <div className="text-red-600 text-lg font-semibold mb-2">Failed to Process PDF</div>
            <Button onClick={handleDownload} disabled={!document.pdfData}>
              <Download className="h-4 w-4 mr-2" />
              Download Instead
            </Button>
          </div>
        </div>
      );
    }

    // Render based on selected method
    switch (renderMethod) {
      case 'iframe':
        return (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border border-gray-300 rounded"
            title={`PDF: ${document.title}`}
            onLoad={() => addDebugInfo('PDF iframe loaded successfully')}
            onError={() => {
              addDebugInfo('ERROR: PDF iframe failed - trying embed method');
              setRenderMethod('embed');
            }}
          />
        );
      
      case 'embed':
        return (
          <embed
            src={pdfUrl}
            type="application/pdf"
            className="w-full h-full border border-gray-300 rounded"
            title={`PDF: ${document.title}`}
            onLoad={() => addDebugInfo('PDF embed loaded successfully')}
            onError={() => {
              addDebugInfo('ERROR: PDF embed failed - trying object method');
              setRenderMethod('object');
            }}
          />
        );
      
      case 'object':
        return (
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full border border-gray-300 rounded"
            title={`PDF: ${document.title}`}
            onLoad={() => addDebugInfo('PDF object loaded successfully')}
            onError={() => {
              addDebugInfo('ERROR: PDF object failed - using new tab method');
              setRenderMethod('newTab');
              handleOpenNewTab();
            }}
          >
            <p className="text-center p-8">
              Your browser cannot display this PDF. 
              <Button onClick={handleDownload} className="ml-2">
                Download PDF
              </Button>
            </p>
          </object>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <div className="text-gray-600 text-lg font-semibold mb-4">
                PDF opened in new tab
              </div>
              <div className="space-x-2">
                <Button onClick={handleOpenNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Again
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{document.title}</h3>
            <div className="text-sm text-gray-500 ml-2">
              ({document.pdfData?.length || 0} chars)
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Render method selector */}
            <select 
              value={renderMethod} 
              onChange={(e) => {
                const method = e.target.value as typeof renderMethod;
                setRenderMethod(method);
                addDebugInfo(`Switched to ${method} render method`);
              }}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="iframe">IFrame</option>
              <option value="embed">Embed</option>
              <option value="object">Object</option>
              <option value="newTab">New Tab</option>
            </select>
            
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!document.pdfData}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenNewTab} disabled={!pdfUrl}>
              <ExternalLink className="h-4 w-4 mr-2" />
              New Tab
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* PDF Viewer */}
          <div className="flex-1 p-4">
            {renderPDFContent()}
          </div>

          {/* Compact Debug Panel */}
          <div className="w-80 border-l bg-gray-50 p-4 flex-shrink-0">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Debug Log
            </h4>
            <div className="space-y-1 text-xs font-mono bg-white p-2 rounded border max-h-40 overflow-y-auto mb-4">
              {debugInfo.slice(-10).map((info, index) => (
                <div key={index} className={`${info.includes('ERROR') ? 'text-red-600' : info.includes('SUCCESS') ? 'text-green-600' : 'text-gray-600'}`}>
                  {info}
                </div>
              ))}
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Document:</strong> {document.title}</div>
              <div><strong>Type:</strong> {document.type || 'PDF'}</div>
              <div><strong>Size:</strong> {document.pdfData?.length || 0} chars</div>
              <div><strong>Method:</strong> {renderMethod}</div>
              <div><strong>Status:</strong> {isProcessing ? 'Processing' : pdfUrl ? 'Ready' : 'Failed'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}