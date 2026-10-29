import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/dashboard", requireAuth, analyticsController.getDashboardAnalytics);
router.get("/url/:id", requireAuth, analyticsController.getUrlAnalytics);

export default router;
