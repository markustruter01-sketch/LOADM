import { useRoute } from 'wouter';
import { Helmet } from 'react-helmet';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import PdfViewer from '@/components/PdfViewer';

export default function PdfViewerPage() {
  const [match, params] = useRoute('/documents/pdf/:filename');
  
  if (!match || !params?.filename) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Helmet>
          <title>PDF Not Found - LOADMworkflow</title>
        </Helmet>
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">PDF Not Found</h1>
        <p className="text-muted-foreground mb-6">The requested PDF document could not be found.</p>
        <Link href="/documents">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  const pdfUrl = `/pdfs/${params.filename}`;
  const documentTitle = params.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{documentTitle} - PDF Viewer - LOADMworkflow</title>
        <meta name="description" content={`View PDF document: ${documentTitle}`} />
      </Helmet>
      
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/documents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">{documentTitle}</h1>
                <p className="text-sm text-muted-foreground">PDF Document</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PdfViewer 
          file={pdfUrl}
          className="shadow-lg"
          height={800}
        />
      </div>
    </div>
  );
}