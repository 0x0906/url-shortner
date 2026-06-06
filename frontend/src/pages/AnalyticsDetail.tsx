import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import StatCard from '../components/StatCard';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Button from '../components/Button';
import { 
  ArrowLeft, 
  MousePointerClick, 
  Calendar, 
  Clock, 
  Globe, 
  Smartphone, 
  Cpu, 
  History,
  Copy
} from 'lucide-react';
interface VisitItem {
  id: string;
  url_id: string;
  ip_address: string;
  user_agent: string;
  visited_at: string;
}
interface BreakdownItem {
  name: string;
  value: number;
  percentage?: number;
}
interface AnalyticsReport {
  url: {
    id: string;
    original_url: string;
    short_code: string;
    custom_alias: string | null;
    click_count: number;
    expires_at: string | null;
    is_active: boolean;
    user_id: string;
    created_at: string;
  };
  totalClicks: number;
  lastVisited: string | null;
  dailyClicks: { date: string; clicks: number }[];
  clickHistory: VisitItem[];
  breakdowns: {
    browser: BreakdownItem[];
    os: BreakdownItem[];
    device: BreakdownItem[];
  };
}
export const AnalyticsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get(`/analytics/url/${id}`);
      if (response.success) {
        setReport(response.data);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch analytics report.', 'error');
      navigate('/links');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, toast]);
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Link copied to clipboard!', 'success');
  };
  const getFullShortUrl = (shortCode: string) => {
    return `${window.location.origin.replace('5173', '5000')}/${shortCode}`;
  };
  if (isLoading || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse bg-[#fafafa] dark:bg-[#0a0a0b] transition-colors">
        <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Loading Stats...</p>
      </div>
    );
  }
  const { url, totalClicks, lastVisited, dailyClicks, clickHistory, breakdowns } = report;
  const shortUrl = getFullShortUrl(url.short_code);
  const isExpired = url.expires_at && new Date(url.expires_at) < new Date();
  const maxClicks = Math.max(...dailyClicks.map(d => d.clicks), 1);
  const getPercentageList = (list: BreakdownItem[]) => {
    if (!list || list.length === 0) return [];
    const total = list.reduce((sum, item) => sum + item.value, 0);
    return list.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
  };
  return (
    <div className="space-y-8 animate-fade-in text-zinc-800 dark:text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/links')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => copyToClipboard(shortUrl)} className="text-xs gap-1.5 cursor-pointer">
            <Copy className="w-3.5 h-3.5" /> Copy link
          </Button>
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Link Card</span>
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">/{url.custom_alias || url.short_code}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 select-all break-all">{url.original_url}</p>
          </div>
          <div className="shrink-0">
            {url.is_active && !isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Working
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Clicks"
          value={totalClicks}
          subtext="Total clicks for this link"
          icon={MousePointerClick}
        />
        <StatCard
          title="Last Click"
          value={
            lastVisited 
              ? new Date(lastVisited).toLocaleDateString()
              : 'Never'
          }
          subtext={
            lastVisited 
              ? `At ${new Date(lastVisited).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
              : 'No clicks yet'
          }
          icon={Clock}
        />
        <StatCard
          title="Created On"
          value={new Date(url.created_at).toLocaleDateString()}
          subtext={
            url.expires_at 
              ? `Expires: ${new Date(url.expires_at).toLocaleDateString()}` 
              : 'Expires: Never'
          }
          icon={Calendar}
        />
      </div>
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Clicks Over Past 2 Weeks</h2>
        {dailyClicks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm font-medium">
            No click stats available for this period.
          </div>
        ) : (
          <div className="flex items-end justify-between gap-1.5 h-48 px-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 pt-8 pb-3">
            {dailyClicks.map((d) => {
              const heightPercent = (d.clicks / maxClicks) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative cursor-pointer">
                  <span className="absolute -top-6 text-[9px] bg-zinc-800 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 pointer-events-none font-bold whitespace-nowrap">
                    {d.clicks} clicks
                  </span>
                  <div 
                    className="bg-zinc-900 group-hover:bg-zinc-700 dark:bg-zinc-100 dark:group-hover:bg-zinc-300 rounded-t w-full transition-all duration-300 min-h-[4px]" 
                    style={{ height: `${heightPercent || 4}%` }} 
                  />
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold truncate max-w-[32px]">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Devices
          </h3>
          {breakdowns.device.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No device stats available.</p>
          ) : (
            <div className="space-y-4">
              {getPercentageList(breakdowns.device).map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span>{item.name}</span>
                    <span>{item.value} ({Math.round(item.percentage ?? 0)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Web Browsers
          </h3>
          {breakdowns.browser.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No browser stats available.</p>
          ) : (
            <div className="space-y-4">
              {getPercentageList(breakdowns.browser).map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span>{item.name}</span>
                    <span>{item.value} ({Math.round(item.percentage ?? 0)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Operating Systems
          </h3>
          {breakdowns.os.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No OS stats available.</p>
          ) : (
            <div className="space-y-4">
              {getPercentageList(breakdowns.os).map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span>{item.name}</span>
                    <span>{item.value} ({Math.round(item.percentage ?? 0)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> Recent Clicks
        </h2>
        <Table>
          <Thead>
            <Tr>
              <Th>Date & Time</Th>
              <Th>IP Address</Th>
              <Th>Details</Th>
            </Tr>
          </Thead>
          <Tbody isEmpty={clickHistory.length === 0} colSpan={3}>
            {clickHistory.map((visit) => (
              <Tr key={visit.id}>
                <Td className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                  {new Date(visit.visited_at).toLocaleString()}
                </Td>
                <Td className="text-zinc-500 dark:text-zinc-400 select-all font-medium text-xs">
                  {visit.ip_address}
                </Td>
                <Td className="text-zinc-400 dark:text-zinc-500 text-xs truncate max-w-sm select-all" title={visit.user_agent}>
                  {visit.user_agent}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
};
export default AnalyticsDetail;
