import { Router, Request, Response } from "express";

const router = Router();

router.get("/:shortCode", (req: Request, res: Response) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  res.redirect(302, clientUrl + "/redirect/" + req.params.shortCode);
});

export default router;
