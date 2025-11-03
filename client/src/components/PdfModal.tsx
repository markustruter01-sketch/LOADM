import { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/PdfViewer';
import { 
  Download, 
  Mail
} from 'lucide-react';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  title: string;
}

export default function PdfModal({ isOpen, onClose, filename, title }: PdfModalProps) {
  const pdfUrl = `/pdfs/${encodeURIComponent(filename)}`;

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, filename]);

  const handleSend = useCallback(async () => {
    try {
      // Try to use the Web Share API first (modern browsers)
      if (navigator.share && navigator.canShare) {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'application/pdf' });
        
        const shareData = {
          title: title,
          text: `Document: ${title}`,
          files: [file]
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      
      // Fallback to mailto with download link
      const subject = encodeURIComponent(`Document: ${title}`);
      const body = encodeURIComponent(
        `Please find the document: ${title}\n\n` +
        `Filename: ${filename}\n\n` +
        `To access this document, please download it from: ${window.location.origin}${pdfUrl}\n\n` +
        `Note: Right-click the link above and select "Save link as..." to download the PDF file.`
      );
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoUrl);
    } catch (error) {
      console.error('Error sharing document:', error);
      // Fallback to simple mailto
      const subject = encodeURIComponent(`Document: ${title}`);
      const body = encodeURIComponent(`Please find the attached document: ${filename}`);
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoUrl);
    }
  }, [title, filename, pdfUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold pr-4">{title}</DialogTitle>
            <div className="flex items-center gap-3 mr-8">
              <Button
                onClick={handleDownload}
                size="sm"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={handleSend}
                size="sm"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-send-pdf"
              >
                <Mail className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="sr-only">
          PDF document viewer for {title}
        </DialogDescription>

        <div className="flex-1 overflow-hidden">
          {isOpen && (
            <PdfViewer 
              file={filename} 
              height={650}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}