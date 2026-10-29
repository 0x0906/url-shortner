import { Router } from "express";
import { redirectController } from "../controllers/redirectController";

const router = Router();

router.get("/:shortCode", redirectController.redirect);

export default router;
