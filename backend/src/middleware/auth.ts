import { Request, Response, NextFunction } from "express";
import { verifyToken, generateAccessToken } from "../utils/jwt";
import { userModel, IUser } from "../models/userModel";
import { sessionModel } from "../models/sessionModel";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        created_at: string;
      };
      userId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;
  if (!token || token === "none") {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token || token === "none") {
    await attemptRefresh(req, res);
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;
    const sessionId = decoded.sessionId;

    if (sessionId) {
      const session = await sessionModel.findById(sessionId);
      if (!session) {
        return next();
      }
    }

    const user = await userModel.findById(userId);
    if (user) {
      setUserOnRequest(req, user);
    }
  } catch {
    await attemptRefresh(req, res);
  }

  next();
}

async function attemptRefresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken || refreshToken === "none") return;

  try {
    const session = await sessionModel.findByRefreshToken(refreshToken);
    if (session && new Date(session.expires_at) > new Date()) {
      const newAccessToken = generateAccessToken(session.user_id, session.id);

      res.cookie("token", newAccessToken, {
        httpOnly: true,
        path: "/",
        secure: false,
        maxAge: 15 * 60 * 1000,
      });

      const user = await userModel.findById(session.user_id);
      if (user) {
        setUserOnRequest(req, user);
      }
    }
  } catch {
  }
}

function setUserOnRequest(req: Request, user: IUser) {
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
  };
  req.userId = user.id;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}
