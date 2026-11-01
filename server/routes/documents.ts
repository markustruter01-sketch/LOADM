import { Router } from "express";
import { z } from "zod";
import { eq, desc, asc, and, sql, getTableColumns } from "drizzle-orm";
import { db } from "../db";
import { documents, documentSubmissions, insertDocumentSchema, insertDocumentSubmissionSchema } from "@shared/schema";
import { roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser, canActFor } from "../middleware/persona";
import { getUsersByIds, toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";

export const documentsRouter = Router();

// ---- Templates -----------------------------------------------------------

/** Every form template with how many times it has been submitted. */
documentsRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ ...getTableColumns(documents), submissionCount: sql<number>`count(${documentSubmissions.id})::int` })
      .from(documents)
      .leftJoin(documentSubmissions, eq(documentSubmissions.documentId, documents.id))
      .groupBy(documents.id)
      .orderBy(asc(documents.title));
    res.json(rows);
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
    res.status(201).json(row);
  }),
);

// ---- Submissions (static paths registered BEFORE /:id so "submissions" is never parsed as an id) ----

const submissionsQuery = z.object({
  documentId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

/** Instructors see every submission (with the submitter); everyone else sees their own. */
documentsRouter.get(
  "/submissions",
  requirePersona,
  validate(submissionsQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof submissionsQuery>;
    const instruct = roleHas(me.role, "instruct");
    const limit = q.limit ?? 500;
    const conds = [];
    if (!instruct) conds.push(eq(documentSubmissions.userId, me.id));
    if (q.documentId) conds.push(eq(documentSubmissions.documentId, q.documentId));
    const rows = await db
      .select({
        submission: documentSubmissions,
        document: { id: documents.id, title: documents.title, type: documents.type },
      })
      .from(documentSubmissions)
      .innerJoin(documents, eq(documents.id, documentSubmissions.documentId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(documentSubmissions.submittedAt))
      .limit(limit);
    const people = await getUsersByIds(rows.map((r) => r.submission.userId));
    res.json(
      rows.map((r) => {
        const u = people.get(r.submission.userId);
        return { ...r.submission, document: r.document, user: u ? toPublicUser(u) : null };
      }),
    );
  }),
);

/** One submission with its template. Owner or instructor. */
documentsRouter.get(
  "/submissions/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const sub = await db.query.documentSubmissions.findFirst({
      where: eq(documentSubmissions.id, id),
      with: { document: true },
    });
    if (!sub) throw new NotFound("Submission");
    if (!canActFor(me, sub.userId)) throw new Forbidden();
    const people = await getUsersByIds([sub.userId]);
    const u = people.get(sub.userId);
    res.json({ ...sub, user: u ? toPublicUser(u) : null });
  }),
);

// ---- Single template -----------------------------------------------------

documentsRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const [row] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!row) throw new NotFound("Document");
    res.json(row);
  }),
);

const updateDocumentSchema = insertDocumentSchema.partial();

documentsRouter.put(
  "/:id",
  requireInstruct,
  validate(updateDocumentSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateDocumentSchema>;
    const [row] = await db.update(documents).set(b).where(eq(documents.id, id)).returning();
    if (!row) throw new NotFound("Document");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Document", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

/** Hard delete: submissions cascade with the template. */
documentsRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.delete(documents).where(eq(documents.id, id)).returning({ id: documents.id, title: documents.title });
    if (!row) throw new NotFound("Document");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Document", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

// ---- Submit a form -------------------------------------------------------

/** The template id comes from the path; a documentId in the body is ignored. */
const submissionBody = insertDocumentSubmissionSchema.partial({ documentId: true });

documentsRouter.post(
  "/:id/submissions",
  requirePersona,
  validate(submissionBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof submissionBody>;
    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) throw new NotFound("Document");
    const [row] = await db
      .insert(documentSubmissions)
      .values({ documentId: id, userId: me.id, formData: b.formData })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "DocumentSubmission", resourceId: row.id, resourceName: doc.title });
    res.status(201).json({ ...row, document: { id: doc.id, title: doc.title, type: doc.type } });
  }),
);
