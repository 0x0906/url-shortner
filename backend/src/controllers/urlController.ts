import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { urlModel, formatUrl, IUrl } from "../models/urlModel";
import { visitModel } from "../models/visitModel";
import { generateShortCode } from "../utils/shortCode";
import { urlCache } from "../utils/cache";
import { ApiError } from "../utils/ApiError";

function parseExpiresAt(value: string | null | undefined): Date | null {
  if (!value || !value.trim() || value.trim().toLowerCase() === "null") {
    return null;
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ApiError("Invalid expiration date format.", 400);
  }
  return parsed;
}

async function generateUniqueShortCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateShortCode(6);
    const conflict = await urlModel.findByCodeOrAliasConflict(code);
    if (!conflict) return code;
  }
  throw new ApiError("Failed to generate a unique short code. Please try again.", 500);
}

function trackVisitAsync(url: IUrl, ip: string, userAgent: string) {
  setImmediate(async () => {
    try {
      await urlModel.recordVisitAndIncrement(url.id, url.is_one_time);

      if (url.is_one_time) {
        urlCache.delete(url.short_code);
        if (url.custom_alias) urlCache.delete(url.custom_alias);
      }

      await visitModel.recordVisit(url.id, ip, userAgent);
    } catch (err: any) {
      console.error("Error tracking visit:", err.message);
    }
  });
}

export const urlController = {
  async createShortUrl(req: Request, res: Response) {
    let { original_url, custom_alias, expires_at, password, is_one_time } = req.body;
    const userId = req.userId || null;

    if (!original_url.startsWith("http://") && !original_url.startsWith("https://")) {
      original_url = "https://" + original_url;
    }

    if (!userId) {
      custom_alias = null;
      expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    let shortCode: string;

    if (custom_alias && custom_alias.trim()) {
      custom_alias = custom_alias.trim();
      const conflict = await urlModel.checkAliasConflict(custom_alias);
      if (conflict) {
        throw new ApiError("This custom alias is already taken.", 400);
      }
      shortCode = custom_alias;
    } else {
      shortCode = await generateUniqueShortCode();
      custom_alias = null;
    }

    let passwordHash: string | null = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const parsedExpiry = parseExpiresAt(expires_at);

    const saved = await urlModel.create({
      original_url,
      short_code: shortCode,
      custom_alias,
      expires_at: parsedExpiry,
      password_hash: passwordHash,
      is_one_time: Boolean(is_one_time),
      user_id: userId,
    });

    res.status(201).json({ success: true, data: formatUrl(saved) });
  },

  async getUrls(req: Request, res: Response) {
    const search = req.query.search as string | undefined;
    const isActiveParam = req.query.is_active;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    let isActive: boolean | undefined;
    if (isActiveParam === "true") isActive = true;
    else if (isActiveParam === "false") isActive = false;

    const result = await urlModel.getUrlsByUser(req.userId!, search, isActive, page, limit);

    res.json({
      success: true,
      urls: result.urls.map(formatUrl),
      pagination: {
        total: result.total,
        page,
        limit,
        pages: Math.ceil(result.total / limit),
      },
    });
  },

  async updateUrl(req: Request, res: Response) {
    const urlId = req.params.id;
    const url = await urlModel.findById(urlId);
    if (!url) throw new ApiError("URL not found.", 404);
    if (url.user_id !== req.userId) {
      throw new ApiError("You do not have permission to modify this URL.", 403);
    }

    const oldShortCode = url.short_code;
    const oldAlias = url.custom_alias;
    const updates: Partial<IUrl> = {};

    if (req.body.original_url !== undefined) {
      let urlStr = req.body.original_url;
      if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
        urlStr = "https://" + urlStr;
      }
      updates.original_url = urlStr;
    }

    if (req.body.custom_alias !== undefined) {
      const newAlias = req.body.custom_alias.trim();
      if (newAlias) {
        if (newAlias !== url.custom_alias) {
          const conflict = await urlModel.checkAliasConflict(newAlias, url.id);
          if (conflict) {
            throw new ApiError("This custom alias is already taken.", 400);
          }
          updates.custom_alias = newAlias;
          updates.short_code = newAlias;
        }
      } else {
        updates.custom_alias = null;
        updates.short_code = await generateUniqueShortCode();
      }
    }

    if (req.body.expires_at !== undefined) {
      updates.expires_at = parseExpiresAt(req.body.expires_at);
    }

    if (req.body.password !== undefined) {
      if (!req.body.password.trim()) {
        updates.password_hash = null;
      } else {
        updates.password_hash = await bcrypt.hash(req.body.password, 10);
      }
    }

    if (req.body.is_one_time !== undefined) {
      updates.is_one_time = Boolean(req.body.is_one_time);
    }

    if (req.body.is_active !== undefined) {
      updates.is_active = Boolean(req.body.is_active);
    }

    urlCache.delete(oldShortCode);
    if (oldAlias) urlCache.delete(oldAlias);
    if (updates.short_code && updates.short_code !== oldShortCode) {
      urlCache.delete(updates.short_code);
    }
    if (updates.custom_alias && updates.custom_alias !== oldAlias) {
      urlCache.delete(updates.custom_alias);
    }

    const updated = await urlModel.update(urlId, updates);
    res.json({ success: true, data: formatUrl(updated!) });
  },

  async deleteUrl(req: Request, res: Response) {
    const urlId = req.params.id;
    const url = await urlModel.findById(urlId);
    if (!url) throw new ApiError("URL not found.", 404);
    if (url.user_id !== req.userId) {
      throw new ApiError("You do not have permission to delete this URL.", 403);
    }

    urlCache.delete(url.short_code);
    if (url.custom_alias) urlCache.delete(url.custom_alias);

    await urlModel.delete(urlId, req.userId!);
    res.json({ success: true, message: "URL successfully deleted." });
  },

  async resolveUrl(req: Request, res: Response) {
    const shortCode = req.params.shortCode;
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const password = req.body?.password || null;

    let url = urlCache.get(shortCode) as IUrl | undefined;

    if (!url) {
      const found = await urlModel.findByShortCodeOrAlias(shortCode);
      if (!found) {
        throw new ApiError("Short URL not found.", 404);
      }
      url = found;
      urlCache.set(url.short_code, url);
      if (url.custom_alias) {
        urlCache.set(url.custom_alias, url);
      }
    }

    if (!url.is_active) {
      throw new ApiError("This short URL has been deactivated.", 400);
    }

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      throw new ApiError("This short URL has expired.", 410);
    }

    if (url.password_hash) {
      if (!password || !password.trim()) {
        throw new ApiError("PASSWORD_REQUIRED", 403);
      }
      const valid = await bcrypt.compare(password, url.password_hash);
      if (!valid) {
        throw new ApiError("Invalid password.", 403);
      }
    }

    const currentClicks = Number(url.click_count || 0);
    trackVisitAsync(url, ip, userAgent);

    res.json({
      success: true,
      data: {
        original_url: url.original_url,
        click_count: currentClicks + 1,
      },
    });
  },
};
