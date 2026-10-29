import { Request, Response, NextFunction } from "express";

const API_MAX = parseInt(process.env.RATE_LIMIT_API_MAX || "150");
const AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX || "30");
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || "900000");

interface Bucket {
  windowStart: number;
  count: number;
}

const apiBuckets = new Map<string, Bucket>();
const authBuckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip.trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function checkLimit(buckets: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return true;
  }

  bucket.count++;
  return bucket.count <= max;
}

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const path = req.path;

  if (!path.startsWith("/api/") || path === "/api/health") {
    return next();
  }

  const clientIp = getClientIp(req);

  const strictPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ];

  const isAuthPath =
    strictPaths.includes(path) || (path === "/api/urls" && req.method === "POST");

  if (isAuthPath) {
    if (!checkLimit(authBuckets, clientIp + ":auth", AUTH_MAX)) {
      return res.status(429).json({
        success: false,
        error: "Too many authentication or creation attempts. Please try again after 15 minutes",
      });
    }
  }

  if (!checkLimit(apiBuckets, clientIp + ":api", API_MAX)) {
    return res.status(429).json({
      success: false,
      error: "Too many requests from this IP, please try again after 15 minutes",
    });
  }

  next();
}
