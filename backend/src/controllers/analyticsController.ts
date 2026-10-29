import { Request, Response } from "express";
import { urlModel } from "../models/urlModel";
import { visitModel, IVisit } from "../models/visitModel";
import { parseUserAgent } from "../utils/userAgent";
import { ApiError } from "../utils/ApiError";

function buildDailyClicks(visits: IVisit[], days: number) {
  const clicksByDate: Record<string, number> = {};
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().split("T")[0];
    clicksByDate[key] = 0;
  }

  for (const visit of visits) {
    if (visit.visited_at) {
      const key = new Date(visit.visited_at).toISOString().split("T")[0];
      if (key in clicksByDate) {
        clicksByDate[key]++;
      }
    }
  }

  return Object.entries(clicksByDate).map(([date, clicks]) => ({ date, clicks }));
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

function buildBreakdowns(visits: IVisit[]) {
  const browsers: Record<string, number> = {};
  const osMap: Record<string, number> = {};
  const devices: Record<string, number> = {};

  for (const visit of visits) {
    const parsed = parseUserAgent(visit.user_agent);
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

export const analyticsController = {
  async getDashboardAnalytics(req: Request, res: Response) {
    const userId = req.userId!;
    const urls = await urlModel.findAllByUser(userId);

    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + Number(u.click_count || 0), 0);
    const activeUrls = urls.filter(
      (u) => u.is_active && (!u.expires_at || new Date(u.expires_at) > new Date())
    ).length;

    const topUrls = [...urls]
      .sort((a, b) => Number(b.click_count || 0) - Number(a.click_count || 0))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        short_code: u.short_code,
        custom_alias: u.custom_alias,
        original_url: u.original_url,
        click_count: Number(u.click_count || 0),
      }));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentVisits = await visitModel.getRecentVisitsByUser(userId, thirtyDaysAgo);
    const dailyClicks = buildDailyClicks(recentVisits, 7);

    const visitsForBreakdown = await visitModel.getVisitsForUserBreakdown(userId, 1000);
    const breakdowns = buildBreakdowns(visitsForBreakdown);

    const recentActivityVisits = await visitModel.getRecentActivityByUser(userId, 5);
    const recentActivity = recentActivityVisits.map((visit) => {
      const parsed = parseUserAgent(visit.user_agent);
      const entry: any = {
        id: visit.id,
        ip_address: visit.ip_address,
        user_agent: visit.user_agent,
        visited_at: visit.visited_at,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
      };
      if (visit.url_id) {
        entry.url = {
          id: visit.url_id,
          short_code: visit.short_code,
          custom_alias: visit.custom_alias,
          original_url: visit.original_url,
        };
      }
      return entry;
    });

    res.json({
      success: true,
      data: {
        summary: { totalUrls, totalClicks, activeUrls },
        topUrls,
        dailyClicks,
        recentActivity,
        breakdowns: {
          browser: breakdowns.browsers,
          os: breakdowns.os,
          device: breakdowns.devices,
        },
      },
    });
  },

  async getUrlAnalytics(req: Request, res: Response) {
    const urlId = req.params.id;
    const userId = req.userId!;

    const url = await urlModel.findById(urlId);
    if (!url) throw new ApiError("URL not found.", 404);
    if (url.user_id !== userId) {
      throw new ApiError("You do not have permission to view analytics for this URL.", 403);
    }

    const lastVisit = await visitModel.getLastVisitForUrl(urlId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentVisits = await visitModel.getVisitsForUrlAfter(urlId, thirtyDaysAgo);
    const dailyClicks = buildDailyClicks(recentVisits, 15);

    const visitsForBreakdown = await visitModel.getVisitsForUrl(urlId, 500);
    const breakdowns = buildBreakdowns(visitsForBreakdown);

    const clickHistoryVisits = await visitModel.getVisitsForUrl(urlId, 50);
    const clickHistory = clickHistoryVisits.map((visit) => {
      const parsed = parseUserAgent(visit.user_agent);
      return {
        id: visit.id,
        ip_address: visit.ip_address,
        user_agent: visit.user_agent,
        visited_at: visit.visited_at,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
      };
    });

    res.json({
      success: true,
      data: {
        url: {
          id: url.id,
          short_code: url.short_code,
          custom_alias: url.custom_alias,
          original_url: url.original_url,
          click_count: Number(url.click_count || 0),
          is_active: Boolean(url.is_active),
          is_one_time: Boolean(url.is_one_time),
          expires_at: url.expires_at,
          created_at: url.created_at,
          has_password: url.password_hash !== null && url.password_hash !== undefined,
        },
        totalClicks: Number(url.click_count || 0),
        lastVisited: lastVisit?.visited_at || null,
        dailyClicks,
        clickHistory,
        breakdowns: {
          browser: breakdowns.browsers,
          os: breakdowns.os,
          device: breakdowns.devices,
        },
      },
    });
  },
};
