import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import * as urlService from "../services/urlService";

const router = Router();

router.post(
  "/",
  validate([
    body("original_url").notEmpty(),
  ]),
  async (req: Request, res: Response) => {
    const { original_url, custom_alias, expires_at, password, is_one_time } = req.body;
    const userId = req.userId || null;

    const url = await urlService.createShortUrl(
      original_url,
      custom_alias || null,
      expires_at || null,
      password || null,
      is_one_time || false,
      userId
    );

    res.status(201).json({ success: true, data: url });
  }
);

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const isActiveParam = req.query.is_active;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  let isActive: boolean | undefined;
  if (isActiveParam === "true") isActive = true;
  else if (isActiveParam === "false") isActive = false;

  const result = await urlService.getUrls(req.userId!, search, isActive, page, limit);

  res.json({
    success: true,
    urls: result.urls,
    pagination: result.pagination,
  });
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const url = await urlService.updateUrl(req.params.id, req.userId!, req.body);
  res.json({ success: true, data: url });
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  await urlService.deleteUrl(req.params.id, req.userId!);
  res.json({ success: true, message: "URL successfully deleted." });
});

router.post("/resolve/:shortCode", async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";
  const password = req.body?.password || null;

  const result = await urlService.resolveUrlAndTrackVisit(
    req.params.shortCode,
    ip,
    userAgent,
    password
  );

  res.json({ success: true, data: result });
});

export default router;
