import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Session } from "../entity/Session";
import { ApiError } from "../errors/ApiError";
import { generateAccessToken } from "../utils/jwt";
import { getDeviceName } from "../utils/userAgentParser";

const userRepo = () => AppDataSource.getRepository(User);
const sessionRepo = () => AppDataSource.getRepository(Session);

export async function registerUser(name: string, email: string, password: string) {
  const existing = await userRepo().findOne({ where: { email } });
  if (existing) {
    throw new ApiError("Email address is already registered.", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomUUID();

  const user = userRepo().create({
    name,
    email,
    passwordHash,
    isVerified: true,
    verificationToken: null,
  });

  const saved = await userRepo().save(user);

  console.log(`Verification link: http://localhost:5000/api/auth/verify?token=${verificationToken}`);

  return {
    id: saved.id,
    name: saved.name,
    email: saved.email,
    created_at: saved.createdAt,
  };
}

export async function loginUser(email: string, password: string, userAgent: string, ipAddress: string) {
  const user = await userRepo().findOne({ where: { email } });
  if (!user) {
    throw new ApiError("Invalid email or password.", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError("Invalid email or password.", 401);
  }

  if (!user.isVerified) {
    throw new ApiError("Please verify your email before logging in. Check your inbox for the verification link.", 401);
  }

  const tokens = await generateTokens(user.id, userAgent, ipAddress);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function generateTokens(userId: string, userAgent: string, ipAddress: string) {
  const randomBytes = crypto.randomBytes(40);
  const refreshToken = randomBytes.toString("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deviceName = getDeviceName(userAgent);

  await sessionRepo()
    .createQueryBuilder()
    .delete()
    .from(Session)
    .where("user_id = :userId AND expires_at < :now", { userId, now: new Date() })
    .execute();

  let session = await sessionRepo().findOne({
    where: { userId, deviceName, ipAddress },
  });

  if (session) {
    session.refreshToken = refreshToken;
    session.expiresAt = expiresAt;
    session.createdAt = new Date();
    session = await sessionRepo().save(session);
  } else {
    session = sessionRepo().create({
      userId,
      refreshToken,
      deviceName,
      ipAddress,
      expiresAt,
    });
    session = await sessionRepo().save(session);
  }

  const accessToken = generateAccessToken(userId, session.id);

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  const session = await sessionRepo().findOne({ where: { refreshToken } });
  if (!session) {
    throw new ApiError("Invalid or expired session. Please log in again.", 401);
  }

  if (new Date(session.expiresAt) < new Date()) {
    await sessionRepo().remove(session);
    throw new ApiError("Invalid or expired session. Please log in again.", 401);
  }

  const accessToken = generateAccessToken(session.userId, session.id);
  return { accessToken };
}

export async function getActiveSessions(userId: string) {
  const sessions = await sessionRepo().find({
    where: { userId },
    order: { createdAt: "DESC" },
  });

  return sessions.map((s) => ({
    id: s.id,
    device_name: s.deviceName,
    ip_address: s.ipAddress,
    created_at: s.createdAt,
    refresh_token: s.refreshToken,
  }));
}

export async function terminateSession(userId: string, sessionId: string) {
  const session = await sessionRepo().findOne({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    throw new ApiError("Session not found.", 404);
  }
  await sessionRepo().remove(session);
}

export async function terminateAllSessions(userId: string) {
  await sessionRepo().delete({ userId });
}

export async function forgotPassword(email: string) {
  const user = await userRepo().findOne({ where: { email } });
  if (!user) {
    throw new ApiError("No account found with that email.", 404);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetToken = hashedToken;
  user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
  await userRepo().save(user);

  console.log(`Password reset link: http://localhost:5173/reset-password?token=${rawToken}`);
}

export async function resetPassword(token: string, newPassword: string) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await userRepo().findOne({ where: { resetToken: hashedToken } });
  if (!user) {
    throw new ApiError("Invalid or expired password reset token.", 400);
  }

  if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new ApiError("Invalid or expired password reset token.", 400);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpires = null;
  await userRepo().save(user);

  await terminateAllSessions(user.id);
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) {
    throw new ApiError("User not found.", 404);
  }

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError("Incorrect current password.", 401);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepo().save(user);
}
