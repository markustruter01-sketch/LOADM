import { Router } from "express";
import { z } from "zod";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "../db";
import {
  documents, documentSubmissions, insertDocumentSchema, insertDocumentSubmissionSchema,
  type Document, type DocumentSubmission,
} from "@shared/schema";
import { roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";

const toClientDocument = (d: Document) => ({ ...d, lastUpdated: d.updatedAt });
const toClientSubmission = (s: DocumentSubmission) => ({ ...s, submissionDate: s.submittedAt });

export const documentsRouter = Router();

documentsRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(documents).orderBy(asc(documents.title));
    res.json(rows.map(toClientDocument));
  }),
);

documentsRouter.post(
  "/",
  requireInstruct,
  validate(insertDocumentSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertDocumentSchema>;
    const [row] = await db.insert(documents).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Document", resourceId: row.id, resourceName: row.title });
    res.status(201).json(toClientDocument(row));
  }),
);

documentsRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const [row] = await db.select().from(documents).where(eq(documents.id, parseId(req.params.id))).limit(1);
    if (!row) throw new NotFound("Document");
    res.json(toClientDocument(row));
  }),
);

const updateDocumentSchema = insertDocumentSchema.partial();

documentsRouter.put(
  "/:id",
  requireInstruct,
  validate(updateDocumentSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof updateDocumentSchema>;
    const [row] = await db.update(documents).set(b).where(eq(documents.id, parseId(req.params.id))).returning();
    if (!row) throw new NotFound("Document");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Document", resourceId: row.id, resourceName: row.title });
    res.json(toClientDocument(row));
  }),
);

/** Hard delete: submissions cascade with the template. */
documentsRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .delete(documents)
      .where(eq(documents.id, parseId(req.params.id)))
      .returning({ id: documents.id, title: documents.title });
    if (!row) throw new NotFound("Document");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Document", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

// ---- Submissions: /api/document-submissions --------------------------------

export const documentSubmissionsRouter = Router();

/** Newest first. Instructors see every submission; others their own. */
documentSubmissionsRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const rows = await db
      .select()
      .from(documentSubmissions)
      .where(roleHas(me.role, "instruct") ? undefined : eq(documentSubmissions.userId, me.id))
      .orderBy(desc(documentSubmissions.submittedAt));
    res.json(rows.map(toClientSubmission));
  }),
);

documentSubmissionsRouter.post(
  "/",
  requirePersona,
  validate(insertDocumentSubmissionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertDocumentSubmissionSchema>;
    const [doc] = await db.select().from(documents).where(eq(documents.id, b.documentId)).limit(1);
    if (!doc) throw new NotFound("Document");
    const [row] = await db.insert(documentSubmissions).values({ documentId: doc.id, userId: me.id, formData: b.formData }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "DocumentSubmission", resourceId: row.id, resourceName: doc.title });
    res.status(201).json(toClientSubmission(row));
  }),
);
