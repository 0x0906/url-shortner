import { Request, Response } from "express";
import { query } from "../config/db";

export const healthController = {
  async check(_req: Request, res: Response) {
    try {
      await query("SELECT 1");
      res.status(200).json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (err: any) {
      res.status(503).json({
        status: "degraded",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: err.message,
      });
    }
  },
};
