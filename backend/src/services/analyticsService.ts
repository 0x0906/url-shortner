import prisma from '../config/db';
import { parseUserAgent } from '../utils/helpers';
import ErrorResponse from '../utils/errorResponse';
export const getUserDashboardAnalytics = async (userId: string) => {
  const urls = await prisma.url.findMany({
    where: { user_id: userId }
  });
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, url) => sum + url.click_count, 0);
  const topUrls = await prisma.url.findMany({
    where: { user_id: userId },
    orderBy: { click_count: 'desc' },
    take: 5
  });
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const visits = await prisma.visit.findMany({
    where: {
      url: { user_id: userId },
      visited_at: { gte: thirtyDaysAgo }
    },
    orderBy: { visited_at: 'asc' },
    include: {
      url: {
        select: {
          short_code: true,
          custom_alias: true
        }
      }
    }
  });
  const dailyClicksMap: { [key: string]: number } = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyClicksMap[dateStr] = 0;
  }
  visits.forEach((visit) => {
    const dateStr = visit.visited_at.toISOString().split('T')[0];
    dailyClicksMap[dateStr] = (dailyClicksMap[dateStr] || 0) + 1;
  });
  const dailyClicks = Object.keys(dailyClicksMap).map((date) => ({
    date,
    clicks: dailyClicksMap[date]
  })).sort((a, b) => a.date.localeCompare(b.date));
  const recentVisitsForBreakdown = await prisma.visit.findMany({
    where: {
      url: { user_id: userId }
    },
    orderBy: { visited_at: 'desc' },
    take: 1000
  });
  const browserBreakdown: { [key: string]: number } = {};
  const osBreakdown: { [key: string]: number } = {};
  const deviceBreakdown: { [key: string]: number } = {};
  recentVisitsForBreakdown.forEach((visit) => {
    const parsed = parseUserAgent(visit.user_agent || undefined);
    browserBreakdown[parsed.browser] = (browserBreakdown[parsed.browser] || 0) + 1;
    osBreakdown[parsed.os] = (osBreakdown[parsed.os] || 0) + 1;
    deviceBreakdown[parsed.device] = (deviceBreakdown[parsed.device] || 0) + 1;
  });
  const formatBreakdown = (obj: { [key: string]: number }) => 
    Object.keys(obj).map((name) => ({ name, value: obj[name] })).sort((a, b) => b.value - a.value);
  const recentActivity = await prisma.visit.findMany({
    where: {
      url: { user_id: userId }
    },
    orderBy: { visited_at: 'desc' },
    take: 5,
    include: {
      url: {
        select: {
          id: true,
          short_code: true,
          custom_alias: true,
          original_url: true
        }
      }
    }
  });
  return {
    summary: {
      totalUrls,
      totalClicks,
      activeUrls: urls.filter(u => u.is_active && (!u.expires_at || new Date(u.expires_at) > new Date())).length
    },
    topUrls,
    dailyClicks,
    recentActivity,
    breakdowns: {
      browser: formatBreakdown(browserBreakdown),
      os: formatBreakdown(osBreakdown),
      device: formatBreakdown(deviceBreakdown)
    }
  };
};
export const getUrlAnalytics = async (urlId: string, userId: string) => {
  const url = await prisma.url.findUnique({
    where: { id: urlId }
  });
  if (!url) {
    throw new ErrorResponse('URL not found.', 404);
  }
  if (url.user_id !== userId) {
    throw new ErrorResponse('Not authorized to access analytics for this URL.', 403);
  }
  const lastVisit = await prisma.visit.findFirst({
    where: { url_id: urlId },
    orderBy: { visited_at: 'desc' }
  });
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const visits = await prisma.visit.findMany({
    where: {
      url_id: urlId,
      visited_at: { gte: thirtyDaysAgo }
    },
    orderBy: { visited_at: 'asc' }
  });
  const dailyClicksMap: { [key: string]: number } = {};
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyClicksMap[dateStr] = 0;
  }
  visits.forEach((visit) => {
    const dateStr = visit.visited_at.toISOString().split('T')[0];
    dailyClicksMap[dateStr] = (dailyClicksMap[dateStr] || 0) + 1;
  });
  const dailyClicks = Object.keys(dailyClicksMap).map((date) => ({
    date,
    clicks: dailyClicksMap[date]
  })).sort((a, b) => a.date.localeCompare(b.date));
  const browserBreakdown: { [key: string]: number } = {};
  const osBreakdown: { [key: string]: number } = {};
  const deviceBreakdown: { [key: string]: number } = {};
  const allVisits = await prisma.visit.findMany({
    where: { url_id: urlId },
    orderBy: { visited_at: 'desc' },
    take: 500
  });
  allVisits.forEach((visit) => {
    const parsed = parseUserAgent(visit.user_agent || undefined);
    browserBreakdown[parsed.browser] = (browserBreakdown[parsed.browser] || 0) + 1;
    osBreakdown[parsed.os] = (osBreakdown[parsed.os] || 0) + 1;
    deviceBreakdown[parsed.device] = (deviceBreakdown[parsed.device] || 0) + 1;
  });
  const formatBreakdown = (obj: { [key: string]: number }) => 
    Object.keys(obj).map((name) => ({ name, value: obj[name] })).sort((a, b) => b.value - a.value);
  const clickHistory = await prisma.visit.findMany({
    where: { url_id: urlId },
    orderBy: { visited_at: 'desc' },
    take: 50
  });
  return {
    url,
    totalClicks: url.click_count,
    lastVisited: lastVisit ? lastVisit.visited_at : null,
    dailyClicks,
    clickHistory,
    breakdowns: {
      browser: formatBreakdown(browserBreakdown),
      os: formatBreakdown(osBreakdown),
      device: formatBreakdown(deviceBreakdown)
    }
  };
};
