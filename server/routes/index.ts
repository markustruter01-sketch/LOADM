import { Router } from "express";
import { usersRouter } from "./users";
import { documentsRouter } from "./documents";
import { scenariosRouter } from "./scenarios";
import { quizzesRouter } from "./quizzes";
import { questionBankRouter } from "./question-bank";
import { trainingRouter } from "./training";
import { checklistsRouter } from "./checklists";
import { missionsRouter } from "./missions";
import { personnelRouter } from "./personnel";
import { analyticsRouter } from "./analytics";
import { directoryRouter } from "./directory";
import { chatRouter } from "./chat";
import { activityRouter } from "./activity";

/**
 * Every API route is mounted exactly once, here. Routers own their own
 * authorisation (persona/capability middleware) and validation.
 */
export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/scenarios", scenariosRouter);
apiRouter.use("/quizzes", quizzesRouter);
apiRouter.use("/question-bank", questionBankRouter);
apiRouter.use("/training", trainingRouter);
apiRouter.use("/checklists", checklistsRouter);
apiRouter.use("/missions", missionsRouter);
apiRouter.use("/personnel", personnelRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/directory", directoryRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/activity", activityRouter);
