import { Router } from "express";
import { peopleRouter } from "./people";
import { licensingRouter } from "./licensing";
import { quizzesRouter, instructorQuizSubmissionsRouter } from "./quizzes";
import { quizQuestionsRouter } from "./quiz-questions";
import { scenariosRouter, scenarioSubmissionsRouter } from "./scenarios";
import { trainingModulesRouter, trainingAssessmentsRouter } from "./training";
import { documentsRouter, documentSubmissionsRouter } from "./documents";
import { missionsRouter } from "./missions";
import { checklistsRouter, instructorChecklistsRouter } from "./checklists";
import { directoryRouter } from "./directory";
import { chatRouter } from "./chat";
import { safetyRouter } from "./safety";
import { activityRouter } from "./activity";
import { analyticsRouter } from "./analytics";

/**
 * Every API route is mounted exactly once, here, at the path the client
 * calls. Routers own their own authorisation and validation.
 */
export const apiRouter = Router();

// People: /profile, /user/*, /instructor/users, /instructor/user-report/:id, /workforce/*, /auth/user, /logout
apiRouter.use(peopleRouter);
apiRouter.use("/licensing", licensingRouter);

apiRouter.use("/quizzes", quizzesRouter);
apiRouter.use("/instructor/quiz-submissions", instructorQuizSubmissionsRouter);
apiRouter.use("/quiz-questions", quizQuestionsRouter);
apiRouter.use("/scenarios", scenariosRouter);
apiRouter.use("/scenario-submissions", scenarioSubmissionsRouter);
apiRouter.use("/training-modules", trainingModulesRouter);
apiRouter.use("/training-assessments", trainingAssessmentsRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/document-submissions", documentSubmissionsRouter);

apiRouter.use("/missions", missionsRouter);
apiRouter.use("/checklists", checklistsRouter);
apiRouter.use("/instructor/checklists", instructorChecklistsRouter);
apiRouter.use("/phone-directory", directoryRouter);
apiRouter.use("/chat-messages", chatRouter);
apiRouter.use("/safety-records", safetyRouter);
apiRouter.use("/activity-log", activityRouter);

apiRouter.use("/analytics", analyticsRouter);
