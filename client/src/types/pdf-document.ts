export interface PDFDocument {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  pdfData: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  lastUpdated: Date;
}

export interface DocumentCardProps {
  document: PDFDocument;
  onOpenDocument: (document: PDFDocument) => void;
}