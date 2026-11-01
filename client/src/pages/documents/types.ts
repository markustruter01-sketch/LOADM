import type { Document, DocumentSubmission, PublicUser } from "@shared/schema";

/** GET /api/documents row. */
export type DocumentListItem = Document & { submissionCount: number };

/** GET /api/documents/submissions row (`user` is attached for every row; null if the user was removed). */
export type DocumentSubmissionRow = DocumentSubmission & {
  document: { id: number; title: string; type?: string };
  user?: PublicUser | null;
};

/** POST /api/documents/:id/submissions response. */
export type CreatedDocumentSubmission = DocumentSubmission & { document: { id: number; title: string; type?: string } };
