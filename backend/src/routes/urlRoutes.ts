import { Router } from "express";
import { body } from "express-validator";
import { urlController } from "../controllers/urlController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post(
  "/",
  validate([body("original_url").notEmpty().withMessage("Original URL is required")]),
  urlController.createShortUrl
);

router.get("/", requireAuth, urlController.getUrls);

router.put("/:id", requireAuth, urlController.updateUrl);

router.delete("/:id", requireAuth, urlController.deleteUrl);

router.post("/resolve/:shortCode", urlController.resolveUrl);

export default router;
