import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import opportunitiesRouter from "./opportunities.js";
import usersRouter from "./users.js";
import settingsRouter from "./settings.js";
import dashboardRouter from "./dashboard.js";
import uploadRouter from "./upload.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/opportunities", opportunitiesRouter);
router.use("/users", usersRouter);
router.use("/settings", settingsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/upload", uploadRouter);

export default router;
