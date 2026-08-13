import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import opportunitiesRouter from "./opportunities.js";
import usersRouter from "./users.js";
import settingsRouter from "./settings.js";
import dashboardRouter from "./dashboard.js";
import uploadRouter from "./upload.js";
import studentRouter from "./student.js";
import applicationsRouter from "./applications.js";
import aiRouter from "./ai.js";
import storageRouter from "./storage.js";
import jobsRouter from "./jobs.js";
import scraperRouter from "./scraper.js";
import seoRouter from "./seo.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/opportunities", opportunitiesRouter);
router.use("/users", usersRouter);
router.use("/settings", settingsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/upload", uploadRouter);
router.use("/student", studentRouter);
router.use("/applications", applicationsRouter);
router.use("/ai", aiRouter);
router.use(storageRouter);
router.use(jobsRouter);
router.use(scraperRouter);
router.use(seoRouter);

export default router;
