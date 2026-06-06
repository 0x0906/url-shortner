import express from 'express';
import { getDashboardAnalytics, getUrlAnalytics } from '../controllers/analyticsController';
import { protect } from '../middleware/auth';
const router = express.Router();
router.use(protect as any);
router.get('/dashboard', getDashboardAnalytics as any);
router.get('/url/:id', getUrlAnalytics as any);
export default router;
