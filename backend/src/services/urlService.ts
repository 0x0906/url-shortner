import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { Url } from "../entity/Url";
import { Visit } from "../entity/Visit";
import { ApiError } from "../errors/ApiError";
import { generateShortCode } from "../utils/shortCode";
import { urlCache } from "../utils/lruCache";

const urlRepo = () => AppDataSource.getRepository(Url);
const visitRepo = () => AppDataSource.getRepository(Visit);

export async function createShortUrl(
  originalUrl: string,
  customAlias: string | null,
  expiresAt: string | null,
  password: string | null,
  isOneTime: boolean,
  userId: string | null
) {
  if (!originalUrl.startsWith("http://") && !originalUrl.startsWith("https://")) {
    originalUrl = "https://" + originalUrl;
  }

  if (!userId) {
    customAlias = null;
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  let shortCode: string;

  if (customAlias && customAlias.trim()) {
    const conflict = await urlRepo().findOne({
      where: [
        { shortCode: customAlias },
        { customAlias: customAlias },
      ],
    });
    if (conflict) {
      throw new ApiError("This custom alias is already taken.", 400);
    }
    shortCode = customAlias;
  } else {
    shortCode = await generateUniqueShortCode();
    customAlias = null;
  }

  let passwordHash: string | null = null;
  if (password && password.trim()) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const parsedExpiry = parseExpiresAt(expiresAt);

  const url = urlRepo().create({
    originalUrl,
    shortCode,
    customAlias,
    clickCount: 0,
    expiresAt: parsedExpiry,
    passwordHash,
    isOneTime,
    isActive: true,
    userId,
  });

  const saved = await urlRepo().save(url);
  return formatUrl(saved);
}

async function generateUniqueShortCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateShortCode(6);
    const exists = await urlRepo().findOne({ where: { shortCode: code } });
    if (!exists) return code;
  }
  throw new ApiError("Failed to generate a unique short code. Please try again.", 500);
}

export async function getUrls(
  userId: string,
  search: string | undefined,
  isActive: boolean | undefined,
  page: number,
  limit: number
) {
  const qb = urlRepo()
    .createQueryBuilder("url")
    .where("url.userId = :userId", { userId });

  if (search) {
    qb.andWhere(
      "(LOWER(url.originalUrl) LIKE :search OR LOWER(url.shortCode) LIKE :search OR LOWER(url.customAlias) LIKE :search)",
      { search: `%${search.toLowerCase()}%` }
    );
  }

  if (isActive !== undefined) {
    qb.andWhere("url.isActive = :isActive", { isActive });
  }

  qb.orderBy("url.createdAt", "DESC");

  const total = await qb.getCount();
  const urls = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  return {
    urls: urls.map(formatUrl),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function updateUrl(urlId: string, userId: string, updates: any) {
  const url = await urlRepo().findOne({ where: { id: urlId } });
  if (!url) throw new ApiError("URL not found.", 404);
  if (url.userId !== userId) throw new ApiError("You do not have permission to modify this URL.", 403);

  const oldShortCode = url.shortCode;
  const oldAlias = url.customAlias;

  if (updates.original_url !== undefined) {
    let urlStr = updates.original_url;
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      urlStr = "https://" + urlStr;
    }
    url.originalUrl = urlStr;
  }

  if (updates.custom_alias !== undefined) {
    const newAlias = updates.custom_alias.trim();
    if (newAlias) {
      if (newAlias !== url.customAlias) {
        const conflict = await urlRepo().findOne({
          where: [
            { shortCode: newAlias },
            { customAlias: newAlias },
          ],
        });
        if (conflict && conflict.id !== url.id) {
          throw new ApiError("This custom alias is already taken.", 400);
        }
        url.customAlias = newAlias;
        url.shortCode = newAlias;
      }
    } else {
      url.customAlias = null;
      url.shortCode = await generateUniqueShortCode();
    }
  }

  if (updates.expires_at !== undefined) {
    url.expiresAt = parseExpiresAt(updates.expires_at);
  }

  if (updates.password !== undefined) {
    if (!updates.password.trim()) {
      url.passwordHash = null;
    } else {
      url.passwordHash = await bcrypt.hash(updates.password, 10);
    }
  }

  if (updates.is_one_time !== undefined) {
    url.isOneTime = updates.is_one_time;
  }

  if (updates.is_active !== undefined) {
    url.isActive = updates.is_active;
  }

  urlCache.delete(oldShortCode);
  if (oldAlias) urlCache.delete(oldAlias);
  if (url.shortCode !== oldShortCode) urlCache.delete(url.shortCode);
  if (url.customAlias && url.customAlias !== oldAlias) urlCache.delete(url.customAlias);

  const saved = await urlRepo().save(url);
  return formatUrl(saved);
}

export async function deleteUrl(urlId: string, userId: string) {
  const url = await urlRepo().findOne({ where: { id: urlId } });
  if (!url) throw new ApiError("URL not found.", 404);
  if (url.userId !== userId) throw new ApiError("You do not have permission to delete this URL.", 403);

  urlCache.delete(url.shortCode);
  if (url.customAlias) urlCache.delete(url.customAlias);

  await urlRepo().remove(url);
}

export async function resolveUrlAndTrackVisit(
  shortCode: string,
  ip: string,
  userAgent: string,
  password: string | null
) {
  let url = urlCache.get(shortCode) as Url | undefined;

  if (!url) {
    url = await urlRepo().findOne({
      where: [
        { shortCode },
        { customAlias: shortCode },
      ],
    }) || undefined;

    if (!url) {
      throw new ApiError("Short URL not found.", 404);
    }

    urlCache.set(url.shortCode, url);
    if (url.customAlias) {
      urlCache.set(url.customAlias, url);
    }
  }

  if (!url.isActive) {
    throw new ApiError("This short URL has been deactivated.", 400);
  }

  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    throw new ApiError("This short URL has expired.", 410);
  }

  if (url.passwordHash) {
    if (!password || !password.trim()) {
      throw new ApiError("PASSWORD_REQUIRED", 403);
    }
    const valid = await bcrypt.compare(password, url.passwordHash);
    if (!valid) {
      throw new ApiError("Invalid password.", 403);
    }
  }

  const currentClickCount = url.clickCount;
  trackVisit(url, ip, userAgent);

  return {
    original_url: url.originalUrl,
    click_count: currentClickCount + 1,
  };
}

function trackVisit(url: Url, ip: string, userAgent: string) {
  (async () => {
    try {
      url.clickCount += 1;

      if (url.isOneTime) {
        url.isActive = false;
        urlCache.delete(url.shortCode);
        if (url.customAlias) urlCache.delete(url.customAlias);
      }

      await urlRepo().save(url);

      const visit = visitRepo().create({
        urlId: url.id,
        ipAddress: ip,
        userAgent,
      });
      await visitRepo().save(visit);
    } catch (err: any) {
      console.error("Error tracking visit:", err.message);
    }
  })();
}

function formatUrl(url: Url) {
  return {
    id: url.id,
    original_url: url.originalUrl,
    short_code: url.shortCode,
    custom_alias: url.customAlias,
    click_count: url.clickCount,
    expires_at: url.expiresAt,
    is_one_time: url.isOneTime,
    is_active: url.isActive,
    user_id: url.userId,
    created_at: url.createdAt,
    has_password: url.passwordHash !== null && url.passwordHash !== undefined,
  };
}

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
