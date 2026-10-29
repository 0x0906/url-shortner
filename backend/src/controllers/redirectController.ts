import { Request, Response } from "express";

export const redirectController = {
  redirect(req: Request, res: Response) {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    res.redirect(302, `${clientUrl}/redirect/${req.params.shortCode}`);
  },
};
