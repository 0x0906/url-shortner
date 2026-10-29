import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { userModel } from "../models/userModel";
import { sessionModel } from "../models/sessionModel";
import { generateAccessToken } from "../utils/jwt";
import { getDeviceName } from "../utils/userAgent";
import { ApiError } from "../utils/ApiError";
import { normalizeEmail } from "../utils/emailNormalizer";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/mail";

const isProduction =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("https://")) ||
  Boolean(process.env.CLIENT_URL && process.env.CLIENT_URL.startsWith("https://"));

export function setTokenCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
}

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearCookies(res: Response) {
  res.cookie("token", "none", {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 0,
  });
  res.cookie("refreshToken", "none", {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 0,
  });
}

export const authController = {
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const cleanEmail = normalizeEmail(email);

    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      throw new ApiError("Email address is already registered.", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomUUID();

    const user = await userModel.createUser(
      name,
      cleanEmail,
      passwordHash,
      verificationToken,
      false
    );

    await sendVerificationEmail(cleanEmail, verificationToken);

    const senderEmail = process.env.SMTP_USER || "vignesh.m.dev.0906@gmail.com";

    res.status(201).json({
      success: true,
      message: `Registration successful! Verification link sent to ${cleanEmail} from ${senderEmail}. Please also check your spam folder.`,
      senderEmail,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const cleanEmail = normalizeEmail(email);
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "";

    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      throw new ApiError("Invalid email or password.", 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new ApiError("Invalid email or password.", 401);
    }

    if (!user.is_verified) {
      const senderEmail = process.env.SMTP_USER || "vignesh.m.dev.0906@gmail.com";
      throw new ApiError(
        `Please verify your email before logging in. Verification link was sent to ${user.email} from ${senderEmail}. Please also check your spam folder.`,
        401
      );
    }

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const deviceName = getDeviceName(userAgent);

    const session = await sessionModel.upsertSession(
      user.id,
      refreshToken,
      deviceName,
      ipAddress,
      expiresAt
    );

    const accessToken = generateAccessToken(user.id, session.id);

    setTokenCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && refreshToken !== "none") {
      await sessionModel.deleteByRefreshToken(refreshToken);
    }
    clearCookies(res);
    res.json({ success: true, message: "Logged out successfully." });
  },

  async getMe(req: Request, res: Response) {
    res.json({ success: true, user: req.user });
  },

  async verifyEmail(req: Request, res: Response) {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.redirect(`${clientUrl}/login?error=invalid_token`);
      }

      const user = await userModel.findByVerificationToken(token);
      if (!user) {
        return res.redirect(`${clientUrl}/login?error=invalid_token`);
      }

      await userModel.verifyUser(user.id);
      return res.redirect(`${clientUrl}/login?verified=true`);
    } catch {
      return res.redirect(`${clientUrl}/login?error=invalid_token`);
    }
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken || refreshToken === "none") {
      throw new ApiError("No refresh token provided.", 401);
    }

    const session = await sessionModel.findByRefreshToken(refreshToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      if (session) {
        await sessionModel.deleteById(session.id);
      }
      throw new ApiError("Invalid or expired session. Please log in again.", 401);
    }

    const accessToken = generateAccessToken(session.user_id, session.id);
    setTokenCookie(res, accessToken);

    res.json({ success: true });
  },

  async getSessions(req: Request, res: Response) {
    const currentRefreshToken = req.cookies?.refreshToken;
    const sessions = await sessionModel.findByUserId(req.userId!);

    const sessionsWithCurrent = sessions.map((s) => ({
      id: s.id,
      device_name: s.device_name,
      ip_address: s.ip_address,
      created_at: s.created_at,
      is_current: s.refresh_token === currentRefreshToken,
    }));

    res.json({ success: true, sessions: sessionsWithCurrent });
  },

  async terminateSession(req: Request, res: Response) {
    const deleted = await sessionModel.deleteById(req.params.id, req.userId!);
    if (!deleted) {
      throw new ApiError("Session not found.", 404);
    }
    res.json({ success: true, message: "Session terminated successfully." });
  },

  async logoutAll(req: Request, res: Response) {
    await sessionModel.deleteAllForUser(req.userId!);
    clearCookies(res);
    res.json({ success: true, message: "Logged out from all devices successfully." });
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const cleanEmail = normalizeEmail(email);
    try {
      const user = await userModel.findByEmail(cleanEmail);
      if (user) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await userModel.setResetToken(user.id, hashedToken, expiresAt);
        await sendPasswordResetEmail(cleanEmail, rawToken);
      }
    } catch {}

    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  },

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findByResetToken(hashedToken);
    if (!user) {
      throw new ApiError("Invalid or expired password reset token.", 400);
    }

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      throw new ApiError("Invalid or expired password reset token.", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userModel.resetPassword(user.id, passwordHash);
    await sessionModel.deleteAllForUser(user.id);
    clearCookies(res);

    res.json({
      success: true,
      message: "Password has been successfully reset. You can now log in with your new password.",
    });
  },

  async changePassword(req: Request, res: Response) {
    const { oldPassword, newPassword } = req.body;
    const user = await userModel.findById(req.userId!);
    if (!user) {
      throw new ApiError("User not found.", 404);
    }

    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) {
      throw new ApiError("Incorrect current password.", 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(user.id, passwordHash);

    res.json({ success: true, message: "Password changed successfully." });
  },
};
