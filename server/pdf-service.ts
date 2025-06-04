import { db } from "./db";
import { pdfDocuments } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

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

export class PDFService {
  async getAllDocuments(): Promise<PDFDocument[]> {
    try {
      console.log("PDF SERVICE: Fetching all PDF documents");
      
      const docs = await db
        .select()
        .from(pdfDocuments)
        .orderBy(desc(pdfDocuments.updatedAt));
      
      console.log(`PDF SERVICE: Found ${docs.length} documents in database`);
      
      const transformedDocs = docs.map(doc => {
        const transformed: PDFDocument = {
          id: doc.id.toString(),
          title: doc.title,
          description: doc.description || `${doc.title} - Australian Defence Force Document`,
          type: doc.type,
          category: doc.category,
          pdfData: doc.pdfData,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          contentType: doc.contentType || 'application/pdf',
          lastUpdated: doc.updatedAt || new Date()
        };
        
        console.log(`PDF SERVICE: Document ${doc.id} - ${doc.title} has PDF data: ${!!doc.pdfData} (${doc.pdfData?.length || 0} chars)`);
        
        return transformed;
      });
      
      console.log("PDF SERVICE: All documents transformed successfully");
      return transformedDocs;
      
    } catch (error) {
      console.error("PDF SERVICE: Error fetching documents:", error);
      throw new Error("Failed to fetch PDF documents");
    }
  }
  
  async getDocumentById(id: string): Promise<PDFDocument | null> {
    try {
      console.log(`PDF SERVICE: Fetching document by ID: ${id}`);
      
      const docs = await db
        .select()
        .from(pdfDocuments)
        .where(eq(pdfDocuments.id, parseInt(id)));
      
      if (docs.length === 0) {
        console.log(`PDF SERVICE: Document with ID ${id} not found`);
        return null;
      }
      
      const doc = docs[0];
      const transformed: PDFDocument = {
        id: doc.id.toString(),
        title: doc.title,
        description: doc.description || `${doc.title} - Australian Defence Force Document`,
        type: doc.type,
        category: doc.category,
        pdfData: doc.pdfData,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        contentType: doc.contentType || 'application/pdf',
        lastUpdated: doc.updatedAt || new Date()
      };
      
      console.log(`PDF SERVICE: Document ${id} retrieved with PDF data: ${!!doc.pdfData} (${doc.pdfData?.length || 0} chars)`);
      
      return transformed;
      
    } catch (error) {
      console.error(`PDF SERVICE: Error fetching document ${id}:`, error);
      throw new Error(`Failed to fetch document ${id}`);
    }
  }
}

export const pdfService = new PDFService();