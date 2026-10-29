import { AppDataSource } from "../data-source";
import { Url } from "../entity/Url";
import { Visit } from "../entity/Visit";
import { ApiError } from "../errors/ApiError";
import { parseUserAgent } from "../utils/userAgentParser";

const urlRepo = () => AppDataSource.getRepository(Url);
const visitRepo = () => AppDataSource.getRepository(Visit);

export async function getUserDashboardAnalytics(userId: string) {
  const urls = await urlRepo().find({ where: { userId } });

  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, u) => sum + u.clickCount, 0);
  const activeUrls = urls.filter(
    (u) => u.isActive && (!u.expiresAt || new Date(u.expiresAt) > new Date())
  ).length;

  const topUrls = [...urls]
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      short_code: u.shortCode,
      custom_alias: u.customAlias,
      original_url: u.originalUrl,
      click_count: u.clickCount,
    }));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentVisits = await visitRepo()
    .createQueryBuilder("v")
    .innerJoin("v.url", "u")
    .where("u.userId = :userId", { userId })
    .andWhere("v.visitedAt >= :after", { after: thirtyDaysAgo })
    .orderBy("v.visitedAt", "ASC")
    .getMany();

  const dailyClicks = buildDailyClicks(recentVisits, 7);

  const visitsForBreakdown = await visitRepo()
    .createQueryBuilder("v")
    .innerJoin("v.url", "u")
    .where("u.userId = :userId", { userId })
    .orderBy("v.visitedAt", "DESC")
    .take(1000)
    .getMany();

  const breakdowns = buildBreakdowns(visitsForBreakdown);

  const recentActivityVisits = await visitRepo()
    .createQueryBuilder("v")
    .innerJoinAndSelect("v.url", "u")
    .where("u.userId = :userId", { userId })
    .orderBy("v.visitedAt", "DESC")
    .take(5)
    .getMany();

  const recentActivity = recentActivityVisits.map((visit) => {
    const parsed = parseUserAgent(visit.userAgent);
    const entry: any = {
      id: visit.id,
      ip_address: visit.ipAddress,
      user_agent: visit.userAgent,
      visited_at: visit.visitedAt,
      browser: parsed.browser,
      os: parsed.os,
      device: parsed.device,
    };
    if (visit.url) {
      entry.url = {
        id: visit.url.id,
        short_code: visit.url.shortCode,
        custom_alias: visit.url.customAlias,
        original_url: visit.url.originalUrl,
      };
    }
    return entry;
  });

  return {
    summary: { totalUrls, totalClicks, activeUrls },
    topUrls,
    dailyClicks,
    recentActivity,
    breakdowns: {
      browser: breakdowns.browsers,
      os: breakdowns.os,
      device: breakdowns.devices,
    },
  };
}

export async function getUrlAnalytics(urlId: string, userId: string) {
  const url = await urlRepo().findOne({ where: { id: urlId } });
  if (!url) throw new ApiError("URL not found.", 404);
  if (url.userId !== userId) {
    throw new ApiError("You do not have permission to view analytics for this URL.", 403);
  }

  const lastVisit = await visitRepo().findOne({
    where: { urlId },
    order: { visitedAt: "DESC" },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentVisits = await visitRepo()
    .createQueryBuilder("v")
    .where("v.urlId = :urlId", { urlId })
    .andWhere("v.visitedAt >= :after", { after: thirtyDaysAgo })
    .orderBy("v.visitedAt", "ASC")
    .getMany();

  const dailyClicks = buildDailyClicks(recentVisits, 15);

  const visitsForBreakdown = await visitRepo().find({
    where: { urlId },
    order: { visitedAt: "DESC" },
    take: 500,
  });

  const breakdowns = buildBreakdowns(visitsForBreakdown);

  const clickHistoryVisits = await visitRepo().find({
    where: { urlId },
    order: { visitedAt: "DESC" },
    take: 50,
  });

  const clickHistory = clickHistoryVisits.map((visit) => {
    const parsed = parseUserAgent(visit.userAgent);
    return {
      id: visit.id,
      ip_address: visit.ipAddress,
      user_agent: visit.userAgent,
      visited_at: visit.visitedAt,
      browser: parsed.browser,
      os: parsed.os,
      device: parsed.device,
    };
  });

  return {
    url: {
      id: url.id,
      short_code: url.shortCode,
      custom_alias: url.customAlias,
      original_url: url.originalUrl,
      click_count: url.clickCount,
      is_active: url.isActive,
      is_one_time: url.isOneTime,
      expires_at: url.expiresAt,
      created_at: url.createdAt,
      has_password: url.passwordHash !== null,
    },
    totalClicks: url.clickCount,
    lastVisited: lastVisit?.visitedAt || null,
    dailyClicks,
    clickHistory,
    breakdowns: {
      browser: breakdowns.browsers,
      os: breakdowns.os,
      device: breakdowns.devices,
    },
  };
}

function buildDailyClicks(visits: Visit[], days: number) {
  const clicksByDate: Record<string, number> = {};
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().split("T")[0];
    clicksByDate[key] = 0;
  }

  for (const visit of visits) {
    if (visit.visitedAt) {
      const key = new Date(visit.visitedAt).toISOString().split("T")[0];
      if (key in clicksByDate) {
        clicksByDate[key]++;
      }
    }
  }

  return Object.entries(clicksByDate).map(([date, clicks]) => ({ date, clicks }));
}

function buildBreakdowns(visits: Visit[]) {
  const browsers: Record<string, number> = {};
  const osMap: Record<string, number> = {};
  const devices: Record<string, number> = {};

  for (const visit of visits) {
    const parsed = parseUserAgent(visit.userAgent);
    browsers[parsed.browser] = (browsers[parsed.browser] || 0) + 1;
    osMap[parsed.os] = (osMap[parsed.os] || 0) + 1;
    devices[parsed.device] = (devices[parsed.device] || 0) + 1;
  }

  const total = visits.length;

  return {
    browsers: toBreakdownList(browsers, total),
    os: toBreakdownList(osMap, total),
    devices: toBreakdownList(devices, total),
  };
}

function toBreakdownList(counts: Record<string, number>, total: number) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }));
}
