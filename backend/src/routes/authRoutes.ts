import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  verify, 
  refresh, 
  getSessions, 
  deleteSession, 
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate, registerSchema, loginSchema } from '../validators/zodValidator';
const router = express.Router();
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/verify', verify);
router.post('/logout', logout);
router.get('/me', protect as any, getMe);
router.post('/refresh', refresh);
router.get('/sessions', protect as any, getSessions);
router.delete('/sessions/:id', protect as any, deleteSession);
router.post('/logout-all', protect as any, logoutAll);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/change-password', protect as any, changePassword);
export default router;
