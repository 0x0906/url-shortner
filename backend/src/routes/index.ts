import { Router } from "express";
import authRoutes from "./authRoutes";
import urlRoutes from "./urlRoutes";
import analyticsRoutes from "./analyticsRoutes";
import redirectRoutes from "./redirectRoutes";
import { healthController } from "../controllers/healthController";

const router = Router();

// Health check endpoints for Render and uptime monitoring
router.get("/health", healthController.check);
router.get("/api/health", healthController.check);

router.use("/api/auth", authRoutes);
router.use("/api/urls", urlRoutes);
router.use("/api/analytics", analyticsRoutes);
router.use(redirectRoutes);

export default router;
