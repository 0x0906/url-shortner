import { Request, Response, NextFunction } from "express";
import { verifyToken, generateAccessToken } from "../utils/jwt";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Session } from "../entity/Session";

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
  const userRepo = AppDataSource.getRepository(User);
  const sessionRepo = AppDataSource.getRepository(Session);

  let token = req.cookies?.token;
  if (!token || token === "none") {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token || token === "none") {
    await attemptRefresh(req, res, userRepo, sessionRepo);
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;
    const sessionId = decoded.sessionId;

    if (sessionId) {
      const session = await sessionRepo.findOne({ where: { id: sessionId } });
      if (!session) {
        return next();
      }
    }

    const user = await userRepo.findOne({ where: { id: userId } });
    if (user) {
      setUserOnRequest(req, user);
    }
  } catch {
    await attemptRefresh(req, res, userRepo, sessionRepo);
  }

  next();
}

async function attemptRefresh(
  req: Request,
  res: Response,
  userRepo: any,
  sessionRepo: any
) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken || refreshToken === "none") return;

  try {
    const session = await sessionRepo.findOne({ where: { refreshToken } });
    if (session && new Date(session.expiresAt) > new Date()) {
      const newAccessToken = generateAccessToken(session.userId, session.id);

      res.cookie("token", newAccessToken, {
        httpOnly: true,
        path: "/",
        secure: false,
        maxAge: 15 * 60 * 1000,
      });

      const user = await userRepo.findOne({ where: { id: session.userId } });
      if (user) {
        setUserOnRequest(req, user);
      }
    }
  } catch {
  }
}

function setUserOnRequest(req: Request, user: User) {
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt.toISOString(),
  };
  req.userId = user.id;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}
