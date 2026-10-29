import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as analyticsService from "../services/analyticsService";

const router = Router();

router.get("/dashboard", requireAuth, async (req: Request, res: Response) => {
  const data = await analyticsService.getUserDashboardAnalytics(req.userId!);
  res.json({ success: true, data });
});

router.get("/url/:id", requireAuth, async (req: Request, res: Response) => {
  const data = await analyticsService.getUrlAnalytics(req.params.id, req.userId!);
  res.json({ success: true, data });
});

export default router;
