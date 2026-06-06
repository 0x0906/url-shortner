import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import prisma from '../config/db';
import ErrorResponse from '../utils/errorResponse';
const sendTokenCookies = (user: any, accessToken: string, refreshToken: string, statusCode: number, res: Response) => {
  const accessCookieOptions = {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
  };
  const refreshCookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
  };
  res
    .status(statusCode)
    .cookie('token', accessToken, accessCookieOptions)
    .cookie('refreshToken', refreshToken, refreshCookieOptions)
    .json({
      success: true,
      user
    });
};
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    await authService.registerUser(name, email, password);
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email using the link printed to the server console.'
    });
  } catch (error) {
    next(error);
  }
};
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password, userAgent, ipAddress);
    sendTokenCookies(user, accessToken, refreshToken, 200, res);
  } catch (error) {
    next(error);
  }
};
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { refresh_token: refreshToken }
      });
    }
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
    });
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};
export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.redirect('http://localhost:5173/login?error=invalid_token');
    }
    const user = await prisma.user.findUnique({
      where: { verification_token: token }
    });
    if (!user) {
      return res.redirect('http://localhost:5173/login?error=invalid_token');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_token: null
      }
    });
    res.redirect('http://localhost:5173/login?verified=true');
  } catch (error) {
    next(error);
  }
};
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ErrorResponse('No refresh token provided. Please log in again.', 401);
    }
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    const accessCookieOptions = {
      expires: new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
    };
    res
      .status(200)
      .cookie('token', accessToken, accessCookieOptions)
      .json({
        success: true
      });
  } catch (error) {
    next(error);
  }
};
export const getSessions = async (req: any, res: Response, next: NextFunction) => {
  try {
    const sessions = await authService.getActiveSessions(req.user.id);
    const currentToken = req.cookies.refreshToken;
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device_name: session.device_name,
      ip_address: session.ip_address,
      created_at: session.created_at,
      is_current: session.refresh_token === currentToken
    }));
    res.status(200).json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    next(error);
  }
};
export const deleteSession = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await authService.terminateSession(req.user.id, id);
    res.status(200).json({
      success: true,
      message: 'Session terminated successfully.'
    });
  } catch (error) {
    next(error);
  }
};
export const logoutAll = async (req: any, res: Response, next: NextFunction) => {
  try {
    await authService.terminateAllSessions(req.user.id);
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
    });
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const)
    });
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully.'
    });
  } catch (error) {
    next(error);
  }
};
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
export const changePassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
