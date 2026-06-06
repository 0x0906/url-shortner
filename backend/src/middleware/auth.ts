import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import ErrorResponse from '../utils/errorResponse';
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    created_at: Date;
  };
}
interface DecodedToken {
  id: string;
  sessionId?: string;
}
const attemptRefresh = async (req: AuthRequest, res: Response): Promise<boolean> => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return false;
  try {
    const session = await prisma.session.findUnique({
      where: { refresh_token: refreshToken }
    });
    if (session && session.expires_at > new Date()) {
      const newAccessToken = jwt.sign({ id: session.user_id, sessionId: session.id }, process.env.JWT_SECRET as string, {
        expiresIn: '15m'
      });
      const user = await prisma.user.findUnique({
        where: { id: session.user_id },
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true
        }
      });
      if (user) {
        const accessCookieOptions = {
          expires: new Date(Date.now() + 15 * 60 * 1000),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
        };
        res.cookie('token', newAccessToken, accessCookieOptions);
        req.user = user;
        return true;
      }
    }
  } catch (err) {
  }
  return false;
};
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    const refreshed = await attemptRefresh(req, res);
    if (refreshed) return next();
    return next(new ErrorResponse('Access denied. No token provided.', 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId }
      });
      if (!session) {
        return next(new ErrorResponse('Session has been terminated.', 401));
      }
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true
      }
    });
    if (!user) {
      return next(new ErrorResponse('User associated with this token no longer exists.', 401));
    }
    req.user = user;
    next();
  } catch (error) {
    const refreshed = await attemptRefresh(req, res);
    if (refreshed) return next();
    return next(new ErrorResponse('Access denied. Invalid or expired token.', 401));
  }
};
export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    await attemptRefresh(req, res);
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId }
      });
      if (!session) {
        return next();
      }
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true
      }
    });
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    await attemptRefresh(req, res);
    next();
  }
};
