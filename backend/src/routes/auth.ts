import { Router, Request, Response } from "express";
import { body, query } from "express-validator";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../errors/ApiError";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Session } from "../entity/Session";
import * as authService from "../services/authService";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

function setTokenCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearCookies(res: Response) {
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

router.post(
  "/register",
  validate([
    body("name").notEmpty().isLength({ min: 2 }),
    body("email").notEmpty().isEmail(),
    body("password")
      .notEmpty()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage("Must be 8+ characters with an uppercase, lowercase, number, and special character."),
  ]),
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const userInfo = await authService.registerUser(name, email, password);
    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      user: userInfo,
    });
  }
);

router.post(
  "/login",
  validate([
    body("email").notEmpty().isEmail(),
    body("password").notEmpty(),
  ]),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.ip || req.socket.remoteAddress || "";

    const result = await authService.loginUser(email, password, userAgent, ipAddress);

    setTokenCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);

    res.json({ success: true, user: result.user });
  }
);

router.post("/logout", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && refreshToken !== "none") {
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({ where: { refreshToken } });
    if (session) await sessionRepo.remove(session);
  }

  clearCookies(res);
  res.json({ success: true, message: "Logged out successfully." });
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, user: req.user });
});

router.get("/verify", async (req: Request, res: Response) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const token = req.query.token as string;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.redirect(clientUrl + "/login?error=invalid_token");
    }

    user.isVerified = true;
    user.verificationToken = null;
    await userRepo.save(user);

    return res.redirect(clientUrl + "/login?verified=true");
  } catch {
    return res.redirect(clientUrl + "/login?error=invalid_token");
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken || refreshToken === "none") {
    throw new ApiError("No refresh token provided.", 401);
  }

  const result = await authService.refreshAccessToken(refreshToken);
  setTokenCookie(res, result.accessToken);

  res.json({ success: true });
});

router.get("/sessions", requireAuth, async (req: Request, res: Response) => {
  const currentRefreshToken = req.cookies?.refreshToken;
  const sessions = await authService.getActiveSessions(req.userId!);

  const sessionsWithCurrent = sessions.map((s: any) => {
    const copy = { ...s };
    copy.is_current = s.refresh_token === currentRefreshToken;
    delete copy.refresh_token;
    return copy;
  });

  res.json({ success: true, sessions: sessionsWithCurrent });
});

router.delete("/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  await authService.terminateSession(req.userId!, req.params.id);
  res.json({ success: true, message: "Session terminated successfully." });
});

router.post("/logout-all", requireAuth, async (req: Request, res: Response) => {
  await authService.terminateAllSessions(req.userId!);
  clearCookies(res);
  res.json({ success: true, message: "Logged out from all devices successfully." });
});

router.post(
  "/forgot-password",
  validate([body("email").notEmpty().isEmail()]),
  async (req: Request, res: Response) => {
    try {
      await authService.forgotPassword(req.body.email);
    } catch {}
    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }
);

router.post(
  "/reset-password",
  validate([
    body("token").notEmpty(),
    body("newPassword")
      .notEmpty()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage("Must be 8+ characters with an uppercase, lowercase, number, and special character."),
  ]),
  async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    clearCookies(res);
    res.json({
      success: true,
      message: "Password has been successfully reset. You can now log in with your new password.",
    });
  }
);

router.post(
  "/change-password",
  requireAuth,
  validate([
    body("oldPassword").notEmpty(),
    body("newPassword")
      .notEmpty()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage("Must be 8+ characters with an uppercase, lowercase, number, and special character."),
  ]),
  async (req: Request, res: Response) => {
    await authService.changePassword(req.userId!, req.body.oldPassword, req.body.newPassword);
    res.json({ success: true, message: "Password changed successfully." });
  }
);

export default router;
