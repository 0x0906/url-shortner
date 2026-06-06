import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db';
import ErrorResponse from '../utils/errorResponse';
const getDeviceName = (userAgent: string | undefined): string => {
  if (!userAgent) return 'Unknown Device';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('iPhone')) os = 'iPhone';
  else if (userAgent.includes('iPad')) os = 'iPad';
  else if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Linux')) os = 'Linux';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge') || userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  return `${os} (${browser})`;
};
const generateTokens = async (userId: string, userAgent: string | undefined, ipAddress: string | undefined) => {
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deviceName = getDeviceName(userAgent);
  const ip = ipAddress || 'Unknown IP';
  await prisma.session.deleteMany({
    where: {
      user_id: userId,
      expires_at: { lt: new Date() }
    }
  });
  const existingSession = await prisma.session.findFirst({
    where: {
      user_id: userId,
      device_name: deviceName,
      ip_address: ip
    }
  });
  let session;
  if (existingSession) {
    session = await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        refresh_token: rawRefreshToken,
        expires_at: expiresAt,
        created_at: new Date()
      }
    });
  } else {
    session = await prisma.session.create({
      data: {
        user_id: userId,
        refresh_token: rawRefreshToken,
        device_name: deviceName,
        ip_address: ip,
        expires_at: expiresAt
      }
    });
  }
  const accessToken = jwt.sign({ id: userId, sessionId: session.id }, process.env.JWT_SECRET as string, {
    expiresIn: '15m'
  });
  return { accessToken, refreshToken: rawRefreshToken };
};
export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  if (existingUser) {
    throw new ErrorResponse('Email address is already registered.', 400);
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const verificationToken = crypto.randomUUID();
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password_hash: passwordHash,
      is_verified: false,
      verification_token: verificationToken
    },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true
    }
  });
  const verifyUrl = `http://localhost:5000/api/auth/verify?token=${verificationToken}`;
  console.log('\n==================================================');
  console.log('EMAIL VERIFICATION LINK');
  console.log(`Please click the link below to verify your account:`);
  console.log(`${verifyUrl}`);
  console.log('==================================================\n');
  return { user: newUser };
};
export const loginUser = async (email: string, password: string, userAgent: string | undefined, ipAddress: string | undefined) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    throw new ErrorResponse('Invalid email or password.', 401);
  }
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ErrorResponse('Invalid email or password.', 401);
  }
  if (!user.is_verified) {
    throw new ErrorResponse('Please verify your email before logging in. A verification link has been printed to the server console.', 401);
  }
  const { accessToken, refreshToken } = await generateTokens(user.id, userAgent, ipAddress);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    },
    accessToken,
    refreshToken
  };
};
export const refreshAccessToken = async (refreshToken: string) => {
  const session = await prisma.session.findUnique({
    where: { refresh_token: refreshToken }
  });
  if (!session || session.expires_at < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    throw new ErrorResponse('Invalid or expired session. Please log in again.', 401);
  }
  const accessToken = jwt.sign({ id: session.user_id, sessionId: session.id }, process.env.JWT_SECRET as string, {
    expiresIn: '15m'
  });
  return { accessToken };
};
export const terminateSession = async (userId: string, sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });
  if (!session || session.user_id !== userId) {
    throw new ErrorResponse('Session not found.', 404);
  }
  await prisma.session.delete({
    where: { id: sessionId }
  });
};
export const terminateAllSessions = async (userId: string) => {
  await prisma.session.deleteMany({
    where: { user_id: userId }
  });
};
export const getActiveSessions = async (userId: string) => {
  return await prisma.session.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      device_name: true,
      ip_address: true,
      created_at: true,
      refresh_token: true
    }
  });
};
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ErrorResponse('No account found with that email.', 404);
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  await prisma.user.update({
    where: { email },
    data: {
      reset_token: hashedToken,
      reset_token_expires: expires
    }
  });
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  console.log('\n==================================================');
  console.log('PASSWORD RESET LINK');
  console.log(`Requested for: ${email}`);
  console.log(`Please click the link below to reset your password:`);
  console.log(`${resetUrl}`);
  console.log('==================================================\n');
};
export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      reset_token: hashedToken,
      reset_token_expires: { gt: new Date() }
    }
  });
  if (!user) {
    throw new ErrorResponse('Invalid or expired password reset token.', 400);
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null
    }
  });
  await terminateAllSessions(user.id);
};
export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ErrorResponse('User not found.', 404);
  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) {
    throw new ErrorResponse('Incorrect current password.', 401);
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: passwordHash }
  });
};
