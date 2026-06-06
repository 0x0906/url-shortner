import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as urlService from '../services/urlService';
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { original_url, custom_alias, expires_at, password, is_one_time } = req.body;
    const url = await urlService.createShortUrl({
      original_url,
      custom_alias,
      expires_at,
      password,
      is_one_time,
      user_id: req.user ? req.user.id : null
    });
    res.status(201).json({
      success: true,
      data: url
    });
  } catch (error) {
    next(error);
  }
};
export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, is_active, page, limit } = req.query;
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    let isActiveFilter: boolean | undefined = undefined;
    if (is_active !== undefined) {
      isActiveFilter = is_active === 'true';
    }
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const data = await urlService.getUrls({
      user_id: req.user.id,
      search: search as string,
      isActive: isActiveFilter,
      page: pageNum,
      limit: limitNum
    });
    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { original_url, custom_alias, expires_at, is_active, password, is_one_time } = req.body;
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const url = await urlService.updateUrl({
      id,
      user_id: req.user.id,
      original_url,
      custom_alias,
      expires_at,
      is_active,
      password,
      is_one_time
    });
    res.status(200).json({
      success: true,
      data: url
    });
  } catch (error) {
    next(error);
  }
};
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    await urlService.deleteUrl(id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'URL successfully deleted.'
    });
  } catch (error) {
    next(error);
  }
};
export const redirectUrl = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params as { shortCode: string };
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(302, `${frontendUrl}/redirect/${shortCode}`);
  } catch (error) {
    next(error);
  }
};
export const resolveShortUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params as { shortCode: string };
    const { password } = req.body;
    const ipAddress = req.ip || '';
    const userAgent = req.headers['user-agent'];
    const data = await urlService.resolveUrlAndTrackVisit(shortCode, ipAddress, userAgent, password);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
