import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { generateShortCode } from '../utils/helpers';
import ErrorResponse from '../utils/errorResponse';
export interface CreateUrlParams {
  original_url: string;
  custom_alias?: string | null;
  expires_at?: string | null;
  user_id?: string | null;
  password?: string | null;
  is_one_time?: boolean;
}
export interface GetUrlsParams {
  user_id: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
export interface UpdateUrlParams {
  id: string;
  user_id: string;
  original_url?: string;
  custom_alias?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  password?: string | null;
  is_one_time?: boolean;
}
export const createShortUrl = async ({ original_url, custom_alias, expires_at, user_id, password, is_one_time }: CreateUrlParams) => {
  let shortCode = '';
  if (!user_id) {
    custom_alias = null;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    expires_at = expiry.toISOString();
  }
  if (custom_alias) {
    const existing = await prisma.url.findFirst({
      where: {
        OR: [
          { short_code: custom_alias },
          { custom_alias: custom_alias }
        ]
      }
    });
    if (existing) {
      throw new ErrorResponse('This custom alias is already taken.', 400);
    }
    shortCode = custom_alias;
  } else {
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      shortCode = generateShortCode(6);
      const existing = await prisma.url.findFirst({
        where: {
          OR: [
            { short_code: shortCode },
            { custom_alias: shortCode }
          ]
        }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      throw new ErrorResponse('Failed to generate a unique short URL code. Please try again.', 500);
    }
  }
  const expirationDate = expires_at ? new Date(expires_at) : null;
  let passwordHash = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(password, salt);
  }
  return await prisma.url.create({
    data: {
      original_url,
      short_code: shortCode,
      custom_alias: custom_alias || null,
      expires_at: expirationDate,
      password_hash: passwordHash,
      is_one_time: is_one_time || false,
      user_id: user_id || null
    }
  });
};
export const getUrls = async ({ user_id, search = '', isActive, page = 1, limit = 10 }: GetUrlsParams) => {
  const skip = (page - 1) * limit;
  const where: any = {
    user_id,
    AND: []
  };
  if (search) {
    where.AND.push({
      OR: [
        { original_url: { contains: search, mode: 'insensitive' } },
        { short_code: { contains: search, mode: 'insensitive' } },
        { custom_alias: { contains: search, mode: 'insensitive' } }
      ]
    });
  }
  if (isActive !== undefined) {
    where.AND.push({ is_active: isActive });
  }
  if (where.AND.length === 0) {
    delete where.AND;
  }
  const [urls, total] = await prisma.$transaction([
    prisma.url.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    }),
    prisma.url.count({ where })
  ]);
  return {
    urls,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};
export const updateUrl = async ({ id, user_id, original_url, custom_alias, expires_at, is_active, password, is_one_time }: UpdateUrlParams) => {
  const url = await prisma.url.findUnique({
    where: { id }
  });
  if (!url) {
    throw new ErrorResponse('URL not found.', 404);
  }
  if (url.user_id !== user_id) {
    throw new ErrorResponse('Not authorized to edit this URL.', 403);
  }
  const updateData: any = {};
  if (original_url !== undefined) {
    updateData.original_url = original_url;
  }
  if (is_active !== undefined) {
    updateData.is_active = is_active;
  }
  if (is_one_time !== undefined) {
    updateData.is_one_time = is_one_time;
  }
  if (expires_at !== undefined) {
    updateData.expires_at = expires_at ? new Date(expires_at) : null;
  }
  if (password !== undefined) {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    } else {
      updateData.password_hash = null;
    }
  }
  if (custom_alias !== undefined && custom_alias !== url.custom_alias) {
    if (custom_alias) {
      const existing = await prisma.url.findFirst({
        where: {
          id: { not: id },
          OR: [
            { short_code: custom_alias },
            { custom_alias: custom_alias }
          ]
        }
      });
      if (existing) {
        throw new ErrorResponse('This custom alias is already taken.', 400);
      }
      updateData.custom_alias = custom_alias;
      updateData.short_code = custom_alias;
    } else {
      let shortCode = '';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        shortCode = generateShortCode(6);
        const existing = await prisma.url.findFirst({
          where: {
            id: { not: id },
            OR: [
              { short_code: shortCode },
              { custom_alias: shortCode }
            ]
          }
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        throw new ErrorResponse('Failed to generate a unique short URL code. Please try again.', 500);
      }
      updateData.custom_alias = null;
      updateData.short_code = shortCode;
    }
  }
  return await prisma.url.update({
    where: { id },
    data: updateData
  });
};
export const deleteUrl = async (id: string, user_id: string) => {
  const url = await prisma.url.findUnique({
    where: { id }
  });
  if (!url) {
    throw new ErrorResponse('URL not found.', 404);
  }
  if (url.user_id !== user_id) {
    throw new ErrorResponse('Not authorized to delete this URL.', 403);
  }
  await prisma.url.delete({
    where: { id }
  });
  return { success: true };
};
export const resolveUrlAndTrackVisit = async (shortCode: string, ip: string | undefined, userAgent: string | undefined, password?: string) => {
  const url = await prisma.url.findFirst({
    where: {
      OR: [
        { short_code: shortCode },
        { custom_alias: shortCode }
      ]
    }
  });
  if (!url) {
    throw new ErrorResponse('Short URL not found.', 404);
  }
  if (!url.is_active) {
    throw new ErrorResponse('This URL is currently inactive.', 400);
  }
  if (url.expires_at && new Date(url.expires_at) < new Date()) {
    throw new ErrorResponse('This short URL has expired.', 410);
  }
  console.log(`Resolving URL: ${url.short_code}, password_hash type: ${typeof url.password_hash}, value:`, url.password_hash);
  if (url.password_hash !== null && url.password_hash !== '' && url.password_hash.trim().length > 0) {
    if (!password) {
      throw new ErrorResponse('PASSWORD_REQUIRED', 403);
    }
    const isMatch = await bcrypt.compare(password, url.password_hash);
    if (!isMatch) {
      throw new ErrorResponse('Invalid password.', 403);
    }
  }
  const transactionRequests: any[] = [
    prisma.url.update({
      where: { id: url.id },
      data: { click_count: { increment: 1 } }
    }),
    prisma.visit.create({
      data: {
        url_id: url.id,
        ip_address: ip || 'unknown',
        user_agent: userAgent || 'unknown'
      }
    })
  ];
  if (url.is_one_time) {
    transactionRequests[0] = prisma.url.update({
      where: { id: url.id },
      data: { click_count: { increment: 1 }, is_active: false }
    });
  }
  prisma.$transaction(transactionRequests).catch(err => {
    console.error('Error logging visit analytics:', err);
  });
  return {
    original_url: url.original_url,
    click_count: url.click_count + 1
  };
};
