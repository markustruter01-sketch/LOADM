import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, 
  Mail,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  title: string;
}

export default function PdfModal({ isOpen, onClose, filename, title }: PdfModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = `/pdfs/${encodeURIComponent(filename)}`;

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError('Failed to load PDF document');
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, filename]);

  const handleSend = useCallback(() => {
    const subject = encodeURIComponent(`Document: ${title}`);
    const body = encodeURIComponent(`Please find the attached document: ${filename}\n\nDocument can be accessed at: ${window.location.origin}${pdfUrl}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoUrl);
  }, [title, filename, pdfUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={handleSend}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Send
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          )}

          {error && (
            <Card className="m-6">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading PDF</h3>
                <p className="text-muted-foreground text-center mb-4">{error}</p>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              </CardContent>
            </Card>
          )}

          <iframe
            src={pdfUrl}
            className={`w-full h-[70vh] border-0 ${loading ? 'hidden' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}